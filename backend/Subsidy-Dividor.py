"""
processYield.py

FastAPI route that:
  1. Receives yield scores, risk scores, budget, farms, and constraints from the frontend
  2. Calls allocate() from subsidize.py
  3. Returns the before/after subsidy array back to the frontend

FRONTEND sends POST /process-yield with JSON body:
{
  "yield_scores":  [0.45, 0.92, 0.38, ...],
  "risk_scores":   [55, 15, 70, ...],
  "total_budget":  1000000,
  "farms": [
    { "farm_id": "F001", "is_small": 1, "baseline_need": 0.80 },
    ...
  ],
  "constraints": {
    "small_farm_min_share":      0.40,
    "per_capita_ratio":          0.70,
    "need_floor_dollars":        50000,
    "max_single_farm_share":     0.30,
    "high_risk_floor_threshold": 75,
    "high_risk_floor_amount":    25000
  }
}

FRONTEND receives:
{
  "results": [
    { "farm_id": "F001", "before": 81338.0, "after": 149583.0 },
    { "farm_id": "F002", "before": 212164.0, "after": 99949.0 },
    ...
  ]
}

RUN:
  uvicorn processYield:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import traceback
from app import data
from ml import mlData

from subsidize import allocate

constraints = data.constraints
budget = data.budget
yields = mlData.yields
risks = mlData.risks

app = FastAPI(title="AgriEquity — Subsidy Dividor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response shapes ─────────────────────────────────────────────────

class Farm(BaseModel):
    farm_id:       str
    is_small:      int    # 1 = small, 0 = large
    baseline_need: float  # 0.0 – 1.0

class Constraints(BaseModel):
    small_farm_min_share:      Optional[float] = 0.40
    per_capita_ratio:          Optional[float] = 0.70
    need_floor_dollars:        Optional[float] = 50_000
    max_single_farm_share:     Optional[float] = 0.30
    high_risk_floor_threshold: Optional[float] = 75
    high_risk_floor_amount:    Optional[float] = 25_000

class YieldRequest(BaseModel):
    yield_scores:  list[float]
    risk_scores:   list[float]   # 1–100
    total_budget:  float
    farms:         list[Farm]
    constraints:   Constraints

class FarmResult(BaseModel):
    farm_id: str
    before:  float
    after:   float

class YieldResponse(BaseModel):
    results: list[FarmResult]


# ── Route ─────────────────────────────────────────────────────────────────────

@app.post("/subsity-results", response_model=YieldResponse)
def process_yield(body: YieldRequest):
    # Validate lengths match
    n = len(body.farms)
    if len(body.yield_scores) != n or len(body.risk_scores) != n:
        raise HTTPException(
            status_code=400,
            detail=f"yield_scores and risk_scores must each have {n} entries (one per farm)"
        )

    try:
        results = allocate(
            yield_scores = body.yield_scores,
            risk_scores  = body.risk_scores,
            total_budget = body.total_budget,
            farms        = [f.model_dump() for f in body.farms],
            constraints  = body.constraints.model_dump(),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=traceback.format_exc())

    return {"results": results}
