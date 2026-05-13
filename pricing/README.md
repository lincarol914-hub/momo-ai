# Momo AI Pricing Engine

AI commercial property insurance pricing engine — Poisson frequency +
Gamma severity LightGBM models trained on real property insurance data,
with a Companies House client and a FastAPI service so other Momo apps
can call into it over HTTP.

```
pricing/
├── pricing_engine.py        # load + clean + feature engineer + train + price
├── companies_house.py       # CH API client (auth, caching, rate limiting)
├── api.py                   # FastAPI service (optional)
├── requirements.txt         # core deps
├── requirements-api.txt     # adds FastAPI + uvicorn + pydantic
├── data/                    # gitignored; drop datasets here
├── models/                  # gitignored; bundle.joblib lives here
└── cache/                   # gitignored; Companies House response cache
```

## Setup

```bash
cd pricing
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### 1. Get the training data

The pipeline runs against either dataset (or both).

**Mendeley homeowners (recommended starting point — small, clean):**

1. Download from https://data.mendeley.com/datasets/vfchtm5y7j/1
2. Save the CSV as `pricing/data/mendeley.csv`

**FEMA NFIP redacted claims (optional, much larger):**

1. Download from https://www.fema.gov/openfema-data-page/fima-nfip-redacted-claims-v2
2. Save the CSV as `pricing/data/fema_claims.csv`

### 2. Set the Companies House API key

Get a free key from https://developer.company-information.service.gov.uk/.

```bash
export COMPANIES_HOUSE_API_KEY=your_key_here
```

## Run

### Train + run the three demos

```bash
python pricing_engine.py
```

On first run this trains the models (writes `models/bundle.joblib`),
prints test-set metrics, then runs the three demos. Subsequent runs
reuse the saved bundle.

Expected demo output (numbers will vary with your trained model):

```
==================================================
MOMO AI - COMMERCIAL PROPERTY QUOTE
==================================================
Company:         GREGGS PLC
Reg Number:      00502851
SIC:             10710, 56102
Status:          active
Postcode:        NE12 8BU
Company Age:     72 years
--------------------------------------------------
Sum Insured:     £500,000
Building Age:    20 years
Construction:    brick
Sprinklers:      Yes
Prior Claims:    0
--------------------------------------------------
Expected Loss:   £1,840
Gross Premium:   £2,830
Confidence:      £1,260 - £4,690
Loss Ratio Tgt:  65%
--------------------------------------------------
DATA SOURCE: mendeley model | trained 2026-05-13 22:14:55
==================================================
```

### Run the HTTP service

```bash
pip install -r requirements-api.txt
uvicorn api:app --reload --port 8001
```

Then from any other app:

```bash
# Quote from property fields only
curl -X POST http://localhost:8001/quote \
  -H 'content-type: application/json' \
  -d '{"sum_insured": 500000, "building_age": 20, "construction": "brick",
       "sprinklers": true, "floors": 1, "prior_claims": 0, "sic_code": "56102",
       "postcode": "NE12 8BU"}'

# Quote from a Companies House name or number + property fields
curl -X POST http://localhost:8001/quote/from-company \
  -H 'content-type: application/json' \
  -d '{"name_or_number": "GREGGS PLC",
       "property": {"sum_insured": 500000, "building_age": 20,
                    "construction": "brick", "sprinklers": true,
                    "floors": 1, "prior_claims": 0}}'

# Look up a company
curl http://localhost:8001/company/GREGGS%20PLC
```

## Wire it into the Momo React app

The React `Autopilot` flow already mocks the pricing engine in
`src/lib/pricing.ts` and the CH lookup in `src/lib/companiesHouse.ts`.
Swap the mock bodies for `fetch()` calls against this service and the
rest of the UI keeps working unchanged. Until you do that, leave the
mocks in place — they keep the demo runnable without a backend.

## What's where (in case you want to swap pieces)

| File / function                     | Responsibility                              |
| ----------------------------------- | ------------------------------------------- |
| `pricing_engine.load_data`          | Per-dataset loaders + quality reports.      |
| `pricing_engine.feature_engineer`   | Unified feature schema across datasets.     |
| `pricing_engine.train_models`       | 70/15/15 split, LightGBM Poisson + Gamma.   |
| `pricing_engine.price_policy`       | Expected loss, gross premium, confidence.   |
| `pricing_engine.translate_uk_commercial` | UK SME dict -> unified features.       |
| `pricing_engine.quote_from_company` | End-to-end CH lookup + quote print.         |
| `companies_house.enrich_company`    | Resolves a name/number, caches for 7 days.  |
| `api.app`                           | FastAPI routes that wrap everything above.  |

## Notes / TODOs

- Companies House does not expose turnover or employee bands directly;
  those need XBRL parsing of filed accounts. Returned as `None` today.
- UK location risk defaults to the middle quintile (no UK loss data yet);
  swap once UK postcode loss density is available.
- `has_sprinklers` is not reliably present in either public dataset; we
  impute 0 in training and let the UK input override at scoring time.
- The literal-prompt premium formula `expected_loss / (1 - 0.65)` would
  imply a 35% loss ratio; this implementation uses `expected_loss /
  TARGET_LOSS_RATIO` (== `/0.65`) which matches the stated 65% target.
  Adjust `TARGET_LOSS_RATIO` if you disagree.
