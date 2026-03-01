import os
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from typing import Tuple


# ── Device setup (AMD ROCm or CPU) ──────────────────────────────────
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {DEVICE}")


# ── Data loading ─────────────────────────────────────────────────────
def load_training_data(filepath: str) -> np.ndarray:
    """
    Load training data from fake_data.txt.
    Handles Python-style list format — skips headers, brackets, comments.
    Only accepts lines that parse into exactly 11 floats.
    """
    data = []
    with open(filepath, "r") as f:
        for line in f:
            line = line.strip().strip("[],")
            if not line:
                continue
            if line.startswith("#"):
                continue
            if line.startswith('"'):
                continue
            if line.startswith("data"):
                continue
            if line == "]":
                continue
            try:
                values = [float(x.strip()) for x in line.split(",") if x.strip()]
                if len(values) == 11:
                    data.append(values)
            except ValueError:
                continue
    return np.array(data, dtype=np.float32)


# ── Crop base yields (t/ha) based on USDA/FAO real-world averages ───
CROP_BASE_YIELD = {
    "wheat":      3.5,
    "corn":       10.0,
    "cotton":     1.0,
    "almonds":    2.0,
    "grapes":     10.0,
    "vegetables": 20.0,
}


# ── Target computation ───────────────────────────────────────────────
def compute_targets(X: np.ndarray, crop_type: str = "wheat") -> np.ndarray:
    """
    Compute synthetic targets [projected_yield_t_ha, climate_risk_score].

    Column reference:
      0:  temp_mean          — average season temperature (C)
      1:  temp_max           — hottest day (C)
      2:  temp_min           — coldest night (C)
      3:  precipitation_sum  — total rainfall (mm)
      4:  et0_sum            — crop water demand (mm)
      5:  vpd_mean           — avg atmospheric dryness (kPa)
      6:  vpd_max            — peak atmospheric dryness (kPa)
      7:  soil_moisture_mean — avg root zone moisture (m3/m3)
      8:  soil_moisture_min  — driest moment (m3/m3)
      9:  shortwave_sum      — total solar radiation (MJ/m2)
      10: wind_gust_max      — strongest wind gust (m/s)

    Yield formula:
      yield = base_yield * (0.4 + clip(climate_score, 0, 1))
      climate_score = 0.30*SM + 0.20*P + 0.20*R - 0.20*VPD - 0.10*WD

    Risk formula (0-100):
      risk = clip(
          0.30*(1-SM_min) + 0.20*VPD_max + 0.15*T_max
        + 0.10*(1-T_min)  + 0.10*W       + 0.10*(1-P)
        - 0.05*SM_mean
      , 0, 1) * 100
    """
    Xf = X.astype(float)

    temp_max  = Xf[:, 1]
    temp_min  = Xf[:, 2]
    precip    = Xf[:, 3]
    et0       = Xf[:, 4]
    vpd_mean  = Xf[:, 5]
    vpd_max   = Xf[:, 6]
    sm_mean   = Xf[:, 7]
    sm_min    = Xf[:, 8]
    shortwave = Xf[:, 9]
    wind      = Xf[:, 10]

    # Normalize each input to 0-1 using observed data ranges
    def norm(arr, lo, hi):
        return np.clip((arr - lo) / (hi - lo), 0, 1)

    temp_max_n  = norm(temp_max,  30.0,   48.0)
    temp_min_n  = norm(temp_min,   1.0,    8.0)
    precip_n    = norm(precip,   140.0,  325.0)
    vpd_mean_n  = norm(vpd_mean,   1.0,    3.5)
    vpd_max_n   = norm(vpd_max,    2.0,    6.5)
    sm_mean_n   = norm(sm_mean,    0.11,   0.32)
    sm_min_n    = norm(sm_min,     0.06,   0.23)
    radiation_n = norm(shortwave, 6000.0, 8250.0)
    wind_n      = norm(wind,      16.0,   29.5)
    et0_n       = norm(et0,      785.0,  1145.0)

    # Water deficit: how much more water crops demand vs what fell
    water_deficit = np.clip(et0_n - precip_n, 0, 1)

    # ── Yield ────────────────────────────────────────────────────────
    climate_score = (
        0.30 * sm_mean_n
        + 0.20 * precip_n
        + 0.20 * radiation_n
        - 0.20 * vpd_mean_n
        - 0.10 * water_deficit
    )
    climate_score = np.clip(climate_score, 0, 1)

    base       = CROP_BASE_YIELD.get(crop_type, 5.0)
    yield_pred = (base * (0.4 + climate_score * 1.0)).astype(np.float32)

    # ── Risk (0-100) ─────────────────────────────────────────────────
    risk = (
        0.30 * (1 - sm_min_n)      # drought vulnerability
        + 0.20 * vpd_max_n         # peak heat + dryness event
        + 0.15 * temp_max_n        # extreme heat damage
        + 0.10 * (1 - temp_min_n)  # frost risk
        + 0.10 * wind_n            # wind damage
        + 0.10 * (1 - precip_n)    # low rainfall risk
        - 0.05 * sm_mean_n         # moisture buffer reduces risk
    )
    risk_score = (np.clip(risk, 0, 1) * 100).astype(np.float32)

    return np.vstack([yield_pred, risk_score]).T


