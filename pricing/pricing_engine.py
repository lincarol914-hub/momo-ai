"""
Momo AI commercial property pricing engine.

Two LightGBM models — Poisson frequency + Gamma severity — trained on
real property insurance data (Mendeley homeowners by default, optionally
FEMA NFIP redacted claims). Public surface:

    load_data(dataset)              # load + clean a dataset
    feature_engineer(df, source)    # unified feature set across sources
    train_models(df, source)        # fit + evaluate + save bundle to disk
    load_or_train()                 # idempotent: load saved bundle or train
    price_policy(features)          # quote a single risk
    translate_uk_commercial(co)     # UK SME dict -> model features
    quote_from_company(...)         # end-to-end: CH lookup + quote print

Running this file directly trains the models if no bundle exists and then
runs three demos.

All UK-specific assumptions (SIC -> occupancy, postcode -> location risk)
are documented inline so they can be replaced as real UK data becomes
available.
"""
from __future__ import annotations

import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.metrics import mean_gamma_deviance, mean_poisson_deviance
from sklearn.model_selection import train_test_split

# --------------------------------------------------------------------------- #
# Paths and constants
# --------------------------------------------------------------------------- #
THIS_DIR = Path(__file__).resolve().parent
DATA_DIR = THIS_DIR / "data"
MODELS_DIR = THIS_DIR / "models"
CACHE_DIR = THIS_DIR / "cache"
for _d in (DATA_DIR, MODELS_DIR, CACHE_DIR):
    _d.mkdir(exist_ok=True)

BUNDLE_PATH = MODELS_DIR / "bundle.joblib"

# Pricing knobs — adjust to your appetite.
TARGET_LOSS_RATIO = 0.65      # loss / premium target
EXPENSE_LOAD = 0.25           # expenses as % of premium
PROFIT_LOAD = 0.10            # profit margin as % of premium
PRIOR_CLAIMS_CAP = 5
N_BOOTSTRAP = 100
DEFAULT_GAMMA_SHAPE = 2.0     # fallback if shape can't be estimated

# Confidence -> extra spread on the price band when inputs are partial.
# Matches the React side's SPREAD constants in src/lib/pricing.ts so the
# customer experience is the same whether the quote comes from the in-
# browser mock or this service.
CONFIDENCE_SPREAD: Dict[str, float] = {"low": 0.40, "medium": 0.18, "high": 0.05}

# Defaults used when a property field is not supplied — chosen to be
# plausible UK SME midpoints, not aggressive in either direction.
PARTIAL_DEFAULTS: Dict[str, Any] = {
    "sum_insured": 500_000.0,
    "building_age": 25,
    "construction": "masonry",
    "sprinklers": False,
    "floors": 1,
    "prior_claims": 0,
}

# Fields we look at when assessing how much info we have.
PROPERTY_FIELDS = list(PARTIAL_DEFAULTS.keys())
ENRICHMENT_FIELDS = ["postcode", "sic_code"]

# Feature schema vocab — kept stable so we can one-hot deterministically.
CONSTRUCTION_LEVELS = ["masonry", "timber", "steel", "mixed"]
OCCUPANCY_LEVELS = ["residential", "commercial", "mixed"]


# --------------------------------------------------------------------------- #
# Model bundle
# --------------------------------------------------------------------------- #
@dataclass
class ModelBundle:
    """Trained models plus the metadata needed to score new policies."""

    freq_model: lgb.LGBMRegressor
    sev_model: lgb.LGBMRegressor
    location_quintiles: Dict[str, int]
    feature_columns: List[str]
    gamma_shape: float
    source: str
    trained_at: str
    metrics: Dict[str, float] = field(default_factory=dict)


# --------------------------------------------------------------------------- #
# Feature helpers
# --------------------------------------------------------------------------- #
def _band_age(age: Any) -> int:
    """Bucket building age into 0-3 (0-10, 11-25, 26-50, 51+)."""
    if pd.isna(age):
        return 1
    age = float(age)
    if age <= 10:
        return 0
    if age <= 25:
        return 1
    if age <= 50:
        return 2
    return 3


def _band_floors(n: Any) -> int:
    """Bucket floors into 0-2 (1, 2-3, 4+)."""
    if pd.isna(n):
        return 0
    n = float(n)
    if n <= 1:
        return 0
    if n <= 3:
        return 1
    return 2


def _normalise_construction(raw: Any) -> str:
    """Map any inbound string into one of CONSTRUCTION_LEVELS."""
    if not isinstance(raw, str):
        return "masonry"
    r = raw.lower()
    if "brick" in r or "mason" in r or "concrete" in r or "stone" in r:
        return "masonry"
    if "wood" in r or "timber" in r or "frame" in r:
        return "timber"
    if "steel" in r or "metal" in r:
        return "steel"
    return "mixed"


