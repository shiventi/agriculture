from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import traceback
from subsidize import allocate
from app import data
from ml import mlData

app = FastAPI(title="AgriEquity — Subsidy Divider")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/subsidy-results")
def subsidy_results():
    try:
        # 1) pull everything from backend state/modules
        farms        = data.farms
        total_budget = data.budget
        constraints  = data.constraints
        yield_scores = mlData.yields
        risk_scores  = mlData.risks

        # 2) guard: ensure ML pipeline has run and produced data
        if not yield_scores or not risk_scores:
            raise HTTPException(
                status_code=503,
                detail="ML pipeline has not run yet — yield/risk data is unavailable"
            )
        if not farms:
            raise HTTPException(
                status_code=503,
                detail="No farm data available — pipeline may not have run yet"
            )
        if total_budget is None:
            raise HTTPException(
                status_code=503,
                detail="Budget has not been set"
            )
        if not constraints:
            raise HTTPException(
                status_code=503,
                detail="Constraints have not been set"
            )

        # 3) validate lengths match
        n = len(farms)
        if len(yield_scores) != n or len(risk_scores) != n:
            raise HTTPException(
                status_code=500,
                detail=f"Backend data mismatch: farms={n}, yields={len(yield_scores)}, risks={len(risk_scores)}"
            )

        # 4) allocate
        results = allocate(
            yield_scores=yield_scores,
            risk_scores=risk_scores,
            total_budget=total_budget,
            farms=farms,
            constraints=constraints,
        )

        return {"results": results}

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail=traceback.format_exc())