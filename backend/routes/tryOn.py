# BACKEND: routes/tryOn.py
# ============================================================================

from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from middleware.auth_middleware import get_current_user
from pydantic import BaseModel
import os
import io
from PIL import Image
import requests
import base64
from datetime import datetime
import uuid
from supabase import create_client, Client

router = APIRouter()
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

HF_API_KEY = os.getenv("HUGGING_FACE_API_KEY")
HF_API_URL = "https://api-inference.huggingface.co/models/ZeroGPU/stable-diffusion-v1-5"

@router.post("/tryOn/generate")
async def generate_tryon(
    user_image: UploadFile = File(...),
    product_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Generate virtual try-on - user authenticated via JWT"""
    try:
        user_id = current_user["id"]
        
        # Get product details
        product = supabase.table("products").select("*").eq(
            "id", product_id
        ).single().execute()
        
        if not product.data:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Read and validate image
        image_data = await user_image.read()
        
        # Upload to Supabase Storage
        user_photo_path = f"user-photos/{user_id}/{uuid.uuid4()}.jpg"
        supabase.storage.from_("user-photos").upload(
            user_photo_path,
            image_data
        )
        user_photo_url = supabase.storage.from_("user-photos").get_public_url(user_photo_path)
        
        # Call Hugging Face API
        headers = {"Authorization": f"Bearer {os.getenv('HUGGING_FACE_API_KEY')}"}
        payload = {
            "inputs": f"A person wearing {product.data['name']}, professional photo",
        }
        
        response = requests.post(
            "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            generated_image = response.content
            generated_image_path = f"generated-images/{user_id}/{uuid.uuid4()}.jpg"
            supabase.storage.from_("generated-images").upload(
                generated_image_path,
                generated_image
            )
            generated_url = supabase.storage.from_("generated-images").get_public_url(
                generated_image_path
            )
        else:
            generated_url = user_photo_url  # Fallback
        
        # Save to history
        from datetime import datetime
        import uuid as uuid_lib
        
        supabase.table("tryon_history").insert({
            "id": str(uuid_lib.uuid4()),
            "user_id": user_id,
            "product_id": product_id,
            "original_image_url": user_photo_url,
            "generated_image_url": generated_url,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
        return {
            "original_image": user_photo_url,
            "product_image": product.data["image_url"],
            "generated_image": generated_url,
            "product_name": product.data["name"],
            "product_id": product_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Try-on generation failed: {str(e)}")

@router.get("/tryOn/history")
async def get_tryon_history(current_user: dict = Depends(get_current_user)):
    """Get user's try-on history - secure"""
    response = supabase.table("tryon_history").select(
        "*, products(*)"
    ).eq("user_id", current_user["id"]).order("created_at", desc=True).execute()
    
    return response.data
