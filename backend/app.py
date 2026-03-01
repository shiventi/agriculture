import csv
import io
import math
from flask import Flask, jsonify, request

from longlat import fetch_open_meteo_metrics, default_season_dates
from subsidize import allocate

app = Flask(__name__)
ALLOWED_ORIGIN = "https://agriequity.vercel.app"


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

    # 1. Parse budget
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

    # 2. Parse constraints (optional, with defaults)
    def _float_param(name, default):
        val = (
            request.args.get(name)
            or request.form.get(name)
            or (request.get_json(silent=True) or {}).get(name)
        )
        try:
            return float(val) if val is not None else default
        except (ValueError, TypeError):
            return default

    constraints = {
        "small_farm_min_share": _float_param("small_farm_min_share", 0.40),
        "per_capita_ratio": _float_param("per_capita_ratio", 0.70),
        "need_floor_dollars": _float_param("need_floor_dollars", 50000),
        "max_single_farm_share": _float_param("max_single_farm_share", 0.30),
        "high_risk_floor_threshold": _float_param("high_risk_floor_threshold", 75),
        "high_risk_floor_amount": _float_param("high_risk_floor_amount", 25000),
    }

    # 3. Parse CSV: farm_id,lat,lon,farm_size_ha,is_small,baseline_need
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

    # 4. Fetch weather metrics, build features lines, and collect yield/risk inputs.
    start_date, end_date = default_season_dates()
    ordered_metric_keys = [
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
    results = []
    output_lines = []
    farms = []
    yield_scores = []
    risk_scores = []

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

        metric_values = [metrics.get(key) for key in ordered_metric_keys]
        line = f"{row['farm_id']},{metric_values}"
        print(line)

        risk_val = metrics.get("climate_risk_score")
        if risk_val is None:
            risk_val = _fallback_climate_risk_score(metrics)
        yield_val = metrics.get("projected_yield_t_ha")
        if yield_val is None:
            yield_val = _fallback_projected_yield_t_ha(metrics, risk_val)
        if yield_val is None or risk_val is None:
            return jsonify({"error": f"Missing yield/risk for farm {row['farm_id']}"}), 500

        try:
            farms.append(
                {
                    "farm_id": row["farm_id"],
                    "is_small": int(row["is_small"]),
                    "baseline_need": float(row["baseline_need"]),
                }
            )
        except (ValueError, TypeError):
            return jsonify({"error": f"Invalid is_small/baseline_need for farm {row['farm_id']}"}), 400
        yield_scores.append(float(yield_val))
        risk_scores.append(round(float(risk_val) * 100, 2))

        results.append({
            "farm_id": row["farm_id"],
            "values": metric_values,
            "line": line,
            "projected_yield_t_ha": yield_val,
            "climate_risk_score": risk_val,
        })
        output_lines.append(line)

    # 5. Allocate subsidies using budget + constraints + yield/risk.
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

    return jsonify({
        "budget": budget,
        "constraints": constraints,
        "metric_order": ordered_metric_keys,
        "results": results,
        "lines": output_lines,
        "allocation": allocation,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
