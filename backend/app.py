import csv
import io
import os
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

    # ── 2. Parse constraints (all optional, fall back to defaults) ────
    def _float_param(name, default):
        val = request.args.get(name) or (request.get_json(silent=True) or {}).get(name)
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

    # ── 3. Parse CSV ──────────────────────────────────────────────────
    if "file" not in request.files or not request.files["file"].filename:
        return jsonify({"error": "CSV file is required"}), 400

    text = request.files["file"].read().decode("utf-8")
    rows = list(csv.DictReader(io.StringIO(text)))
    if not rows:
        return jsonify({"error": "CSV file is empty"}), 400

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
        try:
            lat = float(row["lat"])
            lon = float(row["lon"])
        except ValueError:
            return jsonify({"error": f"Invalid lat/lon for farm {row['farm_id']}"}), 400

        try:
            metrics = fetch_open_meteo_metrics(lat, lon, start_date, end_date)
        except Exception as e:
            return jsonify({"error": f"Weather fetch failed for {row['farm_id']}: {str(e)}"}), 502

        # Pull the 11 features out in the exact order the model was trained on
        feature_vec = [metrics.get(k) for k in FEATURE_KEYS]
        if any(v is None for v in feature_vec):
            missing_keys = [FEATURE_KEYS[i] for i, v in enumerate(feature_vec) if v is None]
            return jsonify({"error": f"Missing weather features for {row['farm_id']}: {missing_keys}"}), 500

        feature_rows.append(feature_vec)

        farms.append({
            "farm_id":       row["farm_id"],
            "is_small":      int(row["is_small"]),
            "baseline_need": float(row["baseline_need"]),
        })

        weather_data.append({
            "farm_id": row["farm_id"],
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

    # ── 7. Return to frontend ─────────────────────────────────────────
    return jsonify({
        "budget":      budget,
        "constraints": constraints,
        "results":     allocation,    # [{ farm_id, before, after }, ...]
        "weather":     weather_data,  # per-farm climate metrics
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)