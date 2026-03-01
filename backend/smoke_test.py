"""Lightweight smoke test for the ML pipeline.

This script runs without requiring GPU. It:
 - parses `fake_data.txt` using the same AST-based loader in `ml.py`
 - builds the canonical feature matrix via `backend.features`
 - computes deterministic targets via `ml.compute_targets`
 - optionally trains a tiny PyTorch model if PyTorch is installed

Run:
    python3 backend/smoke_test.py

"""

import os
import sys

BASE = os.path.dirname(__file__)
DATA_PATH = os.path.normpath(os.path.join(BASE, '..', 'fake_data.txt'))


def parse_fake_data_without_numpy(path: str):
    """Parse fake_data.txt using AST literal eval and return rows as lists of floats."""
    import ast

    with open(path, 'r') as f:
        tree = ast.parse(f.read(), filename=path)

    data_node = None
    for node in tree.body:
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == 'data':
                    data_node = node.value
                    break
        if data_node is not None:
            break

    if data_node is None:
        raise RuntimeError('no data assignment found')

    data = ast.literal_eval(data_node)
    rows = [[float(v) for v in r] for r in data]
    return rows


def compute_targets_row(r):
    temp_mean = r[0]
    temp_max = r[1]
    temp_min = r[2]
    precip = r[3]
    et0 = r[4]
    vpd_mean = r[5]
    vpd_max = r[6]
    soil_mean = r[7]
    soil_min = r[8]
    shortwave = r[9]
    wind = r[10]

    baseline = 3.0
    yield_pred = (
        baseline
        + 0.02 * (precip / 10.0)
        + 0.5 * soil_mean
        + 0.001 * (shortwave / 10.0)
        - 0.03 * max(0.0, temp_mean - 25.0)
        - 0.02 * vpd_mean
        - 0.05 * max(0.0, temp_max - 35.0)
        - 0.1 * max(0.0, 15.0 - temp_min)
    )

    risk = (
        0.4 * min(max(temp_max - 30.0, 0.0), 30.0)
        + 0.3 * min(max((vpd_mean - 1.0) * 10.0, 0.0), 30.0)
        + 0.2 * min(max((1.0 - soil_mean) * 50.0, 0.0), 30.0)
        + 0.1 * min(max(wind - 10.0, 0.0), 10.0)
    )
    risk = max(0.0, min(risk, 100.0))
    return (yield_pred, risk)


def main():
    print('Loading data from', DATA_PATH)

    # prefer using the package helpers if available
    rows = None
    try:
        # attempt to import features and ml but gracefully fall back
        import numpy as _np
        from backend import ml as _ml
        X, y = _ml.load_fake_data(DATA_PATH)
        print('X shape:', X.shape)
        print('y shape:', y.shape)

        print('\nFirst 3 feature rows:')
        for i in range(min(3, X.shape[0])):
            print([float(f) for f in X[i]])
        print('\nFirst 3 targets:')
        for i in range(min(3, y.shape[0])):
            print([float(v) for v in y[i]])

        # Try to train if torch is installed
        try:
            import torch
            print('\nPyTorch detected. Training a tiny model for 10 epochs...')
            model = _ml.train_model(X, y, epochs=10, lr=1e-2)
            model_path = os.path.join(BASE, 'farm_model_smoke.pth')
            _ml.save_model(model, model_path)
            print('Saved tiny model to', model_path)
        except Exception:
            print('\nPyTorch not available; skipping training step.')

        return
    except Exception:
        # fallback: pure-Python parse and compute targets without numpy/torch
        rows = parse_fake_data_without_numpy(DATA_PATH)

    print('Parsed rows:', len(rows))
    print('columns per row:', len(rows[0]) if rows else 0)

    results = [compute_targets_row(r) for r in rows]

    print('\nFirst 3 feature rows:')
    for i in range(min(3, len(rows))):
        print(['{:.3f}'.format(x) for x in rows[i]])

    print('\nFirst 3 target rows [yield_t_ha, risk]:')
    for i in range(min(3, len(results))):
        y0, r0 = results[i]
        print('yield={:.3f} t/ha, risk={:.3f}'.format(y0, r0))


if __name__ == '__main__':
    main()
