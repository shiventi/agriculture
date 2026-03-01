"""
subsidize.py

INPUTS:
  yield_scores  — list of floats, one per farm
  risk_scores   — list of floats 1–100  (1 = safe, 100 = extreme risk)
  total_budget  — float (total dollars to split)
  farms         — list of dicts, each needs:
                    "farm_id"       str
                    "is_small"      int  (1 = small farm, 0 = large)
                    "baseline_need" float 0–1
  constraints   - dict of user inputted constraints

OUTPUT from allocate():
  [
    {
      "farm_id":      "F001",
      "before":       81338.00,    <- dollars before fairness constraints
      "after":        149583.00,   <- dollars after fairness constraints
    },
    ...
  ]
"""

import numpy as np


defaultCONSTRAINTS = {
    "small_farm_min_share":      0.40,   # small farms get >= 40% of budget
    "per_capita_ratio":          0.70,   # small avg >= 70% of large avg
    "need_floor_dollars":        50_000, # baseline_need x this = floor
    "max_single_farm_share":     0.30,   # no farm gets > 30% of budget
    "high_risk_floor_threshold": 75,     # risk score threshold (out of 100)
    "high_risk_floor_amount":    25_000, # guaranteed floor for high-risk farms
}


def allocate(yield_scores, risk_scores, total_budget, farms, constraints):
    """
    Split a budget across farms based on yield/risk, before and after fairness.

    Returns:
        list of dicts: [{ "farm_id", "before", "after" }, ...]
    """
    if constraints.get("small_farm_min_share") is None:
        constraints["small_farm_min_share"] = defaultCONSTRAINTS["small_farm_min_share"]
    if constraints.get("per_capita_ratio") is None:
        constraints["per_capita_ratio"] = defaultCONSTRAINTS["per_capita_ratio"]
    if constraints.get("need_floor_dollars") is None:
        constraints["need_floor_dollars"] = defaultCONSTRAINTS["need_floor_dollars"]
    if constraints.get("max_single_farm_share") is None:
        constraints["max_single_farm_share"] = defaultCONSTRAINTS["max_single_farm_share"]
    if constraints.get("high_risk_floor_threshold") is None:
        constraints["high_risk_floor_threshold"] = defaultCONSTRAINTS["high_risk_floor_threshold"]
    if constraints.get("high_risk_floor_amount") is None:
        constraints["high_risk_floor_amount"] = defaultCONSTRAINTS["high_risk_floor_amount"]
    
    n = len(farms)
    assert len(yield_scores) == n
    assert len(risk_scores)  == n

    # Normalize risk from 1-100 down to 0-1 for internal math
    risk_norm = np.array(risk_scores, dtype=float) / 100.0
    yield_arr = np.array(yield_scores, dtype=float)

    # Weight = yield x (1 - 0.5 x risk).  High yield = more money.
    # High risk = slight penalty in base run; fairness constraints protect them.
    weights = yield_arr * (1.0 - 0.5 * risk_norm)
    weights = np.clip(weights, 1e-6, None)

    # BEFORE: pure performance split
    before = _weights_to_dollars(weights, total_budget,
                                 constraints.get("max_single_farm_share"))

    # AFTER: enforce fairness on top of before
    after = _apply_fairness(before.copy(), farms, risk_scores,
                            total_budget, constraints)

    # Build return array
    return [
        {
            "farm_id": farms[i].get("farm_id", f"F{i+1:03d}"),
            "before":  round(float(before[i]), 2),
            "after":   round(float(after[i]),  2),
        }
        for i in range(n)
    ]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _weights_to_dollars(weights, total_budget, max_share=None):
    alloc = (weights / weights.sum()) * total_budget
    if max_share:
        cap = max_share * total_budget
        for _ in range(20):
            excess = np.maximum(alloc - cap, 0).sum()
            if excess < 1:
                break
            alloc = np.minimum(alloc, cap)
            uncapped = alloc < cap
            if not uncapped.any():
                break
            alloc[uncapped] += excess * (weights[uncapped] / weights[uncapped].sum())
    return alloc


