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
def load_training_data(filepath: str, expected_cols: int = 11) -> np.ndarray:
    """
    Load data from a generated .py file containing a list of floats.
    Handles Python-style list format — skips headers, brackets, comments.
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
                if len(values) == expected_cols:
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
    temp_mean = Xf[:, 0]
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

    temp_mean_n = norm(temp_mean, 15.0,   25.0)
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

    # ── Risk (0-100) ─────────────────────────────────────────────────
    risk = (
        # Water and Moisture Availability (40%)
          0.20 * (1.0 - sm_min_n)
        + 0.15 * (1.0 - precip_n)
        + 0.05 * (1.0 - sm_mean_n)
        
        # Temperature Extremes (30%)
        + 0.15 * temp_max_n
        + 0.10 * (1.0 - temp_min_n)
        + 0.05 * temp_mean_n
        
        # Atmospheric Stress (15%)
        + 0.10 * vpd_max_n
        + 0.05 * vpd_mean_n
        + 0.00 * et0_n
        
        # Energy and Physical Damage (15%)
        + 0.10 * wind_n
        + 0.05 * radiation_n
    )
    risk_score = (np.clip(risk, 0, 1) * 100).astype(np.float32)

    # ── Yield ────────────────────────────────────────────────────────
    # Yield is inversely proportional to risk
    climate_score = np.clip(1.0 - risk, 0, 1)

    base       = CROP_BASE_YIELD.get(crop_type, 5.0)
    yield_pred = (base * (0.4 + climate_score * 1.0)).astype(np.float32)

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
def save_model(
    model: nn.Module,
    path: str,
    X_min: np.ndarray,
    X_max: np.ndarray,
    y_min: np.ndarray,
    y_max: np.ndarray
):
    dir_name = os.path.dirname(path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)
        
    state = {
        "model_state": model.state_dict(),
        "X_min": X_min,
        "X_max": X_max,
        "y_min": y_min,
        "y_max": y_max,
        "input_size": model.net[0].in_features,
        "output_size": model.net[-1].out_features
    }
    torch.save(state, path)


def load_model(path: str) -> Tuple[nn.Module, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    state = torch.load(path, map_location="cpu", weights_only=False)
    
    model = FarmModel(state["input_size"], output_size=state["output_size"])
    model.load_state_dict(state["model_state"])
    model.eval()
    
    return model, state["X_min"], state["X_max"], state["y_min"], state["y_max"]


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
    train_path = os.path.normpath(os.path.join(base, "training_data.txt"))
    test_path  = os.path.normpath(os.path.join(base, "testing_data.txt"))
    model_path = os.path.normpath(os.path.join(base, "farm_model.pth"))

    # ── Load ─────────────────────────────────────────────────────────
    if not os.path.exists(train_path) or not os.path.exists(test_path):
        print("ERROR: training or testing data file not found.")
        exit(1)

    print(f"Loading training data from: {train_path}")
    train_data = load_training_data(train_path, expected_cols=13)
    
    if train_data.shape[0] == 0:
        print("ERROR: no training rows loaded.")
        exit(1)

    # Training data already contains the outputs
    X_train = train_data[:, :11]
    y_train = train_data[:, 11:]

    print(f"Loading testing data from: {test_path}")
    X_test = load_training_data(test_path, expected_cols=11)
    
    if X_test.shape[0] == 0:
        print("ERROR: no testing rows loaded.")
        exit(1)

    # Calculate actual targets for the test set solely for final evaluation reporting
    y_test = compute_targets(X_test)

    print(f"Data shape  — X_train: {X_train.shape}, y_train: {y_train.shape}")
    print(f"Yield range — min: {y_train[:,0].min():.2f}, max: {y_train[:,0].max():.2f} t/ha")
    print(f"Risk range  — min: {y_train[:,1].min():.1f},  max: {y_train[:,1].max():.1f} /100")

    print(f"\nTrain rows: {len(X_train)} | Test rows: {len(X_test)}")

    # ── Train on training set only ────────────────────────────────────
    print()
    model, X_min, X_max, y_min, y_max = train_model(X_train, y_train, epochs=800, lr=5e-3)

    # ── Save ──────────────────────────────────────────────────────────
    save_model(model, model_path, X_min, X_max, y_min, y_max)
    print(f"Model saved to: {model_path}")