def _normalise_occupancy(raw: Any) -> str:
    """Map any inbound string into one of OCCUPANCY_LEVELS."""
    if not isinstance(raw, str):
        return "residential"
    r = raw.lower()
    if "comm" in r or "retail" in r or "office" in r or "food" in r or "shop" in r:
        return "commercial"
    if "mix" in r:
        return "mixed"
    return "residential"


def _one_hot(values: pd.Series, levels: List[str], prefix: str) -> pd.DataFrame:
    """Stable one-hot: every level always present, in declared order."""
    return pd.DataFrame(
        {f"{prefix}_{lv}": (values == lv).astype(int) for lv in levels},
        index=values.index,
    )


def _build_location_quintiles(
    df: pd.DataFrame, loc_col: str, target_col: str
) -> Dict[str, int]:
    """Compute per-location quintile buckets from observed loss density."""
    agg = (
        df.groupby(loc_col)[target_col]
        .mean()
        .replace([np.inf, -np.inf], np.nan)
        .dropna()
        .sort_values()
    )
    if len(agg) < 5:
        return {str(k): 2 for k in agg.index}
    bins = pd.qcut(agg, q=5, labels=False, duplicates="drop")
    return {str(k): int(v) for k, v in bins.items()}


def _apply_quintiles(
    values: pd.Series, mapping: Dict[str, int], default: int = 2
) -> pd.Series:
    return values.astype(str).map(mapping).fillna(default).astype(int)


def _print_quality(df: pd.DataFrame, label: str) -> None:
    print(f"[{label}] rows={len(df):,} cols={df.shape[1]}")
    nulls = df.isna().mean().sort_values(ascending=False)
    top = nulls[nulls > 0].head(8)
    if len(top):
        print(f"[{label}] null rate (top 8):")
        for col, rate in top.items():
            print(f"  {col:32s} {rate:6.2%}")
    else:
        print(f"[{label}] no nulls")


# --------------------------------------------------------------------------- #
# Data loaders
# --------------------------------------------------------------------------- #
def _load_mendeley() -> pd.DataFrame:
    """Load and aggregate the Mendeley homeowners dataset (vfchtm5y7j)."""
    path = DATA_DIR / "mendeley.csv"
    if not path.exists():
        raise FileNotFoundError(
            f"Mendeley dataset not found at {path}.\n"
            "Download from https://data.mendeley.com/datasets/vfchtm5y7j/1 "
            "and save the CSV at the path above."
        )
    raw = pd.read_csv(path)
    _print_quality(raw, "mendeley.raw")

    expected = {
        "PolID",
        "year",
        "building_value",
        "location",
        "dwelling_type",
        "claim_count_home",
        "claim_amount_home",
        "premium_home",
    }
    missing = expected - set(raw.columns)
    if missing:
        raise ValueError(
            f"Mendeley CSV is missing expected columns: {sorted(missing)}. "
            f"Found columns: {sorted(raw.columns)}"
        )

    # Aggregate to one row per policy.
    agg = (
        raw.groupby("PolID")
        .agg(
            years_observed=("year", "nunique"),
            claim_count_home=("claim_count_home", "sum"),
            claim_amount_home=("claim_amount_home", "sum"),
            building_value=("building_value", "mean"),
            location=("location", "first"),
            dwelling_type=("dwelling_type", "first"),
            premium_home=("premium_home", "sum"),
        )
        .reset_index()
    )
    agg["claim_freq"] = agg["claim_count_home"] / agg["years_observed"].clip(lower=1)
    agg["claim_sev"] = np.where(
        agg["claim_count_home"] > 0,
        agg["claim_amount_home"] / agg["claim_count_home"].clip(lower=1),
        np.nan,
    )
    _print_quality(agg, "mendeley.policy")
    return agg