def _apply_fairness(alloc, farms, risk_scores, total_budget, c):
    small_idx = [i for i, f in enumerate(farms) if f.get("is_small") == 1]
    large_idx = [i for i, f in enumerate(farms) if f.get("is_small") == 0]

    # Floor 1: need-based minimum per farm
    if c.get("need_floor_dollars"):
        for i, farm in enumerate(farms):
            floor = farm.get("baseline_need", 0) * c["need_floor_dollars"]
            alloc[i] = max(alloc[i], floor)

    # Floor 2: high-risk safety net (threshold is 1-100)
    if c.get("high_risk_floor_threshold") and c.get("high_risk_floor_amount"):
        for i in range(len(farms)):
            if risk_scores[i] >= c["high_risk_floor_threshold"]:
                alloc[i] = max(alloc[i], c["high_risk_floor_amount"])

    # Constraint 1: small farms get minimum share of total budget
    if small_idx and c.get("small_farm_min_share"):
        required = c["small_farm_min_share"] * total_budget
        current  = alloc[small_idx].sum()
        if current < required:
            deficit     = required - current
            large_total = alloc[large_idx].sum()
            if large_total > 0:
                for i in large_idx:
                    alloc[i] = max(0, alloc[i] - deficit * (alloc[i] / large_total))
            small_total = alloc[small_idx].sum()
            for i in small_idx:
                alloc[i] += deficit * (alloc[i] / max(small_total, 1e-9))

    # Constraint 2: per-capita parity
    if small_idx and large_idx and c.get("per_capita_ratio"):
        avg_small     = alloc[small_idx].mean()
        avg_large     = alloc[large_idx].mean()
        min_small_avg = c["per_capita_ratio"] * avg_large
        if avg_small < min_small_avg:
            boost       = (min_small_avg - avg_small) * len(small_idx)
            large_total = alloc[large_idx].sum()
            if large_total > 0:
                for i in large_idx:
                    alloc[i] = max(0, alloc[i] - boost * (alloc[i] / large_total))
            for i in small_idx:
                alloc[i] += boost / len(small_idx)

    # Re-apply per-farm cap
    if c.get("max_single_farm_share"):
        alloc = np.minimum(alloc, c["max_single_farm_share"] * total_budget)

    # Normalize to exact budget
    if alloc.sum() > total_budget:
        alloc = alloc / alloc.sum() * total_budget

    return alloc


# ── Demo ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    yield_scores = [0.45, 0.92, 0.38, 0.88, 0.50, 0.95, 0.42, 0.40]
    risk_scores  = [55,   15,   70,   18,   60,   10,   65,   75  ]  # 1-100

    farms = [
        {"farm_id": "F001", "is_small": 1, "baseline_need": 0.80},
        {"farm_id": "F002", "is_small": 0, "baseline_need": 0.30},
        {"farm_id": "F003", "is_small": 1, "baseline_need": 0.90},
        {"farm_id": "F004", "is_small": 0, "baseline_need": 0.40},
        {"farm_id": "F005", "is_small": 1, "baseline_need": 0.70},
        {"farm_id": "F006", "is_small": 0, "baseline_need": 0.20},
        {"farm_id": "F007", "is_small": 1, "baseline_need": 0.80},
        {"farm_id": "F008", "is_small": 1, "baseline_need": 0.95},
    ]

    results = allocate(yield_scores, risk_scores, 1_000_000, farms)

    print(f"\n{'Farm':<8} {'Before':>12} {'After':>12} {'Change':>12}")
    print("-" * 48)
    for r in results:
        change = r["after"] - r["before"]
        sign   = "+" if change >= 0 else ""
        print(f"{r['farm_id']:<8} ${r['before']:>11,.0f} ${r['after']:>11,.0f} {sign}${change:>10,.0f}")
