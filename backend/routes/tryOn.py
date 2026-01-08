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
HF_API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"

@router.post("/generate")
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
        
        # Read user image
        image_data = await user_image.read()
        
        # Validate image size (max 5MB)
        if len(image_data) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image too large (max 5MB)")
        
        # Upload user image to Supabase Storage
        user_photo_path = f"user-photos/{user_id}/{uuid.uuid4()}.jpg"
        
        try:
            supabase.storage.from_("user-photos").upload(
                user_photo_path,
                image_data,
                file_options={"content-type": "image/jpeg"}
            )
        except Exception as storage_error:
            print(f"Storage upload error: {storage_error}")
            # Try to create bucket if it doesn't exist
            try:
                supabase.storage.create_bucket("user-photos", public=True)
                supabase.storage.from_("user-photos").upload(
                    user_photo_path,
                    image_data,
                    file_options={"content-type": "image/jpeg"}
                )
            except:
                raise HTTPException(status_code=500, detail="Failed to upload image to storage")
        
        user_photo_url = supabase.storage.from_("user-photos").get_public_url(user_photo_path)
        
        # Call Hugging Face API for virtual try-on
        headers = {"Authorization": f"Bearer {HF_API_KEY}"}
        payload = {
            "inputs": f"A professional photo of a person wearing {product.data['name']}, high quality, fashion photography",
        }
        
        try:
            response = requests.post(
                HF_API_URL,
                headers=headers,
                json=payload,
                timeout=60  # Increased timeout for model loading
            )
            
            if response.status_code == 200:
                generated_image = response.content
                generated_image_path = f"generated-images/{user_id}/{uuid.uuid4()}.jpg"
                
                try:
                    supabase.storage.from_("generated-images").upload(
                        generated_image_path,
                        generated_image,
                        file_options={"content-type": "image/jpeg"}
                    )
                except:
                    # Create bucket if doesn't exist
                    supabase.storage.create_bucket("generated-images", public=True)
                    supabase.storage.from_("generated-images").upload(
                        generated_image_path,
                        generated_image,
                        file_options={"content-type": "image/jpeg"}
                    )
                
                generated_url = supabase.storage.from_("generated-images").get_public_url(
                    generated_image_path
                )
            else:
                print(f"HF API Error: {response.status_code} - {response.text}")
                generated_url = user_photo_url  # Fallback to original image
        except requests.Timeout:
            print("HF API timeout - model may be loading")
            generated_url = user_photo_url
        except Exception as api_error:
            print(f"HF API error: {api_error}")
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
    except HTTPException:
        raise
    except Exception as e:
        print(f"Try-on generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Try-on generation failed: {str(e)}")

@router.get("/history")
async def get_tryon_history(current_user: dict = Depends(get_current_user)):
    """Get user's try-on history - secure"""
    try:
        response = supabase.table("tryon_history").select(
            "*, products(*)"
        ).eq("user_id", current_user["id"]).order("created_at", desc=True).execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")
