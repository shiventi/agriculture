import json
import math
import sys
from datetime import date, timedelta
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import urlopen


OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

# Hourly variables requested from Open-Meteo.
OPEN_METEO_HOURLY_VARS = [
    "temperature_2m",
    "precipitation",
    "et0_fao_evapotranspiration",
    "vapour_pressure_deficit",
    "soil_moisture_0_to_100cm",
    "soil_moisture_0_to_1cm",
    "soil_moisture_1_to_3cm",
    "soil_moisture_3_to_9cm",
    "soil_moisture_9_to_27cm",
    "soil_moisture_27_to_81cm",
    "shortwave_radiation",
    "wind_gusts_10m",
]


def _safe_mean(values):
    valid = [v for v in values if isinstance(v, (int, float))]
    if not valid:
        return None
    return sum(valid) / len(valid)


def _safe_sum(values):
    valid = [v for v in values if isinstance(v, (int, float))]
    if not valid:
        return None
    return sum(valid)


def _safe_max(values):
    valid = [v for v in values if isinstance(v, (int, float))]
    if not valid:
        return None
    return max(valid)


def _safe_min(values):
    valid = [v for v in values if isinstance(v, (int, float))]
    if not valid:
        return None
    return min(valid)


def _clamp(value, lo, hi):
    return max(lo, min(hi, value))


def _round_or_none(value, ndigits=3):
    if isinstance(value, (int, float)):
        return round(value, ndigits)
    return None


def _compute_rootzone_from_layers(filtered):
    # Weighted by layer thicknesses in cm.
    layer_defs = [
        ("soil_moisture_0_to_1cm", 1.0),
        ("soil_moisture_1_to_3cm", 2.0),
        ("soil_moisture_3_to_9cm", 6.0),
        ("soil_moisture_9_to_27cm", 18.0),
        ("soil_moisture_27_to_81cm", 54.0),
    ]
    n = max(len(filtered.get(name, [])) for name, _ in layer_defs)
    series = []
    for i in range(n):
        weighted_sum = 0.0
        total_w = 0.0
        for name, w in layer_defs:
            arr = filtered.get(name, [])
            value = arr[i] if i < len(arr) else None
            if isinstance(value, (int, float)):
                weighted_sum += value * w
                total_w += w
        series.append((weighted_sum / total_w) if total_w > 0 else None)
    return series


def _estimate_rootzone_from_water_balance(precip_series, et0_series):
    # Simple bucket model using observed precipitation and ET0.
    # This is deterministic inference from measured weather, not random fill.
    capacity_mm = 150.0
    storage_mm = 0.6 * capacity_mm
    rootzone = []
    n = max(len(precip_series), len(et0_series))
    for i in range(n):
        p = precip_series[i] if i < len(precip_series) else None
        e = et0_series[i] if i < len(et0_series) else None
        if not isinstance(p, (int, float)) or not isinstance(e, (int, float)):
            rootzone.append(None)
            continue
        storage_mm = _clamp(storage_mm + p - e, 0.0, capacity_mm)
        frac = storage_mm / capacity_mm
        # Map to plausible volumetric water content interval.
        rootzone.append(0.10 + frac * (0.38 - 0.10))
    return rootzone


def _compute_climate_risk_score(metrics):
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


def _compute_projected_yield_t_ha(metrics):
    # Placeholder agronomic proxy model; replace with trained model later.
    baseline = 4.0

    temp_mean = metrics.get("temperature_2m_season_mean_C")
    precip = metrics.get("precipitation_season_sum_mm")
    et0 = metrics.get("et0_fao_evapotranspiration_season_sum_mm")
    soil_mean = metrics.get("soil_moisture_rootzone_mean_m3m3")
    shortwave = metrics.get("shortwave_radiation_season_sum_MJ_m2")
    risk = metrics.get("climate_risk_score")

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
    if isinstance(risk, (int, float)):
        adj += -risk * 1.8

    return round(max(0.5, baseline + adj), 3)


