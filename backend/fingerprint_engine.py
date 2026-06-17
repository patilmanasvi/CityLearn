"""
CityLearn – Fingerprint Engine
================================
Responsible for:
  1. Loading and cleaning the raw traffic event dataset
  2. Feature engineering (time features, duration, peak-hour flag)
  3. Building the CityLearn Fingerprint object for every event
  4. Producing the canonical `fingerprint_text` string consumed by the
     Sentence Transformer in similarity_service.py

FastAPI integration: import `build_fingerprint` and `load_and_prepare_dataset`
into your route handlers.  All field names match the original dataset exactly.

Author : CityLearn – Data & Intelligence Module (Member 1)
"""

from __future__ import annotations

import json
import logging
import math
from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

# ─────────────────────────────────────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger("citylearn.fingerprint_engine")

# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────

# Peak-hour windows (inclusive) – adjust per city
PEAK_HOUR_MORNING_START = 7
PEAK_HOUR_MORNING_END   = 10
PEAK_HOUR_EVENING_START = 16
PEAK_HOUR_EVENING_END   = 20

# Priority mapping – handles both numeric and string variants
PRIORITY_MAP: Dict[Any, int] = {
    "low": 1, "1": 1, 1: 1,
    "medium": 2, "2": 2, 2: 2,
    "high": 3, "3": 3, 3: 3,
    "critical": 4, "4": 4, 4: 4,
    "emergency": 5, "5": 5, 5: 5,
}
DEFAULT_PRIORITY = 2

# Columns required for a usable fingerprint (hard-block on missing)
REQUIRED_COLUMNS = ["id", "event_type", "latitude", "longitude", "start_datetime"]

# All dataset columns (preserving original names)
ALL_COLUMNS = [
    "id", "event_type", "latitude", "longitude", "endlatitude", "endlongitude",
    "address", "end_address", "event_cause", "requires_road_closure",
    "start_datetime", "end_datetime", "status", "authenticated",
    "modified_datetime", "map_file", "direction", "description", "veh_type",
    "veh_no", "corridor", "priority", "cargo_material", "reason_breakdown",
    "age_of_truck", "created_date", "route_path", "client_id", "created_by_id",
    "last_modified_by_id", "assigned_to_police_id", "citizen_accident_id",
    "comment", "police_station", "meta_data", "kgid", "resolved_at_address",
    "resolved_at_latitude", "resolved_at_longitude", "closed_by_id",
    "closed_datetime", "resolved_by_id", "resolved_datetime", "gba_identifier",
    "zone", "junction",
]


# ─────────────────────────────────────────────────────────────────────────────
# Section 1 — Data Loading
# ─────────────────────────────────────────────────────────────────────────────

def load_dataset(filepath: str) -> pd.DataFrame:
    """
    Load the raw traffic event CSV (or JSON) from disk.

    Parameters
    ----------
    filepath : str
        Absolute or relative path to the dataset file.
        Supports .csv, .json, .jsonl.

    Returns
    -------
    pd.DataFrame
        Raw dataframe with original column names preserved.
    """
    ext = filepath.rsplit(".", 1)[-1].lower()
    logger.info("Loading dataset from %s  (format: %s)", filepath, ext)

    if ext == "csv":
        df = pd.read_csv(filepath, low_memory=False)
    elif ext in ("json", "jsonl"):
        df = pd.read_json(filepath, lines=(ext == "jsonl"))
    else:
        raise ValueError(f"Unsupported file format: {ext}")

    logger.info("Loaded %d rows × %d columns", len(df), len(df.columns))
    return df


# ─────────────────────────────────────────────────────────────────────────────
# Section 2 — Data Cleaning
# ─────────────────────────────────────────────────────────────────────────────

def _coerce_bool(series: pd.Series, default: bool = False) -> pd.Series:
    """Convert various truthy representations to proper bool."""
    mapping = {
        "true": True, "yes": True, "1": True, "t": True,
        "false": False, "no": False, "0": False, "f": False,
    }
    return (
        series
        .astype(str)
        .str.strip()
        .str.lower()
        .map(mapping)
        .fillna(default)
        .astype(bool)
    )


