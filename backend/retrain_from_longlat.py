import argparse
import csv
import json
import random
from datetime import date, timedelta
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np

from longlat import fetch_open_meteo_metrics
from ml import save_model, train_model


FEATURE_KEYS = [
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


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def _compute_risk_0_100(metrics: Dict[str, float]) -> float:
    score = 0.0
    tmax = metrics.get("temperature_2m_max_season_max_C")
    tmin = metrics.get("temperature_2m_min_season_min_C")
    precip = metrics.get("precipitation_season_sum_mm")
    et0 = metrics.get("et0_fao_evapotranspiration_season_sum_mm")
    vpd_max = metrics.get("vapour_pressure_deficit_season_max_kPa")
    soil_min = metrics.get("soil_moisture_rootzone_min_m3m3")
    gust = metrics.get("wind_gusts_10m_season_max_mps")

    if isinstance(tmax, (int, float)):
        score += _clamp((tmax - 34.0) / 10.0, 0.0, 1.0) * 0.25
    if isinstance(tmin, (int, float)):
        score += _clamp((2.0 - tmin) / 8.0, 0.0, 1.0) * 0.15
    if isinstance(precip, (int, float)) and isinstance(et0, (int, float)) and et0 > 0:
        dryness = _clamp((et0 - precip) / et0, 0.0, 1.0)
        score += dryness * 0.2
    if isinstance(vpd_max, (int, float)):
        score += _clamp((vpd_max - 2.0) / 2.5, 0.0, 1.0) * 0.15
    if isinstance(soil_min, (int, float)):
        score += _clamp((0.18 - soil_min) / 0.18, 0.0, 1.0) * 0.15
    if isinstance(gust, (int, float)):
        score += _clamp((gust - 18.0) / 20.0, 0.0, 1.0) * 0.1

    return round(_clamp(score, 0.0, 1.0) * 100.0, 3)


def _compute_yield_t_ha(metrics: Dict[str, float], risk_0_100: float) -> float:
    baseline = 4.0
    temp_mean = metrics.get("temperature_2m_season_mean_C")
    precip = metrics.get("precipitation_season_sum_mm")
    et0 = metrics.get("et0_fao_evapotranspiration_season_sum_mm")
    soil_mean = metrics.get("soil_moisture_rootzone_mean_m3m3")
    shortwave = metrics.get("shortwave_radiation_season_sum_MJ_m2")
    risk_0_1 = risk_0_100 / 100.0

    adj = 0.0
    if isinstance(temp_mean, (int, float)):
        adj += -abs(temp_mean - 22.0) * 0.04
    if isinstance(precip, (int, float)) and isinstance(et0, (int, float)) and et0 > 0:
        water_ratio = precip / et0
        adj += -abs(water_ratio - 0.9) * 0.8
    if isinstance(soil_mean, (int, float)):
        adj += -abs(soil_mean - 0.28) * 3.0
    if isinstance(shortwave, (int, float)):
        adj += np.log10(max(shortwave, 1.0)) * 0.25
    adj += -risk_0_1 * 1.8

    return round(max(0.5, baseline + adj), 3)


def _load_farms(path: Path) -> List[Dict[str, str]]:
    with path.open(newline="") as f:
        rows = list(csv.DictReader(f))
    required = {"farm_id", "lat", "lon", "farm_size_ha", "is_small", "baseline_need"}
    if not rows:
        raise ValueError("input farm csv has no rows")
    missing = required - set(rows[0].keys())
    if missing:
        raise ValueError(f"missing required farm columns: {sorted(missing)}")
    return rows


def _date_windows(windows: int, season_days: int, step_days: int) -> List[Tuple[str, str]]:
    out = []
    end_anchor = date.today() - timedelta(days=1)
    for i in range(windows):
        end = end_anchor - timedelta(days=i * step_days)
        start = end - timedelta(days=season_days - 1)
        out.append((start.isoformat(), end.isoformat()))
    return out


def _is_valid_feature_row(metrics: Dict[str, float]) -> bool:
    return all(isinstance(metrics.get(k), (int, float)) for k in FEATURE_KEYS)


def _farm_points_with_jitter(
    farms: List[Dict[str, str]], jitter_count: int, jitter_deg: float, seed: int
) -> List[Tuple[str, float, float]]:
    rnd = random.Random(seed)
    points = []
    for row in farms:
        farm_id = row["farm_id"]
        lat = float(row["lat"])
        lon = float(row["lon"])
        points.append((farm_id, lat, lon))
        for j in range(jitter_count):
            dlat = rnd.uniform(-jitter_deg, jitter_deg)
            dlon = rnd.uniform(-jitter_deg, jitter_deg)
            points.append((f"{farm_id}_J{j+1}", lat + dlat, lon + dlon))
    return points


def generate_dataset(
    farm_csv: Path,
    out_data_file: Path,
    windows: int,
    season_days: int,
    step_days: int,
    jitter_count: int,
    jitter_deg: float,
    seed: int,
) -> np.ndarray:
    farms = _load_farms(farm_csv)
    points = _farm_points_with_jitter(farms, jitter_count, jitter_deg, seed)
    windows_list = _date_windows(windows, season_days, step_days)

    rows: List[List[float]] = []
    skipped = 0
    error_samples: List[str] = []
    for farm_id, lat, lon in points:
        for start_date, end_date in windows_list:
            try:
                metrics = fetch_open_meteo_metrics(lat, lon, start_date, end_date)
            except Exception as e:
                skipped += 1
                if len(error_samples) < 10:
                    error_samples.append(
                        f"{farm_id} ({lat:.4f},{lon:.4f}) {start_date}->{end_date}: {e}"
                    )
                continue
            if not _is_valid_feature_row(metrics):
                skipped += 1
                if len(error_samples) < 10:
                    error_samples.append(
                        f"{farm_id} ({lat:.4f},{lon:.4f}) {start_date}->{end_date}: missing feature values"
                    )
                continue

            feature_vec = [float(metrics[k]) for k in FEATURE_KEYS]
            risk = _compute_risk_0_100(metrics)
            yld = _compute_yield_t_ha(metrics, risk)
            rows.append(feature_vec + [yld, risk])

    if not rows:
        debug = "\n".join(error_samples) if error_samples else "no error details captured"
        raise RuntimeError(
            "no training rows generated; check network/API or input farms.\n"
            f"sample errors:\n{debug}"
        )

    out_data_file.parent.mkdir(parents=True, exist_ok=True)
    with out_data_file.open("w") as f:
        f.write("data = [\n")
        for r in rows:
            vals = ", ".join(f"{v:.3f}" for v in r)
            f.write(f"    [{vals}],\n")
        f.write("]\n")

    print(
        json.dumps(
            {
                "generated_rows": len(rows),
                "skipped_rows": skipped,
                "output_data_file": str(out_data_file),
                "sample_errors": error_samples,
            },
            indent=2,
        )
    )
    return np.array(rows, dtype=np.float32)


def retrain_model(dataset: np.ndarray, model_out: Path) -> None:
    X = dataset[:, :11]
    y = dataset[:, 11:]

    model, X_min, X_max, y_min, y_max = train_model(X, y, epochs=800, lr=5e-3)
    save_model(model, str(model_out), X_min, X_max, y_min, y_max)
    print(
        json.dumps(
            {
                "model_out": str(model_out),
                "train_rows": int(X.shape[0]),
                "feature_count": int(X.shape[1]),
                "target_count": int(y.shape[1]),
                "yield_range": [float(y[:, 0].min()), float(y[:, 0].max())],
                "risk_range": [float(y[:, 1].min()), float(y[:, 1].max())],
            },
            indent=2,
        )
    )


def main():
    base_dir = Path(__file__).resolve().parent

    parser = argparse.ArgumentParser(
        description="Generate real longlat-based training data and retrain farm_model.pth"
    )
    parser.add_argument("--farm-csv", default="train_farms_expanded.csv")
    parser.add_argument("--out-data", default="training_data_generated.txt")
    parser.add_argument("--model-out", default="farm_model.pth")
    parser.add_argument("--windows", type=int, default=24, help="number of seasonal windows")
    parser.add_argument("--season-days", type=int, default=90)
    parser.add_argument("--step-days", type=int, default=21)
    parser.add_argument("--jitter-count", type=int, default=2, help="extra points per farm")
    parser.add_argument("--jitter-deg", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    farm_csv = Path(args.farm_csv)
    out_data = Path(args.out_data)
    model_out = Path(args.model_out)
    if not farm_csv.is_absolute():
        farm_csv = base_dir / farm_csv
    if not out_data.is_absolute():
        out_data = base_dir / out_data
    if not model_out.is_absolute():
        model_out = base_dir / model_out

    dataset = generate_dataset(
        farm_csv=farm_csv,
        out_data_file=out_data,
        windows=args.windows,
        season_days=args.season_days,
        step_days=args.step_days,
        jitter_count=args.jitter_count,
        jitter_deg=args.jitter_deg,
        seed=args.seed,
    )
    retrain_model(dataset, model_out)


if __name__ == "__main__":
    main()
