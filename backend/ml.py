import os
import ast
import numpy as np
from typing import Tuple

# Make torch optional at import time so modules that only need data parsing
# (like smoke tests) can import this file even if PyTorch isn't installed.
try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    TORCH_AVAILABLE = True
except Exception:
    torch = None
    nn = None
    optim = None
    TORCH_AVAILABLE = False


class FarmModel(nn.Module):
    """Simple regression model. Can produce multi-output predictions (e.g. yield and risk)."""

    def __init__(self, input_size: int, output_size: int = 2):
        super().__init__()

        self.net = nn.Sequential(
            nn.Linear(input_size, 32),
            nn.ReLU(),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, output_size),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


def load_fake_data(path: str) -> Tuple[np.ndarray, np.ndarray]:
    """Load the `fake_data.txt` file and return (X, y).

    The file contains a `data = [...]` Python literal. The last two columns are
    assumed to be [projected_yield_t_ha, climate_risk_score]. All preceding
    columns are features.
    """

    # Parse the file and extract a literal assigned to the name `data` using
    # the AST module to avoid executing arbitrary code.
    with open(path, "r") as f:
        tree = ast.parse(f.read(), filename=path)

    data_node = None
    for node in tree.body:
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == "data":
                    data_node = node.value
                    break
        if data_node is not None:
            break

    if data_node is None:
        raise ValueError(f"no 'data' assignment found in {path}")

    try:
        data = ast.literal_eval(data_node)
    except Exception as e:
        raise ValueError(f"failed to parse 'data' literal from {path}: {e}")

    arr = np.array(data, dtype=float)
    if arr.ndim != 2 or arr.shape[1] < 5:
        raise ValueError("expected a 2D data array with at least 5 columns")

    # Try to import the features helper (works both when running as package or
    # as a script)
    try:
        from backend import features as feat
    except Exception:
        import features as feat

    cols = arr.shape[1]
    if cols >= 13 or cols == 12:
        # assume last two are explicit outputs
        X = arr[:, :-2].astype(np.float32)
        y = arr[:, -2:].astype(np.float32)
    elif cols == 11:
        # all columns are features; compute targets via formula
        X, _ = feat.build_feature_matrix(data)
        y = compute_targets(X)
    else:
        # fallback: assume last two are outputs
        X = arr[:, :-2].astype(np.float32)
        y = arr[:, -2:].astype(np.float32)

    return X, y


def compute_targets(X: np.ndarray) -> np.ndarray:
    """Compute synthetic targets [projected_yield_t_ha, climate_risk_score].

    Formula (interprets columns as):
      0: temp_mean
      1: temp_max
      2: temp_min
      3: precipitation_sum
      4: et0_sum
      5: vpd_mean
      6: vpd_max
      7: soil_moisture_mean
      8: soil_moisture_min
      9: shortwave_sum
     10: wind_gust_max

    The projected yield is higher with moderate temperatures, more
    precipitation, higher soil moisture and more shortwave radiation, and
    decreases with high VPD and extreme temperatures. The climate risk score is
    a 0-100 value that increases with heat extremes, vapor pressure deficit,
    low soil moisture, and high wind gusts.
    """

    # ensure float
    Xf = X.astype(float)

    temp_mean = Xf[:, 0]
    temp_max = Xf[:, 1]
    temp_min = Xf[:, 2]
    precip = Xf[:, 3]
    et0 = Xf[:, 4]
    vpd_mean = Xf[:, 5]
    vpd_max = Xf[:, 6]
    soil_mean = Xf[:, 7]
    soil_min = Xf[:, 8]
    shortwave = Xf[:, 9]
    wind = Xf[:, 10]

    # Projected yield (t/ha): baseline + positive contributions - penalties
    baseline = 3.0
    # scale precipitation and radiation to reasonable influence
    yield_pred = (
        baseline
        + 0.02 * (precip / 10.0)
        + 0.5 * soil_mean
        + 0.001 * (shortwave / 10.0)
        - 0.03 * np.maximum(0, temp_mean - 25.0)
        - 0.02 * vpd_mean
        - 0.05 * (np.maximum(0, temp_max - 35.0))
        - 0.1 * (np.maximum(0, 15.0 - temp_min))
    )

    # Climate risk score in 0-100
    risk = (
        0.4 * np.clip((temp_max - 30.0), 0, 30)  # extreme heat
        + 0.3 * np.clip((vpd_mean - 1.0) * 10.0, 0, 30)
        + 0.2 * np.clip((1.0 - soil_mean) * 50.0, 0, 30)
        + 0.1 * np.clip((wind - 10.0), 0, 10)
    )

    # normalize risk to 0-100 robustly
    risk = np.clip(risk, 0, 100)

    y = np.vstack([yield_pred, risk]).T.astype(np.float32)
    return y


def train_model(X: np.ndarray, y: np.ndarray, epochs: int = 200, lr: float = 1e-2) -> nn.Module:
    X_t = torch.tensor(X, dtype=torch.float32)
    y_t = torch.tensor(y, dtype=torch.float32)

    model = FarmModel(X_t.shape[1], output_size=y_t.shape[1])
    optimizer = optim.Adam(model.parameters(), lr=lr)
    loss_fn = nn.MSELoss()

    model.train()
    for epoch in range(1, epochs + 1):
        preds = model(X_t)
        loss = loss_fn(preds, y_t)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        if epoch % 50 == 0 or epoch == 1:
            print(f"epoch {epoch}/{epochs} loss={loss.item():.4f}")

    return model


def save_model(model: nn.Module, path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    torch.save(model.state_dict(), path)


def load_model(path: str, input_size: int, output_size: int) -> nn.Module:
    model = FarmModel(input_size, output_size=output_size)
    model.load_state_dict(torch.load(path, map_location="cpu"))
    model.eval()
    return model


def predict(model: nn.Module, X: np.ndarray) -> np.ndarray:
    model.eval()
    with torch.no_grad():
        X_t = torch.tensor(X, dtype=torch.float32)
        preds = model(X_t).numpy()
    return preds


if __name__ == "__main__":
    # locate the fake_data.txt file relative to this script
    base = os.path.dirname(__file__)
    data_path = os.path.normpath(os.path.join(base, "..", "fake_data.txt"))

    print("loading data from:", data_path)
    X, y = load_fake_data(data_path)

    print(f"data shape X={X.shape} y={y.shape}")

    model = train_model(X, y, epochs=300, lr=5e-3)

    model_path = os.path.normpath(os.path.join(base, "farm_model.pth"))
    save_model(model, model_path)
    print("saved model to:", model_path)