def _coerce_datetime(series: pd.Series) -> pd.Series:
    """Parse datetime column; coerce errors to NaT."""
    return pd.to_datetime(series, errors="coerce", infer_datetime_format=True)


def _coerce_float(series: pd.Series) -> pd.Series:
    """Parse numeric column; coerce errors to NaN."""
    return pd.to_numeric(series, errors="coerce")


def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and type-cast the raw dataframe.

    Strategy per column type
    ─────────────────────────
    • Coordinates : drop rows where lat/lon are null (unusable for geo search)
    • Datetimes   : parse with coerce; keep NaT rows (duration becomes None)
    • Booleans    : map string truthy values; default False
    • Categoricals: strip & title-case; fill "Unknown"
    • Numerics    : coerce; fill with column median
    • Free text   : fill with ""

    Parameters
    ----------
    df : pd.DataFrame
        Raw dataframe from load_dataset().

    Returns
    -------
    pd.DataFrame
        Cleaned dataframe.
    """
    df = df.copy()

    # ── Validate required columns ──────────────────────────────────────────
    missing_req = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing_req:
        raise ValueError(f"Dataset missing required columns: {missing_req}")

    # ── Drop rows without usable coordinates ──────────────────────────────
    before = len(df)
    df = df.dropna(subset=["latitude", "longitude"])
    dropped = before - len(df)
    if dropped:
        logger.warning("Dropped %d rows with null lat/lon", dropped)

    # ── Coordinates ───────────────────────────────────────────────────────
    df["latitude"]     = _coerce_float(df["latitude"])
    df["longitude"]    = _coerce_float(df["longitude"])
    df["endlatitude"]  = _coerce_float(df.get("endlatitude", pd.Series(dtype=float)))
    df["endlongitude"] = _coerce_float(df.get("endlongitude", pd.Series(dtype=float)))
    # Fill missing end-coords with start-coords (point event)
    df["endlatitude"]  = df["endlatitude"].fillna(df["latitude"])
    df["endlongitude"] = df["endlongitude"].fillna(df["longitude"])

    # ── Datetimes ─────────────────────────────────────────────────────────
    for col in ["start_datetime", "end_datetime", "closed_datetime",
                "resolved_datetime", "modified_datetime", "created_date"]:
        if col in df.columns:
            df[col] = _coerce_datetime(df[col])

    # ── Booleans ──────────────────────────────────────────────────────────
    if "requires_road_closure" in df.columns:
        df["requires_road_closure"] = _coerce_bool(df["requires_road_closure"], False)
    if "authenticated" in df.columns:
        df["authenticated"] = _coerce_bool(df["authenticated"], False)

    # ── Junction: accept bool or string ("Junction X") ───────────────────
    if "junction" in df.columns:
        junc = df["junction"].astype(str).str.strip().str.lower()
        # If it looks like a place name (not a boolean), treat presence as True
        bool_vals = {"true", "false", "1", "0", "yes", "no", "t", "f", "nan", "none", ""}
        is_bool_col = junc.isin(bool_vals).mean() > 0.5
        if is_bool_col:
            df["junction"] = _coerce_bool(df["junction"], False)
        else:
            # It's a name; keep as-is but add a junction_flag bool
            df["junction_name"] = df["junction"].fillna("Unknown")
            df["junction"] = df["junction"].notna() & (df["junction"].astype(str).str.lower() != "none")

    # ── Priority ──────────────────────────────────────────────────────────
    if "priority" in df.columns:
        df["priority"] = (
            df["priority"]
            .apply(lambda v: PRIORITY_MAP.get(
                str(v).strip().lower() if pd.notna(v) else None,
                DEFAULT_PRIORITY,
            ))
        )
    else:
        df["priority"] = DEFAULT_PRIORITY

    # ── Categorical / string columns ──────────────────────────────────────
    str_fill_unknown = [
        "event_type", "event_cause", "direction", "veh_type", "corridor",
        "police_station", "zone", "cargo_material", "reason_breakdown",
        "status", "address", "end_address",
    ]
    for col in str_fill_unknown:
        if col in df.columns:
            df[col] = (
                df[col]
                .fillna("Unknown")
                .astype(str)
                .str.strip()
                .str.title()
            )

    # ── Free-text columns ─────────────────────────────────────────────────
    for col in ["description", "comment", "resolved_at_address"]:
        if col in df.columns:
            df[col] = df[col].fillna("").astype(str).str.strip()

    # ── Numeric columns ───────────────────────────────────────────────────
    if "age_of_truck" in df.columns:
        df["age_of_truck"] = _coerce_float(df["age_of_truck"])
        df["age_of_truck"] = df["age_of_truck"].fillna(df["age_of_truck"].median())

    # ── route_path: normalise to string ───────────────────────────────────
    if "route_path" in df.columns:
        df["route_path"] = df["route_path"].apply(
            lambda v: json.dumps(v) if isinstance(v, (dict, list)) else str(v) if pd.notna(v) else None
        )

    logger.info("Cleaning complete — %d rows remain", len(df))
    return df


# ─────────────────────────────────────────────────────────────────────────────
# Section 3 — Feature Engineering
# ─────────────────────────────────────────────────────────────────────────────

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Derive time-based, geo-based, and operational features.

    New columns added
    ──────────────────
    start_hour        : hour of day (0–23)
    day_of_week       : 0=Mon … 6=Sun
    is_weekend        : bool
    is_peak_hour      : bool (morning + evening peaks)
    duration_minutes  : float — end_datetime minus start_datetime
    geo_distance_km   : float — straight-line distance start → end

    Parameters
    ----------
    df : pd.DataFrame  (already cleaned)

    Returns
    -------
    pd.DataFrame
    """
    df = df.copy()

    # ── Time features ─────────────────────────────────────────────────────
    if "start_datetime" in df.columns:
        dt = df["start_datetime"]
        df["start_hour"]  = dt.dt.hour.fillna(-1).astype(int)
        df["day_of_week"] = dt.dt.dayofweek.fillna(-1).astype(int)
        df["is_weekend"]  = df["day_of_week"].isin([5, 6])
        df["is_peak_hour"] = (
            (df["start_hour"].between(PEAK_HOUR_MORNING_START, PEAK_HOUR_MORNING_END)) |
            (df["start_hour"].between(PEAK_HOUR_EVENING_START, PEAK_HOUR_EVENING_END))
        )
    else:
        df["start_hour"]   = -1
        df["day_of_week"]  = -1
        df["is_weekend"]   = False
        df["is_peak_hour"] = False

    # ── Duration ──────────────────────────────────────────────────────────
    if "end_datetime" in df.columns and "start_datetime" in df.columns:
        df["duration_minutes"] = (
            (df["end_datetime"] - df["start_datetime"])
            .dt.total_seconds()
            .div(60)
            .round(2)
        )
        # Sanity: negative or extreme durations → None
        df.loc[df["duration_minutes"] < 0, "duration_minutes"] = None
        df.loc[df["duration_minutes"] > 10_080, "duration_minutes"] = None  # >1 week
    else:
        df["duration_minutes"] = None

    # ── Geo stretch distance ──────────────────────────────────────────────
    df["geo_distance_km"] = df.apply(
        lambda r: _haversine(r["latitude"], r["longitude"],
                             r["endlatitude"], r["endlongitude"]),
        axis=1,
    )

    logger.info("Feature engineering complete")
    return df


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return distance in kilometres between two lat/lon pairs."""
    if any(math.isnan(v) for v in [lat1, lon1, lat2, lon2]):
        return 0.0
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi  = math.radians(lat2 - lat1)
    dlam  = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ─────────────────────────────────────────────────────────────────────────────
# Section 4 — CityLearn Fingerprint Builder
# ─────────────────────────────────────────────────────────────────────────────

def build_fingerprint(row: pd.Series) -> Dict[str, Any]:
    """
    Build a CityLearn Fingerprint dict from a single cleaned+engineered row.

    The `fingerprint_text` field is the canonical natural-language string
    passed to the Sentence Transformer.  It encodes all operationally
    significant dimensions in a fixed, reproducible order.

    Parameters
    ----------
    row : pd.Series
        One row from the cleaned + feature-engineered dataframe.

    Returns
    -------
    dict
        CityLearn Fingerprint (without embedding — added by similarity_service).
    """

    def _get(col: str, default: Any = "Unknown") -> Any:
        v = row.get(col, default)
        return default if (v is None or (isinstance(v, float) and math.isnan(v))) else v

    # ── Core identity fields ──────────────────────────────────────────────
    event_type         = str(_get("event_type", "Unknown"))
    zone               = str(_get("zone", "Unknown"))
    corridor           = str(_get("corridor", "Unknown"))
    event_cause        = str(_get("event_cause", "Unknown"))
    direction          = str(_get("direction", "Unknown"))
    veh_type           = str(_get("veh_type", "Unknown"))
    police_station     = str(_get("police_station", "Unknown"))

    requires_road_closure = bool(_get("requires_road_closure", False))
    junction              = bool(_get("junction", False))
    is_peak_hour          = bool(_get("is_peak_hour", False))
    is_weekend            = bool(_get("is_weekend", False))

    latitude     = float(_get("latitude", 0.0))
    longitude    = float(_get("longitude", 0.0))
    endlatitude  = float(_get("endlatitude", latitude))
    endlongitude = float(_get("endlongitude", longitude))

    priority          = int(_get("priority", DEFAULT_PRIORITY))
    start_hour        = int(_get("start_hour", -1))
    day_of_week       = int(_get("day_of_week", -1))
    duration_minutes  = _get("duration_minutes", None)
    geo_distance_km   = float(_get("geo_distance_km", 0.0))

    # ── NLP description (combined text) ───────────────────────────────────
    description  = str(_get("description", ""))
    comment      = str(_get("comment", ""))
    description_text = " ".join(filter(None, [description, comment])).strip()

    # ── Canonical fingerprint text ────────────────────────────────────────
    # This deterministic string is the input to the embedding model.
    # Order matters — keep stable across versions.
    road_closure_str = "road closure required" if requires_road_closure else "no road closure"
    junction_str     = "near junction" if junction else "not near junction"
    peak_str         = "peak hour" if is_peak_hour else "off-peak"
    weekend_str      = "weekend" if is_weekend else "weekday"
    hour_str         = f"hour {start_hour}" if start_hour >= 0 else "unknown hour"
    duration_str     = (
        f"duration {round(duration_minutes)} minutes"
        if duration_minutes is not None
        else "unknown duration"
    )

    fingerprint_text = (
        f"{event_type} event in {zone} zone on {corridor} corridor. "
        f"Cause: {event_cause}. "
        f"Vehicle type: {veh_type}. "
        f"Direction: {direction}. "
        f"Priority level {priority}. "
        f"{road_closure_str}. "
        f"{junction_str}. "
        f"Nearest police station: {police_station}. "
        f"Occurred at {hour_str} on a {weekend_str} during {peak_str}. "
        f"{duration_str}. "
        f"Stretch distance: {geo_distance_km:.2f} km. "
        f"{description_text}"
    ).strip()

    return {
        # ── Identifiers ───────────────────────────────────────────────
        "event_id":               int(_get("id", -1)),
        # ── Core event dimensions ─────────────────────────────────────
        "event_type":             event_type,
        "zone":                   zone,
        "corridor":               corridor,
        "event_cause":            event_cause,
        "direction":              direction,
        "veh_type":               veh_type,
        "police_station":         police_station,
        # ── Location ──────────────────────────────────────────────────
        "latitude":               latitude,
        "longitude":              longitude,
        "endlatitude":            endlatitude,
        "endlongitude":           endlongitude,
        "geo_distance_km":        round(geo_distance_km, 4),
        # ── Boolean flags ─────────────────────────────────────────────
        "requires_road_closure":  requires_road_closure,
        "junction":               junction,
        "is_peak_hour":           is_peak_hour,
        "is_weekend":             is_weekend,
        # ── Numeric features ──────────────────────────────────────────
        "priority":               priority,
        "start_hour":             start_hour,
        "day_of_week":            day_of_week,
        "duration_minutes":       duration_minutes,
        # ── Text ──────────────────────────────────────────────────────
        "description_text":       description_text,
        "fingerprint_text":       fingerprint_text,
        # ── Embedding slot (filled by similarity_service) ─────────────
        "embedding":              None,
    }


def build_fingerprints_from_df(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Build fingerprints for every row in the dataframe.

    Parameters
    ----------
    df : pd.DataFrame
        Cleaned + feature-engineered dataframe.

    Returns
    -------
    list[dict]
        List of fingerprint dicts (embedding=None until similarity_service fills them).
    """
    fingerprints = []
    errors = 0
    for idx, row in df.iterrows():
        try:
            fp = build_fingerprint(row)
            fingerprints.append(fp)
        except Exception as exc:
            logger.warning("Row %s fingerprint failed: %s", idx, exc)
            errors += 1

    logger.info(
        "Built %d fingerprints  (%d errors)", len(fingerprints), errors
    )
    return fingerprints


