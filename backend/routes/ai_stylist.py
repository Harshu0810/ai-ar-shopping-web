from fastapi import APIRouter, Depends
from middleware.auth_middleware import get_current_user
from supabase import create_client, Client
import os
import requests

router = APIRouter()
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

@router.post("/suggestions")
async def get_style_suggestions(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    skin_tone = data.get("skin_tone")
    occasion = data.get("occasion")
    
    # Option 1: Use OpenAI API (paid)
    # Option 2: Use Hugging Face free models
    # Option 3: Use rule-based logic (free)
    
    # Rule-based implementation (free):
    color_recommendations = {
        "fair": {
            "casual": ["navy", "burgundy", "forest green"],
            "formal": ["charcoal", "navy", "burgundy"],
            "party": ["jewel tones", "rose gold", "silver"]
        },
        "medium": {
            "casual": ["coral", "teal", "mustard"],
            "formal": ["navy", "emerald", "burgundy"],
            "party": ["gold", "ruby", "sapphire"]
        },
        # ... more combinations
    }
    
    colors = color_recommendations.get(skin_tone, {}).get(occasion, [])
    
    # Fetch matching products
    matching_products = supabase.table("products").select("*").in_(
        "color", colors
    ).limit(10).execute()
    
    return {
        "suggestions": [
            f"Try {color} colored items for your {occasion} look"
            for color in colors
        ],
        "recommended_products": matching_products.data
    }
