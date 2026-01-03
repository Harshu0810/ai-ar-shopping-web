# BACKEND: routes/tryOn.py
# ============================================================================

from fastapi import APIRouter, File, UploadFile, Form, HTTPException
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

@router.post("/generate")
async def generate_tryon(
    user_image: UploadFile = File(...),
    product_id: str = Form(...),
    user_id: str = Form(...)
):
    try:
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized")
        
        # Get product details
        product = supabase.table("products").select("*").eq(
            "id", product_id
        ).single().execute()
        
        if not product.data:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Read user image
        image_data = await user_image.read()
        user_image_b64 = base64.b64encode(image_data).decode()
        
        # Upload user image to Supabase Storage
        user_photo_path = f"user-photos/{user_id}/{uuid.uuid4()}.jpg"
        supabase.storage.from_("user-photos").upload(
            user_photo_path,
            image_data
        )
        user_photo_url = supabase.storage.from_("user-photos").get_public_url(user_photo_path)
        
        # Call Hugging Face API for virtual try-on
        headers = {"Authorization": f"Bearer {HF_API_KEY}"}
        payload = {
            "inputs": f"A person wearing {product.data['name']}, clothing fitting room, professional photo",
        }
        
        response = requests.post(HF_API_URL, headers=headers, json=payload, timeout=30)
        
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
            # Fallback: Return original image
            generated_url = user_photo_url
        
        # Save to history
        supabase.table("tryon_history").insert({
            "id": str(uuid.uuid4()),
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

@router.get("/history")
async def get_tryon_history(user_id: str):
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    response = supabase.table("tryon_history").select(
        "*, products(*)"
    ).eq("user_id", user_id).order("created_at", desc=True).execute()
    
    return response.data
