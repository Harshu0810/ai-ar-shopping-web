# BACKEND: routes/tryOn.py
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from middleware.auth_middleware import get_current_user
import os
import uuid
import shutil
import requests
from datetime import datetime
from supabase import create_client, Client

router = APIRouter()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# Hugging Face API configuration
HF_API_KEY = os.getenv("HUGGING_FACE_API_KEY")

@router.post("/generate")
async def generate_tryon(
    user_image: UploadFile = File(...),
    product_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Generate virtual try-on image
    
    This endpoint accepts a user photo and product ID,
    then generates a virtual try-on image using AI.
    
    Returns:
        - success: bool
        - original_image: str (URL)
        - generated_image: str (URL)
        - product_name: str
        - method: str (which AI service was used)
    """
    user_id = current_user["id"]
    temp_user_path = f"temp_user_{uuid.uuid4()}.jpg"
    user_photo_url = None

    try:
        # ─────────────────────────────────────────────────────────────────
        # STEP 1: VALIDATE & FETCH PRODUCT
        # ─────────────────────────────────────────────────────────────────
        product_response = supabase.table("products").select("*").eq(
            "id", product_id
        ).single().execute()
        
        if not product_response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        
        product = product_response.data
        product_image_url = product['image_url']
        product_name = product['name']
        product_category = product.get('category', 'clothing')

        # ─────────────────────────────────────────────────────────────────
        # STEP 2: VALIDATE & SAVE USER IMAGE
        # ─────────────────────────────────────────────────────────────────
        
        # Validate file type
        if not user_image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Validate file size (5MB max)
        file_content = await user_image.read()
        if len(file_content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image must be less than 5MB")
        
        # Save temporarily
        with open(temp_user_path, "wb") as buffer:
            buffer.write(file_content)
            
        # Upload to Supabase Storage
        user_filename = f"{user_id}/{uuid.uuid4()}.jpg"
        upload_response = supabase.storage.from_("user-photos").upload(
            user_filename, 
            file_content, 
            {"content-type": user_image.content_type}
        )
        
        if upload_response.error:
            raise Exception(f"Storage upload failed: {upload_response.error}")
        
        # Get public URL
        user_photo_url = supabase.storage.from_("user-photos").get_public_url(user_filename)

        # ─────────────────────────────────────────────────────────────────
        # STEP 3: GENERATE TRY-ON IMAGE
        # ─────────────────────────────────────────────────────────────────
        
        # For now, use a simple approach - return the user's original image
        # In production, this would call the AI backend service
        # You can integrate with the Node.js AI service or use Gradio client
        
        print(f"[TRY-ON] Processing for user {user_id}, product {product_name}")
        
        # Upload the same image as "generated" for demo
        # Replace this with actual AI generation in production
        generated_filename = f"{user_id}/{uuid.uuid4()}.jpg"
        gen_upload = supabase.storage.from_("generated-images").upload(
            generated_filename, 
            file_content, 
            {"content-type": "image/jpeg"}
        )
        
        if gen_upload.error:
            raise Exception(f"Failed to upload generated image: {gen_upload.error}")
        
        generated_url = supabase.storage.from_("generated-images").get_public_url(generated_filename)

        # ─────────────────────────────────────────────────────────────────
        # STEP 4: SAVE TO DATABASE
        # ─────────────────────────────────────────────────────────────────
        supabase.table("tryon_history").insert({
            "user_id": user_id,
            "product_id": product_id,
            "original_image_url": user_photo_url,
            "generated_image_url": generated_url,
            "created_at": datetime.utcnow().isoformat()
        }).execute()

        # ─────────────────────────────────────────────────────────────────
        # STEP 5: RETURN SUCCESS RESPONSE
        # ─────────────────────────────────────────────────────────────────
        return {
            "success": True,
            "original_image": user_photo_url,
            "generated_image": generated_url,
            "product_name": product_name,
            "method": "Demo",
            "message": "Try-on generated successfully"
        }

    except HTTPException:
        raise
    
    except Exception as e:
        print(f"[TRY-ON] Error: {str(e)}")
        
        # Return error response
        return {
            "success": False,
            "error": f"Try-on failed: {str(e)}",
            "original_image": user_photo_url or "",
            "generated_image": "",
            "product_name": product_name if 'product_name' in locals() else "",
            "method": "Error"
        }
        
    finally:
        # Cleanup temporary file
        if os.path.exists(temp_user_path):
            os.remove(temp_user_path)

@router.get("/history")
async def get_tryon_history(
    current_user: dict = Depends(get_current_user),
    limit: int = 10
):
    """Get user's virtual try-on history"""
    try:
        response = supabase.table("tryon_history").select(
            "*, products(name, image_url)"
        ).eq("user_id", current_user["id"]).order(
            "created_at", desc=True
        ).limit(limit).execute()
        
        return {
            "success": True,
            "data": response.data
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch history: {str(e)}"
        )
