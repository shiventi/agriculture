import csv
import io
import os
import math
import numpy as np
from flask import Flask, jsonify, request

from longlat import fetch_open_meteo_metrics, default_season_dates
from ml import load_model, predict as ml_predict
from subsidize import allocate

app = Flask(__name__)
ALLOWED_ORIGIN = "https://agriequity.vercel.app"

# The 11 feature keys longlat returns, in the exact order the ML model expects
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

# Load the trained model once at startup
_model_path = os.path.join(os.path.dirname(__file__), "farm_model.pth")
_model, _X_min, _X_max, _y_min, _y_max = load_model(_model_path)


def _clamp(value, lo, hi):
    return max(lo, min(hi, value))


def _fallback_climate_risk_score(metrics):
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

    return round(_clamp(score, 0.0, 1.0), 3)


def _fallback_projected_yield_t_ha(metrics, risk_score):
    baseline = 4.0
    temp_mean = metrics.get("temperature_2m_season_mean_C")
    precip = metrics.get("precipitation_season_sum_mm")
    et0 = metrics.get("et0_fao_evapotranspiration_season_sum_mm")
    soil_mean = metrics.get("soil_moisture_rootzone_mean_m3m3")
    shortwave = metrics.get("shortwave_radiation_season_sum_MJ_m2")

    adj = 0.0
    if isinstance(temp_mean, (int, float)):
        adj += -abs(temp_mean - 22.0) * 0.04
    if isinstance(precip, (int, float)) and isinstance(et0, (int, float)) and et0 > 0:
        water_ratio = precip / et0
        adj += -abs(water_ratio - 0.9) * 0.8
    if isinstance(soil_mean, (int, float)):
        adj += -abs(soil_mean - 0.28) * 3.0
    if isinstance(shortwave, (int, float)):
        adj += math.log(max(shortwave, 1.0), 10) * 0.25
    if isinstance(risk_score, (int, float)):
        adj += -risk_score * 1.8

    return round(max(0.5, baseline + adj), 3)