def _load_fema() -> pd.DataFrame:
    """Load and clean the FEMA NFIP Redacted Claims V2 dataset.

    The published schema is claims-only (no policy denominator), so:
    - **Severity** is trained per-claim on ``amountPaidOnBuildingClaim``.
    - **Frequency** is approximated as the per-ZIP annual claim rate
      (claims at the ZIP / years of data at the ZIP). Every row in a
      given ZIP gets that ZIP's rate as its frequency target, which lets
      the model learn features -> zip-level claim density. To turn that
      into a per-policy rate at scoring time you need to divide by the
      number of policies in the ZIP — that calibration constant lives
      outside this engine (set ``FEMA_FREQ_CALIBRATION`` if you have it).
    - ``buildingAge`` is derived from ``originalConstructionDate`` and
      ``yearOfLoss``. FEMA uses a 1492-10-12 sentinel for unknown
      construction dates; those rows get ``NaN`` and the median band.
    - Numeric ``occupancyType`` is mapped to residential / commercial / mixed.
    """
    path = DATA_DIR / "fema_claims.csv"
    if not path.exists():
        raise FileNotFoundError(
            f"FEMA NFIP claims not found at {path}.\n"
            "Download from https://www.fema.gov/openfema-data-page/"
            "fima-nfip-redacted-claims-v2"
        )
    cols = [
        "amountPaidOnBuildingClaim",
        "buildingPropertyValue",
        "buildingDamageAmount",
        "totalBuildingInsuranceCoverage",
        "occupancyType",
        "ratedFloodZone",
        "yearOfLoss",
        "numberOfFloorsInTheInsuredBuilding",
        "originalConstructionDate",
        "reportedZipCode",
        "waterDepth",
        "state",
    ]
    raw = pd.read_csv(path, usecols=lambda c: c in cols, low_memory=False)
    _print_quality(raw, "fema.raw")

    raw = raw[
        raw["buildingPropertyValue"].fillna(0).gt(0)
        & raw["amountPaidOnBuildingClaim"].fillna(0).gt(0)
    ].copy()

    cap = raw["amountPaidOnBuildingClaim"].quantile(0.99)
    raw["amountPaidOnBuildingClaim"] = raw["amountPaidOnBuildingClaim"].clip(upper=cap)

    # ZIP-level annual claim rate as the frequency target.
    raw["reportedZipCode"] = raw["reportedZipCode"].astype("Int64").astype(str)
    zip_stats = (
        raw.groupby("reportedZipCode")["yearOfLoss"]
        .agg(["min", "max", "count"])
        .rename(columns={"count": "claims"})
    )
    zip_stats["years"] = (zip_stats["max"] - zip_stats["min"] + 1).clip(lower=1)
    zip_stats["rate"] = zip_stats["claims"] / zip_stats["years"]
    raw = raw.merge(
        zip_stats[["rate"]], left_on="reportedZipCode", right_index=True, how="left"
    )

    # buildingAge from originalConstructionDate. Filter the 1492 sentinel.
    construction_year = pd.to_datetime(
        raw["originalConstructionDate"], errors="coerce", utc=True
    ).dt.year
    construction_year = construction_year.where(construction_year >= 1700)
    raw["buildingAge"] = (raw["yearOfLoss"] - construction_year).clip(lower=0)

    # Numeric occupancy code -> text. Codes 1-3, 11 are residential;
    # 4, 6, 12, 14-18 are commercial / non-residential; rest mixed.
    occ_map = {
        1: "residential", 2: "residential", 3: "residential", 11: "residential",
        4: "commercial", 6: "commercial", 12: "commercial", 14: "commercial",
        15: "commercial", 16: "commercial", 17: "commercial", 18: "commercial",
    }
    raw["occupancy_text"] = raw["occupancyType"].map(occ_map).fillna("mixed")

    # Unified training columns.
    raw["claim_freq"] = raw["rate"].astype(float)
    raw["claim_sev"] = raw["amountPaidOnBuildingClaim"].astype(float)
    raw["claim_count_home"] = 1
    raw["claim_amount_home"] = raw["amountPaidOnBuildingClaim"].astype(float)
    raw["years_observed"] = 1
    raw["building_value"] = raw["buildingPropertyValue"].astype(float)
    raw["location"] = raw["reportedZipCode"].astype(str)
    raw["dwelling_type"] = raw["occupancy_text"]
    raw["numberOfFloors"] = raw["numberOfFloorsInTheInsuredBuilding"]
    # No constructionType in FEMA — leave the field absent and let the
    # feature engineer default to masonry.

    # Drop rows where ZIP didn't resolve to a rate, or building age is NaN.
    raw = raw.dropna(subset=["claim_freq", "claim_sev", "building_value"]).copy()
    raw["buildingAge"] = raw["buildingAge"].fillna(raw["buildingAge"].median())

    _print_quality(raw, "fema.clean")
    return raw


def load_data(dataset: str) -> pd.DataFrame:
    """Load and clean one of the supported datasets.

    Args:
        dataset: ``"mendeley"`` or ``"fema"``.

    Returns:
        A DataFrame with at minimum ``claim_freq``, ``claim_sev``,
        ``building_value``, ``years_observed``, ``location``, and
        ``dwelling_type`` columns, plus any dataset-specific extras.
    """
    dataset = dataset.lower()
    if dataset == "mendeley":
        return _load_mendeley()
    if dataset == "fema":
        return _load_fema()
    raise ValueError(f"Unknown dataset {dataset!r}. Use 'mendeley' or 'fema'.")


