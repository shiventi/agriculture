import os
import pytest

# Basic pipeline test: parse fake_data, build features, compute targets.

from backend import ml
from backend import features

BASE = os.path.dirname(os.path.dirname(__file__))
DATA_PATH = os.path.join(BASE, 'fake_data.txt')


def test_load_and_compute_targets():
    X, y = ml.load_fake_data(DATA_PATH)
    # shapes
    assert X.ndim == 2
    assert y.ndim == 2
    assert X.shape[0] == y.shape[0]
    # feature count should be 11
    assert X.shape[1] == 11
    # targets should have 2 columns
    assert y.shape[1] == 2


@pytest.mark.skipif(not pytest.importorskip('torch'), reason='requires torch')
def test_train_small_model():
    import torch
    X, y = ml.load_fake_data(DATA_PATH)
    # run a very short train to assert no runtime errors
    model = ml.train_model(X, y, epochs=5, lr=1e-2)
    preds = ml.predict(model, X[:5])
    assert preds.shape[0] == 5
    assert preds.shape[1] == 2