@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin == ALLOWED_ORIGIN:
        response.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN
        response.headers["Vary"] = "Origin"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    requested_headers = request.headers.get("Access-Control-Request-Headers")
    if requested_headers:
        response.headers["Access-Control-Allow-Headers"] = requested_headers
    else:
        response.headers["Access-Control-Allow-Headers"] = (
            "Content-Type,Authorization,ngrok-skip-browser-warning"
        )
    return response


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/analyze", methods=["POST", "OPTIONS"])
def analyze():
    if request.method == "OPTIONS":
        return ("", 204)

    # ── 1. Parse budget ───────────────────────────────────────────────
    budget = (
        request.args.get("budget")
        or request.form.get("budget")
        or (request.get_json(silent=True) or {}).get("budget")
    )
    if budget is None:
        return jsonify({"error": "budget is required"}), 400
    try:
        budget = float(budget)
    except ValueError:
        return jsonify({"error": "budget must be a number"}), 400

    # ── 2. Parse fairness toggle + constraints ────────────────────────
    fairness_raw = (
        request.args.get("fairness_on")
        or request.form.get("fairness_on")
        or (request.get_json(silent=True) or {}).get("fairness_on")
    )
    fairness_on = True
    if fairness_raw is not None:
        fairness_on = str(fairness_raw).strip().lower() in {"1", "true", "yes", "on"}

    def _float_param(name, default):
        val = request.args.get(name)
        if val is None:
            val = request.form.get(name)
        if val is None:
            val = (request.get_json(silent=True) or {}).get(name)
        try:
            return float(val) if val is not None else default
        except (ValueError, TypeError):
            return default

    constraints = {
        "small_farm_min_share":      _float_param("small_farm_min_share",      0.40),
        "per_capita_ratio":          _float_param("per_capita_ratio",          0.70),
        "need_floor_dollars":        _float_param("need_floor_dollars",        50000),
        "max_single_farm_share":     _float_param("max_single_farm_share",     0.30),
        "high_risk_floor_threshold": _float_param("high_risk_floor_threshold", 75),
        "high_risk_floor_amount":    _float_param("high_risk_floor_amount",    25000),
    }
    if not fairness_on:
        constraints = {
            "small_farm_min_share": 0.0,
            "per_capita_ratio": 0.0,
            "need_floor_dollars": 0.0,
            "max_single_farm_share": 0.0,
            "high_risk_floor_threshold": 0.0,
            "high_risk_floor_amount": 0.0,
        }
    print(f"[analyze] fairness_on={fairness_on} constraints={constraints}")

    # ── 3. Parse CSV ──────────────────────────────────────────────────
    if "file" not in request.files or not request.files["file"].filename:
        return jsonify({"error": "CSV file is required"}), 400

    text = request.files["file"].read().decode("utf-8")
    rows = list(csv.DictReader(io.StringIO(text)))
    if not rows:
        return jsonify({"error": "CSV file is empty"}), 400
    print(f"[analyze] start farms={len(rows)} budget={budget}")

    required_cols = {"farm_id", "lat", "lon", "farm_size_ha", "is_small", "baseline_need"}
    missing = required_cols - set(rows[0].keys())
    if missing:
        return jsonify({"error": f"CSV missing columns: {missing}"}), 400

    # ── 4. Fetch weather for each farm and build feature matrix ───────
    start_date, end_date = default_season_dates()

    farms        = []
    feature_rows = []   # will become the (n, 11) numpy array for the ML model
    weather_data = []

    for row in rows:
        farm_id = row["farm_id"]
        try:
            lat = float(row["lat"])
            lon = float(row["lon"])
        except ValueError:
            return jsonify({"error": f"Invalid lat/lon for farm {farm_id}"}), 400
        print(f"[farm:{farm_id}] input lat={lat} lon={lon}")

        try:
            metrics = fetch_open_meteo_metrics(lat, lon, start_date, end_date)
        except Exception as e:
            return jsonify({"error": f"Weather fetch failed for {farm_id}: {str(e)}"}), 502

        # Pull the 11 features out in the exact order the model was trained on
        feature_vec = [metrics.get(k) for k in FEATURE_KEYS]
        if any(v is None for v in feature_vec):
            missing_keys = [FEATURE_KEYS[i] for i, v in enumerate(feature_vec) if v is None]
            return jsonify({"error": f"Missing weather features for {farm_id}: {missing_keys}"}), 500
        print(f"[farm:{farm_id}] features={feature_vec}")

        feature_rows.append(feature_vec)

        farms.append({
            "farm_id":       farm_id,
            "is_small":      int(row["is_small"]),
            "baseline_need": float(row["baseline_need"]),
        })

        weather_data.append({
            "farm_id": farm_id,
            "metrics": metrics,
        })

    # ── 5. Run ML model → yield (t/ha) + risk (0-100) ─────────────────
    X = np.array(feature_rows, dtype=np.float32)

    try:
        yield_scores, risk_scores = ml_predict(
            _model, X, _X_min, _X_max, _y_min, _y_max
        )
    except Exception as e:
        return jsonify({"error": f"ML prediction failed: {str(e)}"}), 500
    for i, farm in enumerate(farms):
        print(
            f"[farm:{farm['farm_id']}] predicted_yield_t_ha={round(float(yield_scores[i]), 4)} "
            f"predicted_risk_score={round(float(risk_scores[i]), 4)}"
        )

    # ── 6. Allocate subsidies ─────────────────────────────────────────
    # risk_scores already come out of ml.predict as 0-100
    try:
        allocation = allocate(
            yield_scores=yield_scores,
            risk_scores=risk_scores,
            total_budget=budget,
            farms=farms,
            constraints=constraints,
        )
    except Exception as e:
        return jsonify({"error": f"Allocation failed: {str(e)}"}), 500

    # Diagnostics: expose allocation driver math for transparency.
    risk_norm = np.array(risk_scores, dtype=float) / 100.0
    yield_arr = np.array(yield_scores, dtype=float)
    raw_weights = yield_arr * (1.0 - 0.5 * risk_norm)
    raw_weights = np.clip(raw_weights, 1e-6, None)
    norm_weights = raw_weights / raw_weights.sum()
    alloc_by_farm = {a["farm_id"]: a for a in allocation}
    for farm in farms:
        farm_id = farm["farm_id"]
        alloc = alloc_by_farm.get(farm_id, {})
        print(
            f"[farm:{farm_id}] allocation_before={alloc.get('before')} "
            f"allocation_after={alloc.get('after')}"
        )
    print("[analyze] completed")

    

    # ── 7. Return to frontend ─────────────────────────────────────────
    return jsonify({
        "budget":      budget,
        "fairness_on": fairness_on,
        "constraints": constraints,
        "results":     allocation,    # [{ farm_id, before, after }, ...]
        "weather":     weather_data,  # per-farm climate metrics
        "diagnostics": {
            "farms": [
                {
                    "farm_id": farms[i]["farm_id"],
                    "predicted_yield_t_ha": round(float(yield_scores[i]), 6),
                    "predicted_risk_score_0_100": round(float(risk_scores[i]), 6),
                    "raw_weight": round(float(raw_weights[i]), 6),
                    "normalized_weight": round(float(norm_weights[i]), 6),
                }
                for i in range(len(farms))
            ]
        },
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