# --------------------------------------------------------------------------- #
# Feature engineering
# --------------------------------------------------------------------------- #
def feature_engineer(
    df: pd.DataFrame,
    source: str,
    location_quintiles: Optional[Dict[str, int]] = None,
) -> Tuple[pd.DataFrame, Dict[str, int]]:
    """Produce the unified feature set for either dataset.

    Returns ``(features, location_quintiles)``. Pass the previously fitted
    ``location_quintiles`` back when scoring new policies.
    """
    source = source.lower()
    out = pd.DataFrame(index=df.index)
    out["building_value_log"] = np.log1p(df["building_value"].fillna(0).astype(float))

    if source == "fema" and "buildingAge" in df.columns:
        out["building_age_band"] = df["buildingAge"].apply(_band_age).astype(int)
    else:
        out["building_age_band"] = 1

    construction_series = (
        df.get("constructionType", pd.Series(index=df.index))
        .fillna("")
        .apply(_normalise_construction)
    )
    out = pd.concat(
        [out, _one_hot(construction_series, CONSTRUCTION_LEVELS, "construction")],
        axis=1,
    )

    occupancy_series = (
        df.get("dwelling_type", pd.Series(index=df.index))
        .fillna("")
        .apply(_normalise_occupancy)
    )
    if source == "mendeley":
        occupancy_series = occupancy_series.where(occupancy_series != "", "residential")
    out = pd.concat(
        [out, _one_hot(occupancy_series, OCCUPANCY_LEVELS, "occupancy")],
        axis=1,
    )

    if location_quintiles is None:
        target_for_quintiles = (
            df["claim_sev"].fillna(0) * df["claim_freq"].fillna(0)
        )
        loc_df = pd.DataFrame(
            {"location": df["location"].astype(str), "target": target_for_quintiles}
        )
        location_quintiles = _build_location_quintiles(loc_df, "location", "target")
    out["location_risk"] = _apply_quintiles(df["location"].astype(str), location_quintiles)

    if "prior_claims" in df.columns:
        out["prior_claims_count"] = (
            df["prior_claims"].clip(upper=PRIOR_CLAIMS_CAP).fillna(0).astype(int)
        )
    else:
        out["prior_claims_count"] = 0

    if "numberOfFloors" in df.columns:
        out["floors_band"] = df["numberOfFloors"].apply(_band_floors).astype(int)
    else:
        out["floors_band"] = 0

    # Neither published dataset carries sprinklers reliably — default 0.
    out["has_sprinklers"] = 0

    return out, location_quintiles


# --------------------------------------------------------------------------- #
# Metrics
# --------------------------------------------------------------------------- #
def _normalised_gini(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    weights: Optional[np.ndarray] = None,
) -> float:
    """Weighted normalised Gini (1.0 = perfect rank, 0.0 = random)."""
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    w = np.ones_like(y_true) if weights is None else np.asarray(weights, dtype=float)

    def _gini(order: np.ndarray) -> float:
        t = y_true[order]
        ww = w[order]
        cum_t = np.cumsum(t * ww)
        cum_w = np.cumsum(ww)
        if cum_t[-1] == 0 or cum_w[-1] == 0:
            return 0.0
        L = cum_t / cum_t[-1]
        F = cum_w / cum_w[-1]
        return float(np.sum(L[1:] * F[:-1] - L[:-1] * F[1:]))

    g = _gini(np.argsort(-y_pred))
    g_perfect = _gini(np.argsort(-y_true))
    return g / g_perfect if g_perfect != 0 else 0.0


