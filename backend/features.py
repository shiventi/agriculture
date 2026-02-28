"""Feature engineering utilities for the AgriEquity pipeline.

This module standardizes feature extraction and provides a small set of
helpers that accept pandas DataFrames, lists of dicts, numpy arrays, or the
raw rows from `fake_data.txt` and returns a numeric feature matrix ready for
the model in `ml.py`.

The canonical feature order (11 features) is:
  0 temperature_2m_season_mean_C
  1 temperature_2m_max_season_max_C
  2 temperature_2m_min_season_min_C
  3 precipitation_season_sum_mm
  4 et0_fao_evapotranspiration_season_sum_mm
  5 vapour_pressure_deficit_season_mean_kPa
  6 vapour_pressure_deficit_season_max_kPa
  7 soil_moisture_rootzone_mean_m3m3
  8 soil_moisture_rootzone_min_m3m3
  9 shortwave_radiation_season_sum_MJ_m2
 10 wind_gusts_10m_season_max_mps

The functions below will try to use values provided in input records; if a
feature is missing a sensible default (derived from the fake data distribution)
is used so the pipeline remains robust.
"""

from typing import List, Tuple, Sequence, Dict, Any
import numpy as np

# Canonical feature names (in order)
FEATURE_NAMES: List[str] = [
    "temperature_2m_season_mean_C",
    "temperature_2m_max_season_max_C",
    "temperature_2m_min_season_min_C",
    "precipitation_season_sum_mm",
    "et0_fao_evapotranspiration_season_sum_mm",
    "vapour_pressure_deficit_season_mean_kPa",
    "vapour_pressure_deficit_season_max_kPa",
    "soil_moisture_rootzone_mean_m3m3",
    "soil_moisture_rootzone_min_m3m3",
    "shortwave_radiation_season_sum_MJ_m2",
    "wind_gusts_10m_season_max_mps",
]

# Sensible defaults (approximate medians from the provided fake_data.txt)
DEFAULTS: Dict[str, float] = {
    "temperature_2m_season_mean_C": 19.0,
    "temperature_2m_max_season_max_C": 39.0,
    "temperature_2m_min_season_min_C": 4.0,
    "precipitation_season_sum_mm": 240.0,
    "et0_fao_evapotranspiration_season_sum_mm": 920.0,
    "vapour_pressure_deficit_season_mean_kPa": 1.8,
    "vapour_pressure_deficit_season_max_kPa": 3.6,
    "soil_moisture_rootzone_mean_m3m3": 0.22,
    "soil_moisture_rootzone_min_m3m3": 0.14,
    "shortwave_radiation_season_sum_MJ_m2": 7000.0,
    "wind_gusts_10m_season_max_mps": 21.0,
}


def _value_from_record(record: Dict[str, Any], key: str) -> float:
    """Try to fetch a float value for `key` from the record, falling back to
    DEFAULTS. Accepts keys with alternative short names (e.g. 'avg_temp' etc.)
    """
    # direct
    if key in record and record[key] is not None:
        try:
            return float(record[key])
        except Exception:
            pass

    # common alternate names mapping
    alt_map = {
        "temperature_2m_season_mean_C": ["temp_mean", "avg_temp", "avg_temp_mean"],
        "temperature_2m_max_season_max_C": ["temp_max", "max_temp", "avg_temp_max"],
        "temperature_2m_min_season_min_C": ["temp_min", "min_temp", "avg_temp_min"],
        "precipitation_season_sum_mm": ["precipitation", "total_precip_mm", "precip_mm"],
        "et0_fao_evapotranspiration_season_sum_mm": ["et0", "et0_sum"],
        "vapour_pressure_deficit_season_mean_kPa": ["vpd_mean", "vapour_deficit_mean"],
        "vapour_pressure_deficit_season_max_kPa": ["vpd_max", "vapour_deficit_max"],
        "soil_moisture_rootzone_mean_m3m3": ["soil_moisture_mean", "soil_moist_mean"],
        "soil_moisture_rootzone_min_m3m3": ["soil_moisture_min", "soil_moist_min"],
        "shortwave_radiation_season_sum_MJ_m2": ["shortwave", "shortwave_sum", "sw_rad"],
        "wind_gusts_10m_season_max_mps": ["wind_gust", "wind_max", "wind"],
    }

    for alt in alt_map.get(key, []):
        if alt in record and record[alt] is not None:
            try:
                return float(record[alt])
            except Exception:
                continue

    # last resort: try any numeric-like keys that contain hint words
    hints = {
        "temp": ["temp", "temperature"],
        "precip": ["precip", "rain"],
        "soil": ["soil"],
        "vpd": ["vpd", "vapour", "vapor"],
        "shortwave": ["shortwave", "sw"],
        "wind": ["wind"],
    }
    for hint, keywords in hints.items():
        if any(k in key for k in keywords):
            for k, v in record.items():
                if any(kw in k for kw in keywords) and v is not None:
                    try:
                        return float(v)
                    except Exception:
                        pass

    # fallback to default
    return float(DEFAULTS.get(key, 0.0))


def features_from_record(record: Dict[str, Any]) -> np.ndarray:
    """Convert a single record (dict-like) into the canonical feature vector.

    record may be a pandas Series (works as dict), a plain dict, or a mapping
    that contains alternative column names; missing values are filled from
    DEFAULTS.
    """
    out: List[float] = []
    for key in FEATURE_NAMES:
        val = _value_from_record(record, key)
        out.append(float(val))
    return np.array(out, dtype=np.float32)


def build_feature_matrix(rows: Sequence[Any]) -> Tuple[np.ndarray, List[str]]:
    """Build a feature matrix from several kinds of inputs.

    Accepts:
      - numpy array with shape (n, 11) -> returned as-is (copied)
      - list of lists or tuples where each row has length 11
      - list of dicts / pandas DataFrame (use df.to_dict(orient='records'))

    Returns (X, feature_names)
    """
    # numpy array
    if isinstance(rows, np.ndarray):
        arr = rows
        if arr.ndim != 2 or arr.shape[1] != len(FEATURE_NAMES):
            raise ValueError(f"numpy array must be shape (n, {len(FEATURE_NAMES)})")
        return arr.astype(np.float32).copy(), FEATURE_NAMES.copy()

    # list/tuple of lists
    if isinstance(rows, (list, tuple)) and rows:
        first = rows[0]
        # list of lists/tuples
        if isinstance(first, (list, tuple)):
            arr = np.array(rows, dtype=float)
            if arr.ndim != 2 or arr.shape[1] != len(FEATURE_NAMES):
                raise ValueError(f"expected rows with {len(FEATURE_NAMES)} columns")
            return arr.astype(np.float32), FEATURE_NAMES.copy()

        # list of dict-like records
        if isinstance(first, dict) or hasattr(first, "items"):
            matrix = [features_from_record(dict(r)) for r in rows]
            return np.vstack(matrix).astype(np.float32), FEATURE_NAMES.copy()

    # pandas DataFrame (lazy import to avoid hard dependency)
    try:
        import pandas as pd

        if isinstance(rows, pd.DataFrame):
            records = rows.to_dict(orient="records")
            matrix = [features_from_record(rec) for rec in records]
            return np.vstack(matrix).astype(np.float32), FEATURE_NAMES.copy()
    except Exception:
        pass

    raise ValueError("Unsupported input type for build_feature_matrix")


if __name__ == "__main__":
    # small smoke test using defaults
    sample = [{}] * 3
    X, names = build_feature_matrix(sample)
    print("X.shape:", X.shape)
    print("feature names:", names)
    print("first row:", X[0])