# ── Normalization ────────────────────────────────────────────────────
def normalize_X(X: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Normalize X to 0-1 range column by column.
    Returns normalized X plus the min/max used so inference
    can apply the same scaling.
    """
    X_min  = X.min(axis=0)
    X_max  = X.max(axis=0)
    X_norm = (X - X_min) / (X_max - X_min + 1e-8)
    return X_norm.astype(np.float32), X_min, X_max


# ── Model ────────────────────────────────────────────────────────────
class FarmModel(nn.Module):
    """
    MLP regression model.
    Output 0: projected yield (t/ha)
    Output 1: climate risk score (0-100)
    Both outputs are normalized to 0-1 during training
    and denormalized at inference time.
    """
    def __init__(self, input_size: int, output_size: int = 2):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_size, 64),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, output_size),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # sigmoid keeps outputs in 0-1 range (matching normalized y)
        return torch.sigmoid(self.net(x))


# ── Training ─────────────────────────────────────────────────────────
def train_model(
    X: np.ndarray,
    y: np.ndarray,
    epochs: int = 600,
    lr: float = 5e-3
) -> Tuple[nn.Module, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Normalizes both X and y to 0-1 before training so all features
    and both outputs contribute equally to the loss.
    Returns model + X and y scaling params needed for inference.
    """
    # Normalize X — critical because features range from 0.2 to 8000
    X_norm, X_min, X_max = normalize_X(X)

    # Normalize y so yield (1-3 range) and risk (0-100) weight equally
    y_min  = y.min(axis=0)
    y_max  = y.max(axis=0)
    y_norm = (y - y_min) / (y_max - y_min + 1e-8)

    X_t = torch.tensor(X_norm, dtype=torch.float32).to(DEVICE)
    y_t = torch.tensor(y_norm, dtype=torch.float32).to(DEVICE)

    model     = FarmModel(X_t.shape[1], output_size=y_t.shape[1]).to(DEVICE)
    optimizer = optim.Adam(model.parameters(), lr=lr)
    loss_fn   = nn.MSELoss()

    model.train()
    for epoch in range(1, epochs + 1):
        preds = model(X_t)
        loss  = loss_fn(preds, y_t)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        if epoch % 50 == 0 or epoch == 1:
            print(f"Epoch {epoch:3d}/{epochs} | Loss: {loss.item():.6f}")

    print("Training complete.")
    return model, X_min, X_max, y_min, y_max


# ── Save / Load ───────────────────────────────────────────────────────
def save_model(model: nn.Module, path: str):
    dir_name = os.path.dirname(path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)
    torch.save(model.state_dict(), path)


def load_model(path: str, input_size: int, output_size: int = 2) -> nn.Module:
    model = FarmModel(input_size, output_size=output_size)
    model.load_state_dict(torch.load(path, map_location="cpu"))
    model.eval()
    return model


# ── Inference ─────────────────────────────────────────────────────────
def predict(
    model:  nn.Module,
    X:      np.ndarray,
    X_min:  np.ndarray,
    X_max:  np.ndarray,
    y_min:  np.ndarray,
    y_max:  np.ndarray
) -> Tuple[list, list]:
    """
    Takes raw (unnormalized) feature rows for new farms.
    Normalizes X the same way as training, runs inference,
    then denormalizes predictions back to original units.
    Returns (yield_scores t/ha, risk_scores 0-100).
    """
    # Apply the same X normalization used during training
    X_norm = (X - X_min) / (X_max - X_min + 1e-8)

    model.eval()
    with torch.no_grad():
        X_t   = torch.tensor(X_norm, dtype=torch.float32).to(DEVICE)
        preds = model(X_t).cpu().numpy()

    # Denormalize back to original scale
    preds_real   = preds * (y_max - y_min) + y_min
    yield_scores = preds_real[:, 0].tolist()
    risk_scores  = preds_real[:, 1].tolist()
    return yield_scores, risk_scores


# ── Entry point ───────────────────────────────────────────────────────
if __name__ == "__main__":
    base       = os.path.dirname(__file__)
    data_path  = os.path.normpath(os.path.join(base, "..", "fake_data.txt"))
    model_path = os.path.normpath(os.path.join(base, "farm_model.pth"))

    # ── Load ─────────────────────────────────────────────────────────
    if not os.path.exists(data_path):
        print(f"ERROR: data file not found at: {data_path}")
        exit(1)

    print(f"Loading data from: {data_path}")
    X = load_training_data(data_path)

    if X.shape[0] == 0:
        print("ERROR: no rows loaded — check file format")
        exit(1)

    if X.shape[1] != 11:
        print(f"ERROR: expected 11 columns, got {X.shape[1]}")
        exit(1)

    y = compute_targets(X)

    print(f"Data shape  — X: {X.shape}, y: {y.shape}")
    print(f"Yield range — min: {y[:,0].min():.2f}, max: {y[:,0].max():.2f} t/ha")
    print(f"Risk range  — min: {y[:,1].min():.1f},  max: {y[:,1].max():.1f} /100")

    # ── Split 80% train / 20% test BEFORE training ───────────────────
    split   = int(len(X) * 0.8)
    X_train = X[:split]
    X_test  = X[split:]
    y_train = y[:split]
    y_test  = y[split:]
    print(f"\nTrain rows: {len(X_train)} | Test rows: {len(X_test)}")

    # ── Train on training set only ────────────────────────────────────
    print()
    model, X_min, X_max, y_min, y_max = train_model(X_train, y_train, epochs=800, lr=5e-3)

    # ── Save ──────────────────────────────────────────────────────────
    save_model(model, model_path)
    print(f"Model saved to: {model_path}")

    # ════════════════════════════════════════════════════════════════
    # LEVEL 1 — Sanity check: do best/worst/mid give different outputs?
    # ════════════════════════════════════════════════════════════════
    best_farm  = X[X[:, 7].argmax()]  # highest soil moisture = best
    worst_farm = X[X[:, 7].argmin()]  # lowest soil moisture  = worst
    mid_farm   = X[len(X) // 2]       # middle of dataset

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
