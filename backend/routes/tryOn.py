# BACKEND: routes/tryOn.py
# ============================================================================

from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from middleware.auth_middleware import get_current_user
import os
import uuid
import shutil
import requests
import base64
from datetime import datetime
from supabase import create_client, Client
from gradio_client import Client as GradioClient, handle_file

router = APIRouter()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# 1. Primary VTON Providers (High Quality, but often busy/down)
VTON_PROVIDERS = [
    "yisol/IDM-VTON",
    "levihsu/OOTDiffusion",
]

# 2. Fallback: Standard Hugging Face Inference API (Always available)
# We use this if the specialized VTON models are down.
HF_FALLBACK_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"
HF_API_KEY = os.getenv("HUGGING_FACE_API_KEY")

@router.post("/generate")
async def generate_tryon(
    user_image: UploadFile = File(...),
    product_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    temp_user_path = f"temp_user_{uuid.uuid4()}.jpg"

    try:
        # --- 1. PREPARATION ---
        # Fetch Product Details
        product_response = supabase.table("products").select("*").eq("id", product_id).single().execute()
        if not product_response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        
        product = product_response.data
        product_image_url = product['image_url']
        product_name = product['name']
        product_category = product.get('category', 'clothing')

        # Save User Image Locally
        with open(temp_user_path, "wb") as buffer:
            shutil.copyfileobj(user_image.file, buffer)
            
        # Upload User Image to Supabase
        with open(temp_user_path, "rb") as f:
            user_filename = f"{user_id}/{uuid.uuid4()}.jpg"
            supabase.storage.from_("user-photos").upload(
                user_filename, f.read(), {"content-type": "image/jpeg"}
            )
        user_photo_url = supabase.storage.from_("user-photos").get_public_url(user_filename)

        generated_image_data = None
        used_method = "None"

        # --- 2. ATTEMPT REAL VIRTUAL TRY-ON ---
        print(f"Attempting VTON for user {user_id}...")
        
        for provider in VTON_PROVIDERS:
            try:
                print(f"Connecting to {provider}...")
                client = GradioClient(provider)
                
                if "OOTDiffusion" in provider:
                    # OOTDiffusion specific API
                    result = client.predict(
                        vton_img=handle_file(temp_user_path),
                        garm_img=handle_file(product_image_url),
                        n_samples=1,
                        n_steps=20,
                        image_scale=2,
                        seed=-1,
                        api_name="/process_hd" # Try half-body
                    )
                else:
                    # IDM-VTON specific API
                    result = client.predict(
                        dict={"background": handle_file(temp_user_path), "layers": [], "composite": None},
                        garm_img=handle_file(product_image_url),
                        garment_des=product_category,
                        is_checked=True,
                        is_checked_crop=False,
                        denoise_steps=30,
                        seed=42,
                        api_name="/tryon"
                    )
                
                # Extract path from result tuple/list
                result_path = result[0] if isinstance(result, (tuple, list)) else result
                
                # Read the file
                with open(result_path, "rb") as f:
                    generated_image_data = f.read()
                
                used_method = provider
                print(f"Success with {provider}!")
                break # Exit loop if successful

            except Exception as e:
                print(f"Provider {provider} failed: {e}")
                continue # Try next provider

        # --- 3. FINAL FALLBACK: TEXT-TO-IMAGE (SDXL) ---
        # If all VTON providers failed, we generate a high-quality simulation
        if not generated_image_data:
            print("All VTON providers failed. Switching to SDXL Fallback...")
            try:
                headers = {"Authorization": f"Bearer {HF_API_KEY}"}
                # Create a prompt that describes the user wearing the product
                # Note: This is an approximation, but it guarantees a result.
                prompt = f"Professional photo of a person wearing a {product_name}, {product_category}, realistic texture, high fashion, 8k resolution, studio lighting"
                
                response = requests.post(
                    HF_FALLBACK_URL,
                    headers=headers,
                    json={"inputs": prompt}
                )
                
                if response.status_code == 200:
                    generated_image_data = response.content
                    used_method = "SDXL-Fallback"
                    print("Success with SDXL Fallback!")
                else:
                    raise Exception(f"SDXL Error: {response.text}")
                    
            except Exception as e:
                print(f"Fallback failed: {e}")
                # If even fallback fails, return original image (absolute last resort)
                with open(temp_user_path, "rb") as f:
                    generated_image_data = f.read()
                used_method = "Original-Image-Fallback"

        # --- 4. UPLOAD & SAVE ---
        generated_filename = f"{user_id}/{uuid.uuid4()}.jpg"
        
        supabase.storage.from_("generated-images").upload(
            generated_filename, 
            generated_image_data, 
            {"content-type": "image/jpeg"}
        )
        
        generated_url = supabase.storage.from_("generated-images").get_public_url(generated_filename)
        
        # Save to Database
        supabase.table("tryon_history").insert({
            "user_id": user_id,
            "product_id": product_id,
            "original_image_url": user_photo_url,
            "generated_image_url": generated_url,
            "created_at": datetime.utcnow().isoformat()
        }).execute()

        return {
            "success": True,
            "original_image": user_photo_url,
            "generated_image": generated_url,
            "product_name": product_name,
            "method": used_method
        }

    except Exception as e:
        print(f"Critical Try-On Error: {str(e)}")
        # Don't crash the frontend, return error state
        return {
            "success": False,
            "error": "Service busy. Please try again.",
            "original_image": user_photo_url if 'user_photo_url' in locals() else "",
            "generated_image": "",
            "product_name": ""
        }
        
    finally:
        if os.path.exists(temp_user_path):
            os.remove(temp_user_path)
