# BACKEND: routes/tryOn.py
# ============================================================================

from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from middleware.auth_middleware import get_current_user
import os
import uuid
import shutil
from datetime import datetime
from supabase import create_client, Client
from gradio_client import Client as GradioClient, handle_file

router = APIRouter()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# We switch to 'yisol/IDM-VTON' because Kwai-Kolors closed their API.
# IDM-VTON is the industry standard for high-quality virtual try-on.
HF_SPACE = "yisol/IDM-VTON"

@router.post("/generate")
async def generate_tryon(
    user_image: UploadFile = File(...),
    product_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    temp_user_path = f"temp_user_{uuid.uuid4()}.jpg"

    try:
        # 1. Fetch Product
        product_response = supabase.table("products").select("*").eq("id", product_id).single().execute()
        if not product_response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        
        product_image_url = product_response.data['image_url']
        
        # 2. Save User Image Locally
        with open(temp_user_path, "wb") as buffer:
            shutil.copyfileobj(user_image.file, buffer)
            
        # 3. Upload to Supabase (User History)
        with open(temp_user_path, "rb") as f:
            user_filename = f"{user_id}/{uuid.uuid4()}.jpg"
            supabase.storage.from_("user-photos").upload(
                user_filename, f.read(), {"content-type": "image/jpeg"}
            )
        user_photo_url = supabase.storage.from_("user-photos").get_public_url(user_filename)

        # 4. Connect to AI Model
        print(f"Connecting to AI Space: {HF_SPACE}...")
        client = GradioClient(HF_SPACE)
        
        # DEBUG: Print available API endpoints to logs
        # This helps us see exactly what functions are available if it fails
        print("Available API Endpoints:")
        client.view_api()

        print("Sending job to AI model... (This usually takes 40-60 seconds)")
        
        # 5. Call the API
        # yisol/IDM-VTON uses the '/tryon' endpoint.
        # It takes: [dict(background, layers), garment_image, description, is_checked, is_checked, int, int]
        # We simplify by just sending the raw images.
        
        result_path = client.predict(
            dict={"background": handle_file(temp_user_path), "layers": [], "composite": None},
            garm_img=handle_file(product_image_url),
            garment_des="clothing", # Description
            is_checked=True, # Auto-crop
            is_checked_crop=False, # Denoise
            denoise_steps=30,
            seed=42,
            api_name="/tryon" 
        )
        
        # The result is a tuple of images, we usually want the first one (the final output)
        # IDM-VTON returns (image, mask) usually. We check the result type.
        if isinstance(result_path, tuple) or isinstance(result_path, list):
            final_image_path = result_path[0]
        else:
            final_image_path = result_path

        print(f"AI Generation complete! Result saved at: {final_image_path}")

        # 6. Upload Result to Supabase
        generated_filename = f"{user_id}/{uuid.uuid4()}.jpg"
        with open(final_image_path, "rb") as f:
            supabase.storage.from_("generated-images").upload(
                generated_filename, f.read(), {"content-type": "image/jpeg"}
            )
            
        generated_url = supabase.storage.from_("generated-images").get_public_url(generated_filename)
        
        # 7. Save to History
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
            "product_name": product_response.data["name"]
        }

    except Exception as e:
        print(f"Try-On Critical Error: {str(e)}")
        # Fallback: Return original image so app doesn't crash
        return {
            "success": False,
            "error": str(e),
            "original_image": user_photo_url if 'user_photo_url' in locals() else "",
            "generated_image": user_photo_url if 'user_photo_url' in locals() else "",
            "product_name": product_response.data["name"] if 'product_response' in locals() else ""
        }
        
    finally:
        if os.path.exists(temp_user_path):
            os.remove(temp_user_path)