# --------------------------------------------------------------------------- #
# Training
# --------------------------------------------------------------------------- #
def train_models(df: pd.DataFrame, source: str) -> ModelBundle:
    """Train Poisson frequency + Gamma severity models on a 70/15/15 split.

    Persists the resulting bundle to ``models/bundle.joblib`` so subsequent
    runs can skip retraining.
    """
    features, location_quintiles = feature_engineer(df, source)
    feature_cols = list(features.columns)

    train_idx, hold_idx = train_test_split(df.index, test_size=0.30, random_state=42)
    val_idx, test_idx = train_test_split(hold_idx, test_size=0.50, random_state=42)

    X_train = features.loc[train_idx]
    X_val = features.loc[val_idx]
    X_test = features.loc[test_idx]

    y_freq = df["claim_freq"].astype(float).clip(lower=0)
    exposure = df["years_observed"].astype(float).clip(lower=1)

    freq_model = lgb.LGBMRegressor(
        objective="poisson",
        n_estimators=400,
        learning_rate=0.05,
        num_leaves=31,
        min_child_samples=50,
        random_state=42,
    )
    freq_model.fit(
        X_train,
        y_freq.loc[train_idx],
        sample_weight=exposure.loc[train_idx],
        eval_set=[(X_val, y_freq.loc[val_idx])],
        eval_sample_weight=[exposure.loc[val_idx].values],
        callbacks=[lgb.early_stopping(stopping_rounds=30, verbose=False)],
    )

    sev_mask = df["claim_count_home"] > 0
    sev_train_idx = train_idx[sev_mask.loc[train_idx].values]
    sev_val_idx = val_idx[sev_mask.loc[val_idx].values]
    sev_test_idx = test_idx[sev_mask.loc[test_idx].values]

    sev_model = lgb.LGBMRegressor(
        objective="gamma",
        n_estimators=400,
        learning_rate=0.05,
        num_leaves=31,
        min_child_samples=20,
        random_state=42,
    )
    sev_model.fit(
        features.loc[sev_train_idx],
        df.loc[sev_train_idx, "claim_sev"],
        sample_weight=df.loc[sev_train_idx, "claim_count_home"],
        eval_set=[(features.loc[sev_val_idx], df.loc[sev_val_idx, "claim_sev"])],
        eval_sample_weight=[df.loc[sev_val_idx, "claim_count_home"].values],
        callbacks=[lgb.early_stopping(stopping_rounds=30, verbose=False)],
    )

    # Estimate gamma shape from training severities (method of moments).
    sev_actual = df.loc[sev_train_idx, "claim_sev"].values
    mean_sev = float(np.mean(sev_actual)) if len(sev_actual) else 1.0
    std_sev = float(np.std(sev_actual)) if len(sev_actual) else 1.0
    cv = std_sev / mean_sev if mean_sev > 0 else 1.0
    gamma_shape = max(0.5, min(20.0, 1.0 / (cv ** 2))) if cv > 0 else DEFAULT_GAMMA_SHAPE

    # Test-set metrics
    freq_pred_test = freq_model.predict(X_test)
    sev_pred_test_all = sev_model.predict(X_test)
    actual_loss_test = (
        df.loc[test_idx, "claim_freq"].fillna(0)
        * df.loc[test_idx, "claim_sev"].fillna(0)
    ).values
    expected_loss_test = freq_pred_test * sev_pred_test_all

    sev_pred_test_pos = sev_model.predict(features.loc[sev_test_idx])
    sev_actual_test = df.loc[sev_test_idx, "claim_sev"].values
    sev_w_test = df.loc[sev_test_idx, "claim_count_home"].values

    metrics: Dict[str, float] = {
        "n_train": float(len(train_idx)),
        "n_val": float(len(val_idx)),
        "n_test": float(len(test_idx)),
        "freq_gini": _normalised_gini(
            y_freq.loc[test_idx].values, freq_pred_test, exposure.loc[test_idx].values
        ),
        "sev_gini": _normalised_gini(sev_actual_test, sev_pred_test_pos, sev_w_test),
        "freq_mean_deviance": float(
            mean_poisson_deviance(
                np.clip(y_freq.loc[test_idx].values, 1e-6, None),
                np.clip(freq_pred_test, 1e-6, None),
                sample_weight=exposure.loc[test_idx].values,
            )
        ),
        "sev_mean_deviance": float(
            mean_gamma_deviance(
                np.clip(sev_actual_test, 1e-3, None),
                np.clip(sev_pred_test_pos, 1e-3, None),
                sample_weight=sev_w_test,
            )
        ),
        "expected_loss_total": float(np.nansum(expected_loss_test)),
        "actual_loss_total": float(np.nansum(actual_loss_test)),
        "calibration_ratio": float(
            np.nansum(expected_loss_test) / max(np.nansum(actual_loss_test), 1e-6)
        ),
        "gamma_shape": float(gamma_shape),
    }

    print("\n=== Test-set metrics ===")
    for k, v in metrics.items():
        if isinstance(v, float):
            print(f"  {k:32s} {v:>14.4f}")
        else:
            print(f"  {k:32s} {v:>14}")
    print()

    bundle = ModelBundle(
        freq_model=freq_model,
        sev_model=sev_model,
        location_quintiles=location_quintiles,
        feature_columns=feature_cols,
        gamma_shape=float(gamma_shape),
        source=source,
        trained_at=time.strftime("%Y-%m-%d %H:%M:%S"),
        metrics=metrics,
    )
    joblib.dump(bundle, BUNDLE_PATH)
    print(f"Saved bundle to {BUNDLE_PATH}")
    return bundle


def load_or_train() -> ModelBundle:
    """Load the saved bundle, or train one from whichever dataset is on disk.

    Preference order: ``mendeley`` first (small + clean), then ``fema``
    (volume). Raises ``FileNotFoundError`` if neither is present.
    """
    if BUNDLE_PATH.exists():
        return joblib.load(BUNDLE_PATH)
    if (DATA_DIR / "mendeley.csv").exists():
        print("No trained bundle found — training on Mendeley.")
        return train_models(load_data("mendeley"), "mendeley")
    if (DATA_DIR / "fema_claims.csv").exists():
        print("No trained bundle found — training on FEMA NFIP.")
        return train_models(load_data("fema"), "fema")
    raise FileNotFoundError(
        f"No dataset in {DATA_DIR}. Drop mendeley.csv or fema_claims.csv first."
    )


# --------------------------------------------------------------------------- #
# Pricing
# --------------------------------------------------------------------------- #
def _features_to_row(features: Dict[str, Any], bundle: ModelBundle) -> pd.DataFrame:
    row = {col: 0 for col in bundle.feature_columns}
    for k, v in features.items():
        if k in row:
            row[k] = v
    return pd.DataFrame([row], columns=bundle.feature_columns)