# ─────────────────────────────────────────────────────────────────────────────
# Section 5 — High-level Pipeline
# ─────────────────────────────────────────────────────────────────────────────

def load_and_prepare_dataset(filepath: str) -> tuple[pd.DataFrame, List[Dict[str, Any]]]:
    """
    End-to-end pipeline: load → clean → engineer → fingerprint.

    Parameters
    ----------
    filepath : str
        Path to raw dataset file (.csv or .json).

    Returns
    -------
    (df_clean, fingerprints)
        df_clean      : cleaned + engineered dataframe (for ML models)
        fingerprints  : list of fingerprint dicts (embeddings still None)
    """
    df_raw         = load_dataset(filepath)
    df_clean       = clean_dataset(df_raw)
    df_engineered  = engineer_features(df_clean)
    fingerprints   = build_fingerprints_from_df(df_engineered)
    return df_engineered, fingerprints


# ─────────────────────────────────────────────────────────────────────────────
# Section 6 — Single-Event Entry Point (for FastAPI)
# ─────────────────────────────────────────────────────────────────────────────

def fingerprint_from_api_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Build a fingerprint from a raw API payload dict (new live event).

    Applies the same cleaning and feature engineering as the batch pipeline
    so that new events are directly comparable to historical fingerprints.

    Parameters
    ----------
    payload : dict
        Raw event dict from the API request body.
        Must contain at minimum: id, event_type, latitude, longitude, start_datetime.

    Returns
    -------
    dict
        CityLearn Fingerprint (embedding=None).

    Example
    -------
    >>> fp = fingerprint_from_api_payload({
    ...     "id": 999,
    ...     "event_type": "Accident",
    ...     "latitude": 12.9716,
    ...     "longitude": 77.5946,
    ...     "start_datetime": "2025-06-21T08:30:00",
    ...     "requires_road_closure": True,
    ...     "corridor": "Outer Ring Road",
    ...     "zone": "Zone 4",
    ... })
    """
    # Wrap in a one-row DataFrame to reuse the clean + engineer pipeline
    df_single = pd.DataFrame([payload])
    df_clean  = clean_dataset(df_single)
    df_eng    = engineer_features(df_clean)
    row       = df_eng.iloc[0]
    return build_fingerprint(row)


# ─────────────────────────────────────────────────────────────────────────────
# CLI smoke-test
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python fingerprint_engine.py <dataset_path>")
        sys.exit(1)

    _path = sys.argv[1]
    _df, _fps = load_and_prepare_dataset(_path)

    print(f"\n✅  Dataset shape   : {_df.shape}")
    print(f"✅  Fingerprints    : {len(_fps)}")
    print("\n── Sample Fingerprint (first record) ──")
    _sample = _fps[0].copy()
    _sample.pop("embedding")  # not yet filled
    for k, v in _sample.items():
        print(f"  {k:<30} {v}")
