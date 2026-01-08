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

# Initialize Supabase
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# Initialize Gradio Client for Virtual Try-On
# We use a public Space that hosts the Kolors Virtual Try-On model
# Note: Public spaces can be slow (queue times), but they are free and high quality.
try:
    hf_client = GradioClient("Kwai-Kolors/Kolors-Virtual-Try-On")
except Exception as e:
    print(f"Warning: Could not connect to AI Model: {e}")
    hf_client = None

@router.post("/generate")
async def generate_tryon(
    user_image: UploadFile = File(...),
    product_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Generate Virtual Try-On using Real Image-to-Image AI (IDM-VTON / Kolors)
    """
    user_id = current_user["id"]
    temp_user_path = f"temp_user_{uuid.uuid4()}.jpg"
    temp_product_path = f"temp_product_{uuid.uuid4()}.jpg"

    try:
        # 1. Fetch Product Image URL from Database
        product_response = supabase.table("products").select("*").eq("id", product_id).single().execute()
        if not product_response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        
        product_image_url = product_response.data['image_url']
        
        # 2. Save User Image Locally (Required for Gradio Client)
        with open(temp_user_path, "wb") as buffer:
            shutil.copyfileobj(user_image.file, buffer)
            
        # 3. Upload User Image to Supabase (For history/storage)
        # We re-open the file since the cursor is at the end
        with open(temp_user_path, "rb") as f:
            user_filename = f"{user_id}/{uuid.uuid4()}.jpg"
            supabase.storage.from_("user-photos").upload(
                user_filename,
                f.read(),
                {"content-type": "image/jpeg"}
            )
        user_photo_url = supabase.storage.from_("user-photos").get_public_url(user_filename)

        # 4. CALL THE AI MODEL (The Magic Step)
        if not hf_client:
            raise HTTPException(status_code=503, detail="AI Service unavailable")

        print("Sending job to AI model... (This may take 30-60 seconds)")
        
        # The Kolors API expects: [person_image, garment_image, ...settings]
        result_path = hf_client.predict(
            handle_file(temp_user_path),      # The user's photo
            handle_file(product_image_url),   # The product image URL
            0, # seed
            True, # randomize_seed
            api_name="/tryon"
        )
        
        print(f"AI Generation complete! Result saved at: {result_path}")

        # 5. Upload the AI Result to Supabase
        # The result comes back as a local temporary file path from Gradio
        generated_filename = f"{user_id}/{uuid.uuid4()}.jpg"
        
        with open(result_path, "rb") as f:
            supabase.storage.from_("generated-images").upload(
                generated_filename,
                f.read(),
                {"content-type": "image/jpeg"}
            )
            
        generated_url = supabase.storage.from_("generated-images").get_public_url(generated_filename)
        
        # 6. Save to Database History
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
        print(f"Try-On Error: {str(e)}")
        # IMPORTANT: Return the original image if AI fails, so the app doesn't crash
        # But add a flag so the frontend knows it failed
        return {
            "success": False,
            "error": str(e),
            "original_image": user_photo_url if 'user_photo_url' in locals() else "",
            "generated_image": user_photo_url if 'user_photo_url' in locals() else "", 
            "product_name": product_response.data["name"] if 'product_response' in locals() else ""
        }
        
    finally:
        # Cleanup temporary files to keep server clean
        if os.path.exists(temp_user_path):
            os.remove(temp_user_path)
        # result_path is managed by gradio_client cache, but we can leave it or clean it periodically
