import csv
import io
from flask import Flask, jsonify, request

app = Flask(__name__)
ALLOWED_ORIGIN = "https://agriequity.vercel.app"


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


@app.route("/analyze", methods=["POST", "OPTIONS"])
def analyze():
    if request.method == "OPTIONS":
        return ("", 204)
    budget = request.args.get("budget") or request.form.get("budget")
    if budget is None:
        payload = request.get_json(silent=True) or {}
        budget = payload.get("budget")
    print(f"budget={budget}")

    if "file" in request.files:
        f = request.files["file"]
        if not f or not f.filename:
            return jsonify({"error": "No file uploaded"}), 400
        text = f.read().decode("utf-8")
        rows = list(csv.DictReader(io.StringIO(text)))
        print(rows)
        return jsonify(
            {
                "fairness_on": request.args.get("fairness_on"),
                "per_capita_ratio": request.args.get("per_capita_ratio"),
                "budget": budget,
                "count": len(rows),
                "rows": rows,
            }
        )

    return predict()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
