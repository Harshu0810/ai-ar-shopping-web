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
    # Normalize inputs (handle upper/lowercase)
    skin_tone = data.get("skin_tone", "").lower().strip()
    occasion = data.get("occasion", "").lower().strip()
    
    # 1. Stylist Knowledge Base
    style_rules = {
        "fair": {
            "colors": ["Emerald Green", "Navy Blue", "Camel", "Soft Pink"],
            "tip": "Contrast is your friend. Darker colors make your features pop."
        },
        "light": {
            "colors": ["Emerald Green", "Navy Blue", "Charcoal", "Burgundy"],
            "tip": "Rich, cool tones will complement your undertones best."
        },
        "medium": {
            "colors": ["Metallic Gold", "Royal Blue", "Beige", "Earth Tones"],
            "tip": "Warm earth tones and vibrant jewel tones look fantastic on you."
        },
        "tan": {
            "colors": ["Rose Gold", "Plum", "Emerald", "Burnt Orange"],
            "tip": "Highlight your natural glow with shades of pink and deep greens."
        },
        "olive": {
            "colors": ["Rose Gold", "Plum", "Emerald", "Burnt Orange"],
            "tip": "Highlight your natural glow with shades of pink and deep greens."
        },
        "dark": {
            "colors": ["Cobalt Blue", "Bright White", "Ruby Red", "Gold"],
            "tip": "Bright, bold colors look stunning against your skin. Don't be afraid to stand out!"
        },
        "deep": {
            "colors": ["Yellow", "Bright White", "Fuchsia", "Silver"],
            "tip": "High-contrast colors look amazing. Avoid browns that match your skin tone too closely."
        }
    }
    
    # 2. Fallback if skin tone isn't found (Default to Medium logic)
    rule = style_rules.get(skin_tone)
    if not rule:
        # Try to match partially (e.g. "very fair" -> "fair")
        for key in style_rules:
            if key in skin_tone:
                rule = style_rules[key]
                break
        if not rule:
            rule = style_rules["medium"] # Final default

    # 3. Generate Suggestions
    suggestions = [
        f"For a {occasion} look with {skin_tone} skin, we highly recommend wearing {rule['colors'][0]} or {rule['colors'][1]}.",
        f"Try accessorizing with {rule['colors'][2]} to elevate your style.",
        f"Stylist Tip: {rule['tip']}",
        f"Why it works: These colors create the perfect contrast for your complexion."
    ]
    
    return {"suggestions": suggestions}
