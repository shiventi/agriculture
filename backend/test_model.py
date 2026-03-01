import os
import numpy as np
from ml import load_training_data, compute_targets, load_model, predict

if __name__ == "__main__":
    base       = os.path.dirname(__file__)
    test_path  = os.path.normpath(os.path.join(base, "testing_data.txt"))
    model_path = os.path.normpath(os.path.join(base, "farm_model.pth"))

    if not os.path.exists(test_path):
        print("ERROR: testing data file not found.")
        print("Run `python generate_data.py` first.")
        exit(1)

    print(f"Loading testing data from: {test_path}")
    X_test = load_training_data(test_path, expected_cols=11)
    
    if X_test.shape[0] == 0:
        print("ERROR: no testing rows loaded.")
        exit(1)

    # Calculate actual targets for the test set solely for final evaluation reporting
    y_test = compute_targets(X_test)

    # ── Load Model ────────────────────────────────────────────────────────
    if not os.path.exists(model_path):
        print("ERROR: farm_model.pth not found. Please train first by running python ml.py")
        exit(1)
        
    print(f"Loading model from: {model_path}")
    model, X_min, X_max, y_min, y_max = load_model(model_path)


    # ════════════════════════════════════════════════════════════════
    # LEVEL 1 — Sanity check: do best/worst/mid give different outputs?
    # ════════════════════════════════════════════════════════════════
    best_farm  = X_test[X_test[:, 7].argmax()]  # highest soil moisture = best
    worst_farm = X_test[X_test[:, 7].argmin()]  # lowest soil moisture  = worst

    mid_farm   = X_test[len(X_test) // 2]       # middle of dataset

    test_farms = np.array([best_farm, worst_farm, mid_farm])
    yields, risks = predict(model, test_farms, X_min, X_max, y_min, y_max)

    print("\n── Level 1: Sanity Check ──────────────────────────────────────")
    print(f"  {'Farm':<6} {'Soil Moisture':<16} {'Yield (t/ha)':<15} {'Risk /100'}")
    print(f"  {'-'*52}")
    labels      = ["best ", "worst", "mid  "]
    soil_values = [best_farm[7], worst_farm[7], mid_farm[7]]
    for i, (yld, risk) in enumerate(zip(yields, risks)):
        print(f"  {labels[i]}  sm={soil_values[i]:.3f}          {yld:.2f}           {risk:.1f}")

    # ════════════════════════════════════════════════════════════════
    # LEVEL 2 — Direction check: did the model learn the right direction?
    # ════════════════════════════════════════════════════════════════
    print("\n── Level 2: Direction Check ───────────────────────────────────")
    print("  best farm  → yield should be HIGH, risk should be LOW")
    print("  worst farm → yield should be LOW,  risk should be HIGH")

    yield_ok = yields[0] > yields[1]   # best yield > worst yield
    risk_ok  = risks[0]  < risks[1]    # best risk  < worst risk

    print(f"\n  Yield: best={yields[0]:.2f}, worst={yields[1]:.2f} → {'✓ PASS' if yield_ok else '✗ FAIL'}")
    print(f"  Risk:  best={risks[0]:.1f},  worst={risks[1]:.1f}  → {'✓ PASS' if risk_ok else '✗ FAIL'}")

    if yield_ok and risk_ok:
        print("\n  ✓ Model learned the correct relationships")
    else:
        print("\n  ✗ Model learned backwards — try more epochs or lower lr")

    # ════════════════════════════════════════════════════════════════
    # LEVEL 3 — Test set evaluation: how accurate on unseen farms?
    # ════════════════════════════════════════════════════════════════
    print("\n── Level 3: Test Set Evaluation ───────────────────────────────")

    yields_pred, risks_pred = predict(model, X_test, X_min, X_max, y_min, y_max)
    yields_actual = y_test[:, 0].tolist()
    risks_actual  = y_test[:, 1].tolist()

    yields_pred_arr   = np.array(yields_pred)
    risks_pred_arr    = np.array(risks_pred)
    yields_actual_arr = np.array(yields_actual)
    risks_actual_arr  = np.array(risks_actual)

    # Mean Absolute Percentage Error — error as % of actual value
    yield_mape = float(np.mean(np.abs((yields_pred_arr - yields_actual_arr) / (yields_actual_arr + 1e-8))) * 100)
    risk_mape  = float(np.mean(np.abs((risks_pred_arr  - risks_actual_arr)  / (risks_actual_arr  + 1e-8))) * 100)

    # R² score — converted to percentage (1.0 = 100% = perfect)
    def r2(actual, pred):
        ss_res = np.sum((actual - pred) ** 2)
        ss_tot = np.sum((actual - np.mean(actual)) ** 2)
        return (1 - (ss_res / (ss_tot + 1e-8))) * 100

    yield_r2 = r2(yields_actual_arr, yields_pred_arr)
    risk_r2  = r2(risks_actual_arr,  risks_pred_arr)

    # Accuracy — how often prediction is within 10% of actual value
    yield_within_10 = float(np.mean(np.abs((yields_pred_arr - yields_actual_arr) / (yields_actual_arr + 1e-8)) < 0.10) * 100)
    risk_within_10  = float(np.mean(np.abs((risks_pred_arr  - risks_actual_arr)  / (risks_actual_arr  + 1e-8)) < 0.10) * 100)

    print(f"\n  Test farms: {len(X_test)}")
    print(f"\n  {'Metric':<35} {'Yield':<20} {'Risk'}")
    print(f"  {'-'*70}")
    print(f"  {'Avg prediction error (MAPE)':<35} {yield_mape:.2f}%              {risk_mape:.2f}%")
    print(f"  {'Variance explained (R²)':<35} {yield_r2:.2f}%              {risk_r2:.2f}%")
    print(f"  {'Predictions within 10% of actual':<35} {yield_within_10:.1f}%              {risk_within_10:.1f}%")

    # Show first 5 test farms side by side
    print(f"\n  First 5 test farms (actual vs predicted):")
    print(f"  {'Actual Yield':<15} {'Pred Yield':<15} {'Actual Risk':<14} {'Pred Risk'}")
    print(f"  {'-'*57}")
    for i in range(min(5, len(X_test))):
        print(f"  {yields_actual[i]:<15.2f} {yields_pred[i]:<15.2f} {risks_actual[i]:<14.1f} {risks_pred[i]:.1f}")

    # ── Final verdict ─────────────────────────────────────────────────
    print("\n── Final Verdict ──────────────────────────────────────────────")
    all_pass = yield_ok and risk_ok and yield_mape < 10.0 and risk_mape < 10.0
    if all_pass:
        print("  ✓ Model is working correctly and ready to use")
    else:
        print("  ✗ Model needs improvement — check failures above")
        if not yield_ok or not risk_ok:
            print("    → Try increasing epochs to 800")
        if yield_mape >= 10.0 or risk_mape >= 10.0:
            print("    → Try lowering lr to 1e-3 or adding more training data")