def _bootstrap_loss(
    lam: float,
    mu_sev: float,
    gamma_shape: float,
    n: int = N_BOOTSTRAP,
    rng: Optional[np.random.Generator] = None,
) -> np.ndarray:
    """Sample ``n`` annual-loss outcomes from a compound Poisson-Gamma."""
    if rng is None:
        rng = np.random.default_rng(42)
    scale = max(mu_sev / max(gamma_shape, 1e-6), 1e-6)
    counts = rng.poisson(max(lam, 0.0), n)
    out = np.zeros(n)
    for i, c in enumerate(counts):
        if c == 0:
            continue
        out[i] = float(np.sum(rng.gamma(gamma_shape, scale, c)))
    return out


def price_policy(
    features: Dict[str, Any],
    bundle: Optional[ModelBundle] = None,
    confidence: str = "high",
) -> Dict[str, Any]:
    """Quote a single risk from a unified-feature dict.

    Missing feature keys default to 0, which means callers can toggle
    categorical levels by setting the appropriate one-hot column (e.g.
    ``construction_masonry=1``).

    ``confidence`` controls how much the price band widens to reflect
    uncertainty from missing inputs. ``"high"`` keeps the band as the raw
    bootstrap p10-p90; ``"medium"`` and ``"low"`` blend in an extra spread
    (±18% / ±40%) on top of the bootstrap so partial-info quotes don't
    pretend to be more precise than they are.

    Returns a dict with ``expected_loss``, ``gross_premium``,
    ``loading_breakdown``, ``confidence_band`` (low, high gross premium),
    plus the underlying frequency and severity predictions.
    """
    bundle = bundle or load_or_train()
    row = _features_to_row(features, bundle)

    lam = float(bundle.freq_model.predict(row)[0])
    mu_sev = float(bundle.sev_model.predict(row)[0])
    expected_loss = lam * mu_sev

    # Premium so that loss / premium == TARGET_LOSS_RATIO (65% by default).
    gross_premium = expected_loss / max(TARGET_LOSS_RATIO, 1e-6)

    loading_breakdown = {
        "expected_loss": expected_loss,
        "loss_component_pct": TARGET_LOSS_RATIO,
        "expense_load_pct": EXPENSE_LOAD,
        "profit_load_pct": PROFIT_LOAD,
        "expense_load": gross_premium * EXPENSE_LOAD,
        "profit_load": gross_premium * PROFIT_LOAD,
    }

    # Process variance from the compound Poisson-Gamma bootstrap.
    sims = _bootstrap_loss(lam, mu_sev, bundle.gamma_shape, n=N_BOOTSTRAP)
    process_low = float(np.quantile(sims, 0.10))
    process_high = float(np.quantile(sims, 0.90))

    # Parameter uncertainty from missing inputs.
    spread = CONFIDENCE_SPREAD.get(confidence, 0.05)
    param_low = expected_loss * (1.0 - spread)
    param_high = expected_loss * (1.0 + spread)

    # Combined band: take the widest of the two on each side, convert
    # to premium space.
    band_low_loss = max(0.0, min(process_low, param_low))
    band_high_loss = max(process_high, param_high)
    confidence_band = (
        band_low_loss / max(TARGET_LOSS_RATIO, 1e-6),
        band_high_loss / max(TARGET_LOSS_RATIO, 1e-6),
    )

    return {
        "expected_loss": expected_loss,
        "gross_premium": gross_premium,
        "loading_breakdown": loading_breakdown,
        "confidence_band": confidence_band,
        "confidence": confidence,
        "frequency": lam,
        "severity": mu_sev,
        "model_source": bundle.source,
        "trained_at": bundle.trained_at,
    }


def quote_partial(
    company: Dict[str, Any],
    bundle: Optional[ModelBundle] = None,
) -> Dict[str, Any]:
    """Price a policy with whatever fields are available.

    Auto-detects how complete the input is via :func:`assess_completeness`,
    fills missing fields from :data:`PARTIAL_DEFAULTS`, and widens the
    confidence band accordingly. Output is the same shape as
    :func:`price_policy` plus a ``completeness`` block listing what was
    provided, what was defaulted, and the resulting confidence level.
    """
    bundle = bundle or load_or_train()
    translated = translate_uk_commercial(company, bundle=bundle)
    ctx = translated["context"]
    quote = price_policy(
        translated["features"], bundle=bundle, confidence=ctx["confidence"]
    )
    quote["completeness"] = {
        "level": ctx["confidence"],
        "provided_fields": ctx["provided_fields"],
        "missing_fields": ctx["missing_fields"],
        "defaults_used": ctx["defaults_used"],
    }
    quote["context"] = ctx
    return quote


# --------------------------------------------------------------------------- #
# UK commercial translation
# --------------------------------------------------------------------------- #
# SIC 2007 first-two-digit -> Momo occupancy subtype. Inline so we can ship
# without a side table; replace with a richer lookup once UK loss data lands.
SIC_PREFIX_TO_SUBTYPE: Dict[str, str] = {
    "56": "commercial/food",      # food and beverage service
    "47": "commercial/retail",    # retail trade
    "68": "commercial/property",  # real estate activities
    "86": "commercial/medical",   # human health activities
}


