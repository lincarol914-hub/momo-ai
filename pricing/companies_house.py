"""
Companies House API client for the Momo pricing engine.

Public surface is a single function::

    enrich_company(name_or_number) -> dict | None

The endpoint is HTTP Basic-authenticated with the API key as the
username and an empty password. Get a free key at
https://developer.company-information.service.gov.uk/.

The module deliberately degrades gracefully — every field returned can
be ``None`` rather than crashing when CH doesn't expose it. ``turnover_estimate``
and ``employee_band`` are always ``None`` here because they require parsing
the XBRL inside filed accounts; that lives in a separate workstream.

Responses are cached on disk under ``cache/{number}.json`` for 7 days so
repeated lookups of the same company do not hit the API.
"""
from __future__ import annotations

import json
import os
import re
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Optional

import requests

API_BASE = "https://api.company-information.service.gov.uk"
THIS_DIR = Path(__file__).resolve().parent
CACHE_DIR = THIS_DIR / "cache"
CACHE_DIR.mkdir(exist_ok=True)
CACHE_TTL_DAYS = 7

# 600 req / 5 min = 2 req/s. 0.5s sleep leaves headroom for bursts.
RATE_LIMIT_SLEEP = 0.5
RETRY_SLEEP_429 = 60.0
TIMEOUT_SECS = 10.0

_COMPANY_NUMBER_RE = re.compile(r"^[A-Za-z0-9]{8}$")


class CompaniesHouseError(RuntimeError):
    """Raised for unrecoverable Companies House client errors."""


def _api_key() -> str:
    key = os.environ.get("COMPANIES_HOUSE_API_KEY")
    if not key:
        raise CompaniesHouseError(
            "Set COMPANIES_HOUSE_API_KEY before calling Companies House. "
            "Get a free key at "
            "https://developer.company-information.service.gov.uk/"
        )
    return key


def _is_company_number(s: str) -> bool:
    """A CH number is 8 alphanumeric characters (e.g. ``12345678`` or ``SC123456``)."""
    return bool(_COMPANY_NUMBER_RE.match(s.strip()))


def _cache_path(number: str) -> Path:
    safe = re.sub(r"[^A-Za-z0-9]", "_", number)
    return CACHE_DIR / f"{safe}.json"


def _read_cache(number: str) -> Optional[Dict[str, Any]]:
    path = _cache_path(number)
    if not path.exists():
        return None
    try:
        with path.open() as f:
            payload = json.load(f)
        cached_at = datetime.fromisoformat(payload.get("_cached_at", "1970-01-01T00:00:00+00:00"))
    except (OSError, json.JSONDecodeError, ValueError):
        return None
    if datetime.now(timezone.utc) - cached_at > timedelta(days=CACHE_TTL_DAYS):
        return None
    return payload


def _write_cache(number: str, payload: Dict[str, Any]) -> None:
    payload = dict(payload)
    payload["_cached_at"] = datetime.now(timezone.utc).isoformat()
    try:
        with _cache_path(number).open("w") as f:
            json.dump(payload, f)
    except OSError as exc:
        print(f"[companies_house] cache write failed: {exc}")


def _request(path: str, params: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    """Single GET with auth, rate-limit sleep, and a one-shot 429 retry."""
    time.sleep(RATE_LIMIT_SLEEP)
    try:
        resp = requests.get(
            f"{API_BASE}{path}",
            params=params,
            auth=(_api_key(), ""),
            timeout=TIMEOUT_SECS,
        )
    except requests.RequestException as exc:
        print(f"[companies_house] request error for {path}: {exc}")
        return None

    if resp.status_code == 429:
        print(f"[companies_house] 429 rate-limited on {path}; sleeping {RETRY_SLEEP_429:.0f}s")
        time.sleep(RETRY_SLEEP_429)
        try:
            resp = requests.get(
                f"{API_BASE}{path}",
                params=params,
                auth=(_api_key(), ""),
                timeout=TIMEOUT_SECS,
            )
        except requests.RequestException as exc:
            print(f"[companies_house] retry failed for {path}: {exc}")
            return None

    if resp.status_code == 404:
        return None
    if not resp.ok:
        print(f"[companies_house] {path} returned HTTP {resp.status_code}")
        return None
    try:
        return resp.json()
    except ValueError:
        return None


def _search_top(query: str) -> Optional[str]:
    data = _request("/search/companies", params={"q": query, "items_per_page": 5})
    if not data:
        return None
    items = data.get("items") or []
    if not items:
        return None
    items_sorted = sorted(items, key=lambda i: -float(i.get("score") or 0))
    top = items_sorted[0]
    return top.get("company_number")


def _profile(number: str) -> Optional[Dict[str, Any]]:
    return _request(f"/company/{number}")


def _accounts_history(number: str) -> Optional[Dict[str, Any]]:
    return _request(
        f"/company/{number}/filing-history",
        params={"category": "accounts", "items_per_page": 5},
    )


def _company_age_years(incorp_date: Optional[str]) -> Optional[int]:
    if not incorp_date:
        return None
    try:
        inc = datetime.fromisoformat(incorp_date).date()
    except ValueError:
        return None
    return max(0, (date.today() - inc).days // 365)


def _format_profile(
    profile: Dict[str, Any], accounts: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    addr = profile.get("registered_office_address") or {}
    last_accounts_date: Optional[str] = None
    if accounts:
        items = accounts.get("items") or []
        if items:
            last_accounts_date = items[0].get("date")
    return {
        "company_number": profile.get("company_number"),
        "company_name": profile.get("company_name"),
        "sic_codes": list(profile.get("sic_codes") or []),
        "postcode": addr.get("postal_code"),
        "address_line_1": addr.get("address_line_1"),
        "address_line_2": addr.get("address_line_2"),
        "locality": addr.get("locality"),
        "country": addr.get("country"),
        "incorporation_date": profile.get("date_of_creation"),
        "company_age_years": _company_age_years(profile.get("date_of_creation")),
        "status": profile.get("company_status"),
        "company_type": profile.get("type"),
        "last_accounts_date": last_accounts_date,
        # Filed accounts XBRL parsing is a separate workstream.
        "turnover_estimate": None,
        "employee_band": None,
    }


def enrich_company(name_or_number: str) -> Optional[Dict[str, Any]]:
    """Resolve a company name or number to a normalised profile dict.

    Args:
        name_or_number: 8-character CH number (e.g. ``"12345678"`` or
            ``"SC123456"``), or a search string (e.g. ``"GREGGS PLC"``).

    Returns:
        A dict with ``company_number``, ``company_name``, ``sic_codes``,
        ``postcode``, ``incorporation_date``, ``company_age_years``,
        ``status``, ``last_accounts_date``, ``turnover_estimate`` and
        ``employee_band``. Returns ``None`` if no match was found, or if
        the API key isn't set (so callers degrade gracefully).
    """
    query = (name_or_number or "").strip()
    if not query:
        return None

    try:
        if _is_company_number(query):
            number = query.upper()
        else:
            number = _search_top(query)
            if not number:
                print(f"[companies_house] no search result for {query!r}")
                return None

        cached = _read_cache(number)
        if cached is not None:
            return _format_profile(cached["profile"], cached.get("accounts"))

        profile = _profile(number)
        if not profile:
            print(f"[companies_house] no profile for {number}")
            return None
        accounts = _accounts_history(number)
        _write_cache(number, {"profile": profile, "accounts": accounts})
        return _format_profile(profile, accounts)
    except CompaniesHouseError as exc:
        print(f"[companies_house] skipping enrichment: {exc}")
        return None
