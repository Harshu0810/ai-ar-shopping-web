# BACKEND: routes/ai_stylist.py
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException
from middleware.auth_middleware import get_current_user
import os

router = APIRouter()

@router.post("/suggestions")
async def get_style_suggestions(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    # Normalize inputs
    skin_tone = data.get("skin_tone", "medium").lower().strip()
    occasion = data.get("occasion", "casual").lower().strip()
    
    # 1. DEFINE MATRIX: Skin Tone x Occasion
    # This ensures every combination gets unique advice
    style_matrix = {
        "fair": {
            "casual": {
                "colors": ["Dusty Pink", "Baby Blue", "Lavender", "Soft Grey"],
                "tip": "Pastels look fresh and airy on you for daytime wear.",
                "outfit": "A soft pastel sundress or light wash denim with a lavender top."
            },
            "professional": {
                "colors": ["Navy Blue", "Camel", "Charcoal", "Crisp White"],
                "tip": "Avoid harsh blacks near your face; opt for navy or charcoal instead.",
                "outfit": "A tailored navy blazer paired with a crisp white blouse."
            },
            "party": {
                "colors": ["Emerald Green", "Ruby Red", "Royal Blue", "Silver"],
                "tip": "Jewel tones provide a stunning contrast to your porcelain skin.",
                "outfit": "A velvet emerald green dress or a silver sequin top."
            },
            "wedding": {
                "colors": ["Blush Pink", "Sage Green", "Lilac", "Gold"],
                "tip": "Soft, romantic hues will complement your undertones perfectly.",
                "outfit": "A flowing sage green gown with gold accessories."
            }
        },
        "medium": {
            "casual": {
                "colors": ["Beige", "Olive Green", "Rust", "Cream"],
                "tip": "Earth tones are your best friend for a relaxed, natural look.",
                "outfit": "Cargo pants in olive paired with a cream linen shirt."
            },
            "professional": {
                "colors": ["Burgundy", "Forest Green", "Dark Brown", "Teal"],
                "tip": "Rich, warm colors convey confidence and professionalism on you.",
                "outfit": "A forest green shift dress or a burgundy knit sweater."
            },
            "party": {
                "colors": ["Metallic Gold", "Electric Blue", "Hot Pink", "Bronze"],
                "tip": "Don't be afraid of metallics, especially gold and bronze.",
                "outfit": "A metallic gold slip dress or an electric blue jumpsuit."
            },
            "wedding": {
                "colors": ["Coral", "Turquoise", "Saffron", "Magenta"],
                "tip": "Vibrant colors pop beautifully against wheatish skin tones.",
                "outfit": "A coral silk saree or a turquoise cocktail dress."
            }
        },
        "dark": {
            "casual": {
                "colors": ["Bright Yellow", "Cobalt Blue", "White", "Orange"],
                "tip": "High contrast colors look incredibly modern and chic on you.",
                "outfit": "A bright yellow summer dress or white linen trousers."
            },
            "professional": {
                "colors": ["Plum", "Black", "Dark Teal", "Cream"],
                "tip": "Deep, saturated colors look authoritative and elegant.",
                "outfit": "A monochrome plum power suit or a classic black sheath dress."
            },
            "party": {
                "colors": ["Neon Green", "Fuchsia", "Silver", "Bright Red"],
                "tip": "You can pull off neon and bold brights better than anyone else.",
                "outfit": "A fuchsia bodycon dress or silver statement jewelry."
            },
            "wedding": {
                "colors": ["Royal Purple", "Gold", "Emerald", "Bright Red"],
                "tip": "Regal colors like purple and gold look majestic on deep skin tones.",
                "outfit": "A royal purple gown with heavy gold detailing."
            }
        }
    }

    # 2. MATCHING LOGIC
    # Map input skin tones to our 3 main categories
    category_map = {
        "fair": "fair", "pale": "fair", "light": "fair",
        "medium": "medium", "wheatish": "medium", "olive": "medium", "tan": "medium",
        "dark": "dark", "deep": "dark", "ebony": "dark"
    }
    
    # Map input occasions to our 4 main categories
    occasion_map = {
        "casual": "casual", "day": "casual",
        "professional": "professional", "office": "professional", "work": "professional", "formal": "professional",
        "party": "party", "night": "party", "club": "party",
        "wedding": "wedding", "festive": "wedding"
    }

    selected_skin = category_map.get(skin_tone, "medium")
    selected_occasion = occasion_map.get(occasion, "casual")

    # 3. RETRIEVE RULES
    rule = style_matrix[selected_skin][selected_occasion]

    # 4. FORMAT RESPONSE
    suggestions = [
        f"For a {occasion} event, we recommend: {', '.join(rule['colors'][:2])}.",
        f"Outfit Idea: {rule['outfit']}",
        f"Stylist Tip: {rule['tip']}",
        f"Color Palette: Try {rule['colors'][2]} or {rule['colors'][3]} for accessories."
    ]
    
    return {"suggestions": suggestions}
