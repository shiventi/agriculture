# Agriculture Project

Hack‑Farming – FastAPI backend that loads a farms CSV, optionally enriches each record with weather/soil API data, trains a tiny PyTorch MLP to predict yield & climate risk, and allocates subsidies using OR‑Tools with a fairness constraint for small‑holder farms (is_small == 1). Returns dashboard‑ready JSON (predictions, subsidy amounts, LLM reasoning) and supports an AMD ROCm GPU version for fast training/inference.

