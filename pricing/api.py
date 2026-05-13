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
    postcode: Optional[str] = None
    sic_code: Optional[str] = None
    sum_insured: float = Field(..., gt=0)
    building_age: int = Field(0, ge=0, le=300)
    construction: str = "brick"
    sprinklers: bool = False
    floors: int = Field(1, ge=1, le=200)
    prior_claims: int = Field(0, ge=0)


class CompanyQuoteRequest(BaseModel):
    name_or_number: str
    property: PropertyRequest


class QuoteResponse(BaseModel):
    expected_loss: float
    gross_premium: float
    confidence_low: float
    confidence_high: float
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
        loading_breakdown=quote["loading_breakdown"],
        company=company,
        model_source=quote["model_source"],
        trained_at=quote["trained_at"],
    )


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
    translated = translate_uk_commercial(req.model_dump(), bundle=bundle)
    quote = price_policy(translated["features"], bundle=bundle)
    return _to_response(quote)


@app.post("/quote/from-company", response_model=QuoteResponse)
def post_quote_from_company(req: CompanyQuoteRequest) -> QuoteResponse:
    co = enrich_company(req.name_or_number) or {}
    bundle = _bundle()
    payload = req.property.model_dump()
    payload.setdefault("postcode", co.get("postcode"))
    if not payload.get("sic_code"):
        payload["sic_code"] = (co.get("sic_codes") or [None])[0]
    translated = translate_uk_commercial(payload, bundle=bundle)
    quote = price_policy(translated["features"], bundle=bundle)
    return _to_response(quote, company=co or None)