def fetch_open_meteo_metrics(latitude, longitude, start_date, end_date, timezone="auto"):
    start_dt = date.fromisoformat(start_date)
    end_dt = date.fromisoformat(end_date)
    if start_dt > end_dt:
        raise ValueError("start_date must be <= end_date")

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": ",".join(OPEN_METEO_HOURLY_VARS),
        "temperature_unit": "celsius",
        "wind_speed_unit": "ms",
        "precipitation_unit": "mm",
        "timezone": timezone,
    }
    url = f"{OPEN_METEO_ARCHIVE_URL}?{urlencode(params)}"

    try:
        with urlopen(url, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
    except HTTPError as err:
        # Surface API response body so bad-parameter errors are easy to debug.
        detail = err.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Open-Meteo request failed ({err.code}): {detail}") from err

    hourly = data.get("hourly", {})
    hourly_time = hourly.get("time", [])

    filtered = {
        "temperature_2m": [],
        "precipitation": [],
        "et0_fao_evapotranspiration": [],
        "vapour_pressure_deficit": [],
        "soil_moisture_0_to_100cm": [],
        "soil_moisture_0_to_1cm": [],
        "soil_moisture_1_to_3cm": [],
        "soil_moisture_3_to_9cm": [],
        "soil_moisture_9_to_27cm": [],
        "soil_moisture_27_to_81cm": [],
        "shortwave_radiation": [],
        "wind_gusts_10m": [],
    }

    for idx, _ in enumerate(hourly_time):
        for key in filtered:
            values = hourly.get(key, [])
            filtered[key].append(values[idx] if idx < len(values) else None)

    rootzone_series = filtered["soil_moisture_0_to_100cm"]
    if not any(isinstance(v, (int, float)) for v in rootzone_series):
        rootzone_series = _compute_rootzone_from_layers(filtered)
    if not any(isinstance(v, (int, float)) for v in rootzone_series):
        rootzone_series = _estimate_rootzone_from_water_balance(
            filtered["precipitation"], filtered["et0_fao_evapotranspiration"]
        )

    shortwave_sum = _safe_sum(filtered["shortwave_radiation"])
    metrics = {
        "temperature_2m_season_mean_C": _safe_mean(filtered["temperature_2m"]),
        "temperature_2m_max_season_max_C": _safe_max(filtered["temperature_2m"]),
        "temperature_2m_min_season_min_C": _safe_min(filtered["temperature_2m"]),
        "precipitation_season_sum_mm": _safe_sum(filtered["precipitation"]),
        "et0_fao_evapotranspiration_season_sum_mm": _safe_sum(
            filtered["et0_fao_evapotranspiration"]
        ),
        "vapour_pressure_deficit_season_mean_kPa": _safe_mean(filtered["vapour_pressure_deficit"]),
        "vapour_pressure_deficit_season_max_kPa": _safe_max(filtered["vapour_pressure_deficit"]),
        "soil_moisture_rootzone_mean_m3m3": _safe_mean(rootzone_series),
        "soil_moisture_rootzone_min_m3m3": _safe_min(rootzone_series),
        # Open-Meteo shortwave_radiation is hourly in W/m². Approximate MJ/m² by sum * 3600 / 1e6.
        "shortwave_radiation_season_sum_MJ_m2": (None if shortwave_sum is None else shortwave_sum * 0.0036),
        "wind_gusts_10m_season_max_mps": _safe_max(filtered["wind_gusts_10m"]),
    }



    # Return exactly the requested schema and key order.
    ordered_keys = [
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
    return {key: _round_or_none(metrics.get(key)) for key in ordered_keys}


def default_season_dates():
    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=90)
    return start.isoformat(), end.isoformat()


if __name__ == "__main__":
    # Example:
    # python3 longlat.py 37.77 -122.42
    import sys

    if len(sys.argv) < 3:
        raise SystemExit("Usage: python3 longlat.py <latitude> <longitude>")

    lat = float(sys.argv[1])
    lon = float(sys.argv[2])
    start, end = default_season_dates()
    out = fetch_open_meteo_metrics(lat, lon, start, end)
    print(json.dumps(list(out.values()), separators=(",", ":")))
