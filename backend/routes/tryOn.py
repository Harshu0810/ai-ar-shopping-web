# BACKEND: routes/tryOn.py
# ============================================================================

from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from middleware.auth_middleware import get_current_user
import os
import uuid
import shutil
import requests
from datetime import datetime
from supabase import create_client, Client
from gradio_client import Client as GradioClient, handle_file

router = APIRouter()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# Multiple VTON providers with fallback
VTON_PROVIDERS = [
    "yisol/IDM-VTON",           # Official space
    "Nymbo/Virtual-Try-On",     # Reliable mirror
    "levihsu/OOTDiffusion",     # Alternative model
]

@router.post("/generate")
async def generate_tryon(
    user_image: UploadFile = File(...),
    product_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Generate virtual try-on using AI"""
    user_id = current_user["id"]
    temp_user_path = f"/tmp/temp_user_{uuid.uuid4()}.jpg"
    temp_product_path = f"/tmp/temp_product_{uuid.uuid4()}.jpg"

    try:
        print(f"[TRY-ON] Starting for user {user_id}, product {product_id}")

        # 1. Fetch Product from Database
        product_response = supabase.table("products").select("*").eq(
            "id", product_id
        ).single().execute()
        
        if not product_response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        
        product_image_url = product_response.data['image_url']
        product_name = product_response.data['name']
        
        print(f"[TRY-ON] Product: {product_name}")
        print(f"[TRY-ON] Product Image URL: {product_image_url}")

        # 2. Save User Image Locally
        with open(temp_user_path, "wb") as buffer:
            shutil.copyfileobj(user_image.file, buffer)
        print(f"[TRY-ON] User image saved to {temp_user_path}")
            
        # 3. Download Product Image Locally (CRITICAL!)
        print(f"[TRY-ON] Downloading product image from {product_image_url}")
        try:
            response = requests.get(product_image_url, timeout=10)
            response.raise_for_status()
            with open(temp_product_path, "wb") as f:
                f.write(response.content)
            print(f"[TRY-ON] Product image saved to {temp_product_path}")
        except Exception as e:
            print(f"[TRY-ON] ERROR: Failed to download product image: {str(e)}")
            raise HTTPException(
                status_code=400, 
                detail=f"Failed to download product image: {str(e)}"
            )
            
        # 4. Upload User Image to Supabase Storage
        with open(temp_user_path, "rb") as f:
            user_filename = f"{user_id}/{uuid.uuid4()}.jpg"
            supabase.storage.from_("user-photos").upload(
                user_filename, f.read(), {"content-type": "image/jpeg"}
            )
        user_photo_url = supabase.storage.from_("user-photos").get_public_url(user_filename)
        print(f"[TRY-ON] User image uploaded: {user_photo_url}")

        # 5. AI Try-On Generation with Fallback
        generated_url = None
        last_error = None
        generated_image_path = None

        for provider in VTON_PROVIDERS:
            try:
                print(f"[TRY-ON] Attempting provider: {provider}")
                client = GradioClient(provider)
                
                # IDM-VTON API call with LOCAL FILE PATHS
                result = client.predict(
                    dict={
                        "background": handle_file(temp_user_path),
                        "layers": [],
                        "composite": None
                    },
                    garm_img=handle_file(temp_product_path),  # LOCAL FILE PATH!
                    garment_des="clothing item",
                    is_checked=True,
                    is_checked_crop=False,
                    denoise_steps=30,
                    seed=42,
                    api_name="/tryon"
                )
                
                # Handle result (can be tuple or string)
                if isinstance(result, (tuple, list)):
                    generated_image_path = result[0]
                else:
                    generated_image_path = result
                
                print(f"[TRY-ON] SUCCESS with {provider}!")
                print(f"[TRY-ON] Generated image path: {generated_image_path}")
                
                # Upload generated image to Supabase
                generated_filename = f"{user_id}/{uuid.uuid4()}.jpg"
                with open(generated_image_path, "rb") as f:
                    supabase.storage.from_("generated-images").upload(
                        generated_filename, f.read(), {"content-type": "image/jpeg"}
                    )
                generated_url = supabase.storage.from_("generated-images").get_public_url(
                    generated_filename
                )
                
                print(f"[TRY-ON] Generated image URL: {generated_url}")
                break  # Success! Exit loop
                
            except Exception as e:
                print(f"[TRY-ON] Provider {provider} failed: {str(e)}")
                last_error = e
                continue  # Try next provider

        # Check if all providers failed
        if not generated_url:
            print(f"[TRY-ON] ERROR: All AI providers failed")
            print(f"[TRY-ON] Last error: {str(last_error)}")
            
            # Return fallback response
            return {
                "success": False,
                "error": "AI services are temporarily busy. Please try again in a moment.",
                "original_image": user_photo_url,
                "generated_image": user_photo_url,  # Fallback to original
                "product_name": product_name
            }

        # 6. Save to History
        supabase.table("tryon_history").insert({
            "user_id": user_id,
            "product_id": product_id,
            "original_image_url": user_photo_url,
            "generated_image_url": generated_url,
            "created_at": datetime.utcnow().isoformat()
        }).execute()

        print(f"[TRY-ON] Complete! Returning result")
        return {
            "success": True,
            "original_image": user_photo_url,
            "product_image": product_image_url,
            "generated_image": generated_url,
            "product_name": product_name
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[TRY-ON] CRITICAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Return fallback response
        return {
            "success": False,
            "error": f"Try-on generation failed: {str(e)}",
            "original_image": user_photo_url if 'user_photo_url' in locals() else "",
            "generated_image": user_photo_url if 'user_photo_url' in locals() else "",
            "product_name": product_name if 'product_name' in locals() else ""
        }
        
    finally:
        # Cleanup temp files
        for path in [temp_user_path, temp_product_path]:
            if os.path.exists(path):
                try:
                    os.remove(path)
                    print(f"[TRY-ON] Cleaned up: {path}")
                except:
                    pass

@router.get("/history")
async def get_tryon_history(current_user: dict = Depends(get_current_user)):
    """Get user's try-on history"""
    try:
        response = supabase.table("tryon_history").select(
            "*, products(*)"
        ).eq("user_id", current_user["id"]).order(
            "created_at", desc=True
        ).limit(20).execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")