def _sic_to_subtype(sic_code: Optional[str]) -> str:
    if not sic_code:
        return "commercial/other"
    return SIC_PREFIX_TO_SUBTYPE.get(str(sic_code).strip()[:2], "commercial/other")


def _is_provided(company: Dict[str, Any], key: str) -> bool:
    """True if a field was meaningfully supplied (not None / empty / zero)."""
    v = company.get(key)
    if v is None:
        return False
    if isinstance(v, str) and not v.strip():
        return False
    if key in {"sum_insured", "building_age", "floors"}:
        try:
            return float(v) > 0
        except (TypeError, ValueError):
            return False
    return True


def assess_completeness(company: Dict[str, Any]) -> Tuple[str, List[str], List[str]]:
    """Classify how much we know about the risk.

    Returns ``(confidence, provided_fields, missing_fields)`` where
    ``confidence`` is one of ``"low" / "medium" / "high"``.
    """
    provided: List[str] = []
    missing: List[str] = []
    for k in PROPERTY_FIELDS:
        (provided if _is_provided(company, k) else missing).append(k)
    for k in ENRICHMENT_FIELDS:
        if _is_provided(company, k):
            provided.append(k)
        # Enrichment fields aren't counted as "missing" — they're nice to have.

    score = len(provided) / float(len(PROPERTY_FIELDS) + len(ENRICHMENT_FIELDS))
    if score >= 0.75:
        confidence = "high"
    elif score >= 0.40:
        confidence = "medium"
    else:
        confidence = "low"
    return confidence, provided, missing


def translate_uk_commercial(
    company: Dict[str, Any],
    bundle: Optional[ModelBundle] = None,
) -> Dict[str, Any]:
    """Translate a UK SME company dict onto the unified feature schema.

    Every field is optional. Missing fields fall back to plausible UK SME
    midpoints from :data:`PARTIAL_DEFAULTS`. The returned ``context``
    records what was actually provided and what was defaulted, plus the
    overall ``confidence`` level for the resulting quote.

    Expected keys (all optional):
        postcode, sic_code, sum_insured, building_age, construction,
        sprinklers, floors, prior_claims, turnover, employees
    """
    bundle = bundle or load_or_train()
    confidence, provided, missing = assess_completeness(company)

    # Apply defaults for anything missing.
    filled = {**PARTIAL_DEFAULTS, **{k: company[k] for k in PROPERTY_FIELDS if _is_provided(company, k)}}

    sum_insured = float(filled["sum_insured"])
    building_age = int(filled["building_age"])
    construction = _normalise_construction(filled["construction"])
    sprinklers = bool(filled["sprinklers"])
    floors = int(filled["floors"])
    prior_claims = int(filled["prior_claims"])
    sic_code = str(company.get("sic_code") or "")
    postcode = str(company.get("postcode") or "")

    # Use the postcode area (first two characters) as the location key.
    # No UK loss data yet -> unmatched postcodes get the middle quintile.
    postcode_area = postcode.replace(" ", "").upper()[:2] or "UK"
    location_risk = bundle.location_quintiles.get(postcode_area, 2)

    features: Dict[str, Any] = {col: 0 for col in bundle.feature_columns}
    features["building_value_log"] = float(np.log1p(sum_insured))
    features["building_age_band"] = _band_age(building_age)
    if f"construction_{construction}" in features:
        features[f"construction_{construction}"] = 1
    if "occupancy_commercial" in features:
        features["occupancy_commercial"] = 1
    features["location_risk"] = location_risk
    features["prior_claims_count"] = min(prior_claims, PRIOR_CLAIMS_CAP)
    features["floors_band"] = _band_floors(floors)
    features["has_sprinklers"] = 1 if sprinklers else 0

    return {
        "features": features,
        "context": {
            "occupancy_subtype": _sic_to_subtype(sic_code),
            "postcode_area": postcode_area,
            "location_risk_quintile": location_risk,
            "construction_normalised": construction,
            "confidence": confidence,
            "provided_fields": provided,
            "missing_fields": missing,
            "defaults_used": {k: PARTIAL_DEFAULTS[k] for k in missing},
        },
    }


# --------------------------------------------------------------------------- #
# End-to-end and print helpers
# --------------------------------------------------------------------------- #
def _gbp(x: float) -> str:
    return f"£{x:,.0f}"


def _display_value(inputs: Dict[str, Any], key: str, defaults_used: Dict[str, Any]) -> str:
    """Show the value as-is, or mark it as a fallback default."""
    if key in defaults_used:
        return f"{inputs[key]} (default)"
    return str(inputs[key])


