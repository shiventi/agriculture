from flask import Flask, jsonify, request

app = Flask(__name__)


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/predict")
def predict():
    payload = request.get_json(silent=True) or {}
    location = payload.get("location", {})

    # Placeholder values until the real model/data pipeline is connected.
    expected_yield = {
        "value": 3.8,
        "unit": "tons/ha",
        "season": "2026",
    }
    climate_risks = [
        {"type": "drought", "risk_level": "medium", "score": 0.58},
        {"type": "heat_stress", "risk_level": "high", "score": 0.77},
        {"type": "flooding", "risk_level": "low", "score": 0.22},
    ]

    return jsonify(
        {
            "input": {"location": location},
            "output": {
                "expected_yield": expected_yield,
                "climate_risks": climate_risks,
                "subsidy": None,
                "reasoning": None,
            },
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
