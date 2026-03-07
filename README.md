# PitchFork

Built for **Hack for Humanity**.

## Inspiration
Inspired by firsthand observations in India, we built this project to use technology to promote fairer subsidy distribution and support small, underserved farms facing economic and technological challenges.

## Problem Statement
About 85% of all U.S. farms are small-scale operations. Over 75% of these small farms receive little to no funding. Subsidies handed out by governments currently favor sheer acreage and volume, favoring large producers, leaving small-operation farmers financially vulnerable and unable to afford climate tech or long-term resilience.

## What Our Product Does
PitchFork is targeted toward the 90,000+ local governments around the world that decide how subsidies are distributed among farms.

Given farm inputs, a total budget, and fairness constraints, PitchFork:
- gathers 11 climate/soil attributes per farm from location data,
- feeds those features into a trained ML model,
- predicts yield (t/ha) and climate risk for each farm,
- allocates subsidies with a mathematical, constraint-based optimizer,
- displays results in a clean front-end experience.

## How We Built It
- **Backend:** Python + Flask pipeline
- **Climate Data:** Open-Meteo API (location-based feature extraction)
- **ML:** Custom PyTorch neural network for yield and risk prediction (trained on realistic generated data)
- **Allocation Engine:** Constraint-based optimization for fairness-aware subsidy division
- **Reasoning Layer:** Groq API (Llama 3.1) for farm-level explanation text
- **Frontend:** Next.js, hosted on Vercel

## Challenges We Ran Into
- Training robust models from realistic generated data required multiple iterations and broader dataset coverage.
- Open-Meteo API limits slowed debugging and testing cycles.

## Accomplishments We’re Proud Of
- End-to-end working product from ingestion to allocation and explanation.
- A trained ML model that produces farm-level yield and climate-risk predictions.
- A fairness-aware subsidy allocation system with strict configurable constraints.
- A polished frontend connected to a production-style backend pipeline.

## What We Learned
- How to train custom ML models and integrate them into real API workflows.
- How to build reliable end-to-end systems across frontend, backend, and data services.
- How to frame technical solutions around real equity and policy problems.

## What’s Next for PitchFork
PitchFork’s core value is quantifying climate risk and predicted yield to support objectively fair subsidy decisions. Next steps include:
- training and comparing multiple ML models,
- improving model calibration and robustness,
- expanding data coverage and reliability.

Prize support would directly help fund training and validation for these improved models.

Demo Video: [https://www.youtube.com/watch?v=wkt_VEJiEt0](https://www.youtube.com/watch?v=wkt_VEJiEt0)

## Contributors
- `Shiven Sheth`
- `Pranay Jain`
- `Varun Madhan`
- `Varun Ramani`
- `Rajith Rajadurai`
- `Saatvik Muthukumar`
