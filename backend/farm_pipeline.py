import pandas as pd
import numpy as np

# Import from your other modules
from apis import get_weather, get_soil, get_drought_index
from ml import train_model, predict, benchmark_inference
from allocate import allocate
from llm import generate_farm_explanation, generate_portfolio_summary

def run_pipeline(df: pd.DataFrame, fairness_on: bool = True, explain: bool = True):
    """
    Orchestrates the entire AgriEquity workflow: 
    Enrich -> Train -> Predict -> Allocate -> Explain
    """
    
    # --- 1. ENRICHMENT LAYER ---
    enriched_data = []
    for _, row in df.iterrows():
        # Fetch data from APIs
        weather = get_weather(row['lat'], row['lon'])
        soil = get_soil(row['lat'], row['lon'])
        drought = get_drought_index(weather['total_precip_mm'], weather['avg_temp_max'])
        
        # Merge API data with the original CSV row
        farm_dict = row.to_dict()
        farm_dict.update(weather)
        farm_dict.update(soil)
        farm_dict['drought_index'] = drought
        enriched_data.append(farm_dict)
        
    enriched_df = pd.DataFrame(enriched_data)
    
    # --- 2. FEATURE ENGINEERING (Mocked for now) ---
    # Your PyTorch MLP expects an input dimension of 9.
    # Until we write features.py, we will just generate fake normalized data 
    # so the model can run and the frontend can be unblocked.
    num_farms = len(enriched_df)
    X_features = np.random.rand(num_farms, 9) 
    
    # --- 3. ML TRAINING & PREDICTION ---
    # Train the model on the fly (keep epochs low for the demo so it's fast)
    model = train_model(X_features, epochs=50)
    
    # Get predictions
    yield_scores, risk_scores = predict(model, X_features)
    
    # Run the AMD GPU benchmark
    benchmark_stats = benchmark_inference(model, X_features)
    
    # --- 4. OPTIMIZATION & ALLOCATION ---
    allocations, metrics = allocate(
        enriched_df, 
        yield_scores, 
        risk_scores, 
        fairness_on=fairness_on
    )
    
    # --- 5. LLM REASONING LAYER ---
    farm_results = []
    for i, row in enriched_df.iterrows():
        farm_res = {
            "farm_id": row['farm_id'],
            "lat": row['lat'],
            "lon": row['lon'],
            "crop": row['crop'],
            "is_small": row['is_small'],
            "yield_score": round(yield_scores[i], 3),
            "risk_score": round(risk_scores[i], 3),
            "allocation": round(allocations[i], 2),
        }
        
        # Only call Claude if explanation is requested (saves time/money)
        if explain:
            farm_res["explanation"] = generate_farm_explanation(
                row, allocations[i], yield_scores[i], risk_scores[i], fairness_on
            )
            
        farm_results.append(farm_res)

    summary_text = ""
    if explain:
        summary_text = generate_portfolio_summary(farm_results, metrics, fairness_on)

    # --- 6. RETURN DASHBOARD PAYLOAD ---
    return {
        "status": "success",
        "fairness_mode": "ON" if fairness_on else "OFF",
        "farms": farm_results,
        "metrics": metrics,
        "benchmark": benchmark_stats,
        "portfolio_summary": summary_text
    }