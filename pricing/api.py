"""
HTTP service that exposes Momo's pricing engine to other apps.

Endpoints
---------
``GET  /health`` — liveness check.
``GET  /company/{name_or_number}`` — Companies House enrichment.
``POST /quote`` — quote from property fields only.
``POST /quote/from-company`` — quote from a CH name/number + property fields.

Run
---
::

    pip install -r requirements-api.txt
    export COMPANIES_HOUSE_API_KEY=...
    uvicorn api:app --reload --port 8001
"""
from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from companies_house import enrich_company
from pricing_engine import (
    ModelBundle,
    load_or_train,
    price_policy,
    quote_partial,
    translate_uk_commercial,
)

app = FastAPI(title="Momo AI Pricing", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

_BUNDLE: Optional[ModelBundle] = None


def _bundle() -> ModelBundle:
    global _BUNDLE
    if _BUNDLE is None:
        _BUNDLE = load_or_train()
    return _BUNDLE


class PropertyRequest(BaseModel):
    """Property fields for a quote — all optional.

    Anything you don't send falls through to the engine's UK SME defaults
    (£500k sum insured, age 25, masonry, no sprinklers, 1 floor, 0 prior
    claims) and the confidence band widens to reflect the missing inputs.
    """

    postcode: Optional[str] = None
    sic_code: Optional[str] = None
    sum_insured: Optional[float] = Field(default=None, gt=0)
    building_age: Optional[int] = Field(default=None, ge=0, le=300)
    construction: Optional[str] = None
    sprinklers: Optional[bool] = None
    floors: Optional[int] = Field(default=None, ge=1, le=200)
    prior_claims: Optional[int] = Field(default=None, ge=0)


class CompanyQuoteRequest(BaseModel):
    name_or_number: str
    property: Optional[PropertyRequest] = None


class QuoteResponse(BaseModel):
    expected_loss: float
    gross_premium: float
    confidence_low: float
    confidence_high: float
    confidence: str
    completeness: Dict[str, Any]
    loading_breakdown: Dict[str, Any]
    company: Optional[Dict[str, Any]] = None
    model_source: str
    trained_at: str


def _to_response(quote: Dict[str, Any], company: Optional[Dict[str, Any]] = None) -> QuoteResponse:
    p10, p90 = quote["confidence_band"]
    return QuoteResponse(
        expected_loss=quote["expected_loss"],
        gross_premium=quote["gross_premium"],
        confidence_low=p10,
        confidence_high=p90,
        confidence=quote.get("confidence", "high"),
        completeness=quote.get("completeness", {}),
        loading_breakdown=quote["loading_breakdown"],
        company=company,
        model_source=quote["model_source"],
        trained_at=quote["trained_at"],
    )


def _filter_provided(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Drop None values so the engine treats them as missing."""
    return {k: v for k, v in payload.items() if v is not None}


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/company/{name_or_number}")
def get_company(name_or_number: str) -> Dict[str, Any]:
    co = enrich_company(name_or_number)
    if not co:
        raise HTTPException(status_code=404, detail="Company not found")
    return co


@app.post("/quote", response_model=QuoteResponse)
def post_quote(req: PropertyRequest) -> QuoteResponse:
    bundle = _bundle()
    quote = quote_partial(_filter_provided(req.model_dump()), bundle=bundle)
    return _to_response(quote)


@app.post("/quote/from-company", response_model=QuoteResponse)
def post_quote_from_company(req: CompanyQuoteRequest) -> QuoteResponse:
    co = enrich_company(req.name_or_number) or {}
    bundle = _bundle()
    payload = _filter_provided(req.property.model_dump() if req.property else {})
    payload.setdefault("postcode", co.get("postcode"))
    if not payload.get("sic_code") and co.get("sic_codes"):
        payload["sic_code"] = co["sic_codes"][0]
    quote = quote_partial(payload, bundle=bundle)
    return _to_response(quote, company=co or None)
