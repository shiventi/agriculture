import os
from dotenv import load_dotenv
from groq import Groq
load_dotenv()
# Initialize the Groq client. It will automatically look for the GROQ_API_KEY environment variable.
client = Groq()

# The exact feature names corresponding to your 11 data points
FEATURE_NAMES = [
    "Average Season Temp (C)",
    "Extreme Heat Max (C)", 
    "Frost Risk Min (C)",
    "Total Precipitation (mm)",
    "Total Evapotranspiration (mm)",
    "Mean Vapour Pressure Deficit (kPa)",
    "Max Vapour Pressure Deficit (kPa)",
    "Mean Soil Moisture (m3/m3)",
    "Min Soil Moisture (m3/m3)",
    "Total Solar Radiation (MJ/m2)",
    "Max Wind Gusts (m/s)"
]

def generate_farm_reasoning(farm_id: str, raw_features: list, allocation_amount: float) -> dict:
    """
    Takes the raw climate data and the final allocation, and uses Groq 
    to write a short justification for the frontend.
    """
    
    # 1. Map the raw numbers to their human-readable names
    # Example: "Average Season Temp (C): 18.5"
    climate_context = "\n".join(
        [f"- {name}: {val}" for name, val in zip(FEATURE_NAMES, raw_features)]
    )
    
    # 2. Build the prompt for Groq
    prompt = f"""
    You are an agricultural financial advisor. We are allocating subsidies to farms based on climate risk.
    
    Farm ID: {farm_id}
    Allocated Amount: ${allocation_amount:,.2f}
    
    Here is the climate and soil data for this farm:
    {climate_context}
    
    Write a short, 2-3 sentence explanation of why this farm received this specific funding amount. 
    Point out 1 or 2 specific climate metrics from the data above (e.g., extreme heat, low precipitation, or soil moisture) that justify financial support. 
    Keep it professional, direct, and easy for a farmer or business owner to understand. Do not use markdown.
    """
    
    try:
        # 3. Call the Groq API (Using Llama 3 8B because it is blazing fast and free)
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that explains agricultural data."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.1-8b-instant", # This is the fastest Groq model, and it's free to use with your API key
            temperature=0.3, # Low temperature keeps the response factual and grounded
            max_tokens=120   # Keep the response short to save time
        )
        
        reasoning_text = chat_completion.choices[0].message.content.strip()
        
    except Exception as e:
        print(f"Groq API Error for Farm {farm_id}: {e}")
        reasoning_text = "Reasoning temporarily unavailable due to API limits."

    # 4. Return the exact format the frontend needs to map it to the right card
    return {
        "farm_id": farm_id,
        "reasoning": reasoning_text
    }

# --- Quick Test ---
if __name__ == "__main__":
    test_farm_id = "F001"
    # Using the first row of your provided data
    test_data = [18.5, 38.2, 4.1, 240.0, 920.0, 1.8, 3.6, 0.22, 0.14, 6900.0, 21.3]
    test_allocation = 12500.00
    
    result = generate_farm_reasoning(test_farm_id, test_data, test_allocation)
    print(f"Farm ID: {result['farm_id']}")
    print(f"Reasoning: {result['reasoning']}")