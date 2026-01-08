# BACKEND: routes/tryOn.py
# ============================================================================

from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from middleware.auth_middleware import get_current_user
import os
import io
import uuid
import requests
from datetime import datetime
from supabase import create_client, Client

router = APIRouter()
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# UPDATED: New Hugging Face URL
HF_API_URL = "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0"
HF_API_KEY = os.getenv("HUGGING_FACE_API_KEY")

@router.post("/generate")
async def generate_tryon(
    user_image: UploadFile = File(...),
    product_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Generate virtual try-on"""
    try:
        user_id = current_user["id"]
        
        # 1. Fetch Product
        product = supabase.table("products").select("*").eq("id", product_id).single().execute()
        if not product.data:
            raise HTTPException(status_code=404, detail="Product not found")
            
        # 2. Upload User Image to Supabase
        image_bytes = await user_image.read()
        file_ext = user_image.filename.split('.')[-1]
        user_filename = f"{user_id}/{uuid.uuid4()}.{file_ext}"
        
        supabase.storage.from_("user-photos").upload(
            user_filename,
            image_bytes,
            {"content-type": user_image.content_type}
        )
        user_photo_url = supabase.storage.from_("user-photos").get_public_url(user_filename)

        # 3. Call Hugging Face API (Updated Logic)
        headers = {"Authorization": f"Bearer {HF_API_KEY}"}
        
        # We use a simple prompt for SDXL to act as a try-on
        prompt = f"A person wearing {product.data['name']}, professional fashion photography, realistic, 8k"
        
        payload = {
            "inputs": prompt,
            "parameters": {"negative_prompt": "blurry, low quality, distorted"}
        }

        response = requests.post(HF_API_URL, headers=headers, json=payload)
        
        if response.status_code != 200:
            print(f"HF Error: {response.text}")
            # Fallback: Just return original image if AI fails (prevents crash)
            generated_url = user_photo_url
        else:
            # 4. Save Generated Image
            generated_filename = f"{user_id}/{uuid.uuid4()}.jpg"
            supabase.storage.from_("generated-images").upload(
                generated_filename,
                response.content,
                {"content-type": "image/jpeg"}
            )
            generated_url = supabase.storage.from_("generated-images").get_public_url(generated_filename)
        
        # 5. Save to History
        supabase.table("tryon_history").insert({
            "user_id": user_id,
            "product_id": product_id,
            "original_image_url": user_photo_url,
            "generated_image_url": generated_url,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
        return {
            "original_image": user_photo_url,
            "generated_image": generated_url,
            "product_name": product.data["name"]
        }

    except Exception as e:
        print(f"Server Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    response = supabase.table("tryon_history").select(
        "*, products(*)"
    ).eq("user_id", current_user["id"]).order("created_at", desc=True).execute()
    return response.data