def _format_quote(
    company_meta: Dict[str, Any],
    inputs: Dict[str, Any],
    quote: Dict[str, Any],
) -> str:
    sep = "=" * 50
    dash = "-" * 50
    p10, p90 = quote["confidence_band"]
    completeness = quote.get("completeness", {})
    defaults_used = completeness.get("defaults_used", {})
    level = completeness.get("level", quote.get("confidence", "high"))
    provided = len(completeness.get("provided_fields", []))
    total = len(PROPERTY_FIELDS) + len(ENRICHMENT_FIELDS)

    sum_insured_str = _gbp(inputs["sum_insured"]) + (
        " (default)" if "sum_insured" in defaults_used else ""
    )
    return "\n".join(
        [
            sep,
            "MOMO AI - COMMERCIAL PROPERTY QUOTE",
            sep,
            f"Company:         {company_meta.get('company_name') or '(unknown)'}",
            f"Reg Number:      {company_meta.get('company_number') or '(unknown)'}",
            f"SIC:             {', '.join(company_meta.get('sic_codes') or []) or '(unknown)'}",
            f"Status:          {company_meta.get('status') or '(unknown)'}",
            f"Postcode:        {company_meta.get('postcode') or '(unknown)'}",
            f"Company Age:     {company_meta.get('company_age_years') if company_meta.get('company_age_years') is not None else '(unknown)'} years",
            dash,
            f"Sum Insured:     {sum_insured_str}",
            f"Building Age:    {_display_value(inputs, 'building_age', defaults_used)} years",
            f"Construction:    {_display_value(inputs, 'construction', defaults_used)}",
            f"Sprinklers:      {'Yes' if inputs['sprinklers'] else 'No'}{' (default)' if 'sprinklers' in defaults_used else ''}",
            f"Floors:          {_display_value(inputs, 'floors', defaults_used)}",
            f"Prior Claims:    {_display_value(inputs, 'prior_claims', defaults_used)}",
            dash,
            f"Expected Loss:   {_gbp(quote['expected_loss'])}",
            f"Gross Premium:   {_gbp(quote['gross_premium'])}",
            f"Confidence:      {_gbp(p10)} - {_gbp(p90)}  ({level}, {provided}/{total} fields)",
            f"Loss Ratio Tgt:  {int(TARGET_LOSS_RATIO * 100)}%",
            dash,
            f"DATA SOURCE: {quote['model_source']} model | trained {quote['trained_at']}",
            sep,
        ]
    )


def quote_from_company(
    name_or_number: str,
    sum_insured: Optional[float] = None,
    building_age: Optional[int] = None,
    construction: Optional[str] = None,
    sprinklers: Optional[bool] = None,
    floors: Optional[int] = None,
    prior_claims: Optional[int] = None,
) -> None:
    """End-to-end: CH enrichment, translation, partial-info pricing, print.

    All property fields are now optional. Anything omitted falls through
    to :data:`PARTIAL_DEFAULTS` and the confidence band widens.
    """
    # Lazy import so the engine doesn't require requests when only training.
    from companies_house import enrich_company

    co = enrich_company(name_or_number) or {}

    # Only pass through fields the caller actually supplied — letting
    # quote_partial / translate_uk_commercial decide what's missing.
    company_dict: Dict[str, Any] = {
        "postcode": co.get("postcode"),
        "sic_code": (co.get("sic_codes") or [None])[0],
    }
    raw_inputs: Dict[str, Optional[Any]] = {
        "sum_insured": sum_insured,
        "building_age": building_age,
        "construction": construction,
        "sprinklers": sprinklers,
        "floors": floors,
        "prior_claims": prior_claims,
    }
    for k, v in raw_inputs.items():
        if v is not None:
            company_dict[k] = v

    quote = quote_partial(company_dict)
    defaults_used = quote["completeness"]["defaults_used"]
    # Inputs that the print summary will display — fill from defaults.
    inputs = {**PARTIAL_DEFAULTS, **{k: v for k, v in raw_inputs.items() if v is not None}}
    print(_format_quote(co, inputs, quote))


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #
def _run_demos() -> None:
    print("\n--- Demo 1: Greggs — full data ---")
    quote_from_company("GREGGS PLC", 500_000, 20, "brick", True, 1, 0)
    print("\n--- Demo 2: Wetherspoon — full data ---")
    quote_from_company("WETHERSPOON", 2_000_000, 35, "mixed", False, 3, 2)
    print("\n--- Demo 3: unknown 12345678 — graceful CH miss ---")
    quote_from_company("12345678", 250_000, 50, "timber", False, 2, 1)
    print("\n--- Demo 4: partial — only sum insured ---")
    quote_from_company("GREGGS PLC", sum_insured=500_000)
    print("\n--- Demo 5: partial — only company number ---")
    quote_from_company("12345678")


if __name__ == "__main__":
    try:
        bundle = load_or_train()
    except FileNotFoundError as exc:
        print(exc)
        sys.exit(1)
    _run_demos()
