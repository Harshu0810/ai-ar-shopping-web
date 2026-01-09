# BACKEND: routes/tryOn.py - BULLETPROOF VERSION
# ============================================================================

from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from middleware.auth_middleware import get_current_user
import os
import uuid
import shutil
import requests
from datetime import datetime
from supabase import create_client, Client
from PIL import Image
from io import BytesIO

router = APIRouter()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# Import Gradio client (with try-except for safety)
try:
    from gradio_client import Client as GradioClient, handle_file
    GRADIO_AVAILABLE = True
except ImportError:
    GRADIO_AVAILABLE = False
    print("[WARNING] gradio_client not installed. Try-on will use fallback mode.")

# Multiple providers with working spaces
VTON_PROVIDERS = [
    "yisol/IDM-VTON",
    "Nymbo/Virtual-Try-On", 
    "levihsu/OOTDiffusion",
]

def simple_overlay_fallback(user_image_path: str, product_image_path: str, output_path: str):
    """
    Simple image overlay fallback when AI services are unavailable.
    This composites the product onto the user's photo.
    """
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        # Load images
        user_img = Image.open(user_image_path).convert("RGBA")
        product_img = Image.open(product_image_path).convert("RGBA")
        
        # Resize product to fit nicely on the user
        target_width = int(user_img.width * 0.4)
        aspect_ratio = product_img.height / product_img.width
        target_height = int(target_width * aspect_ratio)
        product_img = product_img.resize((target_width, target_height), Image.Resampling.LANCZOS)
        
        # Calculate position (center-top of the user image)
        x_pos = (user_img.width - target_width) // 2
        y_pos = int(user_img.height * 0.25)
        
        # Create composite
        result = user_img.copy()
        result.paste(product_img, (x_pos, y_pos), product_img)
        
        # Add watermark
        draw = ImageDraw.Draw(result)
        try:
            # Try to load a font, fall back to default if not available
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
        except:
            font = ImageFont.load_default()
        
        draw.text((10, 10), "Virtual Try-On Preview", fill=(255, 255, 255, 200), font=font)
        
        # Save as RGB
        result = result.convert("RGB")
        result.save(output_path, "JPEG", quality=90)
        return True
    except Exception as e:
        print(f"[FALLBACK] Simple overlay failed: {e}")
        return False

@router.post("/generate")
async def generate_tryon(
    user_image: UploadFile = File(...),
    product_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Generate virtual try-on with multiple fallback strategies"""
    user_id = current_user["id"]
    
    # Use /tmp for Render compatibility
    temp_user_path = f"/tmp/user_{uuid.uuid4()}.jpg"
    temp_product_path = f"/tmp/product_{uuid.uuid4()}.jpg"
    temp_result_path = f"/tmp/result_{uuid.uuid4()}.jpg"

    try:
        print(f"\n{'='*60}")
        print(f"[TRY-ON] NEW REQUEST")
        print(f"[TRY-ON] User ID: {user_id}")
        print(f"[TRY-ON] Product ID: {product_id}")
        print(f"[TRY-ON] Gradio Available: {GRADIO_AVAILABLE}")
        print(f"{'='*60}\n")

        # ===== STEP 1: Fetch Product =====
        print("[STEP 1] Fetching product from database...")
        product_response = supabase.table("products").select("*").eq(
            "id", product_id
        ).single().execute()
        
        if not product_response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        
        product_image_url = product_response.data['image_url']
        product_name = product_response.data['name']
        
        print(f"[STEP 1] ✓ Product: {product_name}")
        print(f"[STEP 1] ✓ Image URL: {product_image_url}")

        # ===== STEP 2: Save User Image =====
        print("\n[STEP 2] Saving user image...")
        with open(temp_user_path, "wb") as buffer:
            shutil.copyfileobj(user_image.file, buffer)
        
        file_size = os.path.getsize(temp_user_path)
        print(f"[STEP 2] ✓ Saved to: {temp_user_path}")
        print(f"[STEP 2] ✓ Size: {file_size / 1024:.2f} KB")

        # ===== STEP 3: Download Product Image =====
        print("\n[STEP 3] Downloading product image...")
        try:
            response = requests.get(product_image_url, timeout=15, stream=True)
            response.raise_for_status()
            
            with open(temp_product_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            product_size = os.path.getsize(temp_product_path)
            print(f"[STEP 3] ✓ Downloaded: {product_size / 1024:.2f} KB")
            
            # Validate it's a real image
            Image.open(temp_product_path).verify()
            print(f"[STEP 3] ✓ Image verified")
            
        except Exception as e:
            print(f"[STEP 3] ✗ Download failed: {str(e)}")
            raise HTTPException(
                status_code=400, 
                detail=f"Failed to download product image: {str(e)}"
            )

        # ===== STEP 4: Upload User Image to Supabase =====
        print("\n[STEP 4] Uploading user image to Supabase...")
        with open(temp_user_path, "rb") as f:
            user_filename = f"{user_id}/{uuid.uuid4()}.jpg"
            supabase.storage.from_("user-photos").upload(
                user_filename, 
                f.read(), 
                {"content-type": "image/jpeg", "upsert": "true"}
            )
        
        user_photo_url = supabase.storage.from_("user-photos").get_public_url(user_filename)
        print(f"[STEP 4] ✓ Uploaded: {user_photo_url}")

        # ===== STEP 5: Try AI Generation =====
        generated_url = None
        used_fallback = False

        if GRADIO_AVAILABLE:
            print("\n[STEP 5] Attempting AI generation...")
            
            for provider in VTON_PROVIDERS:
                try:
                    print(f"[STEP 5] → Trying provider: {provider}")
                    client = GradioClient(provider, timeout=120)
                    
                    print(f"[STEP 5] → Connected! Sending prediction...")
                    result = client.predict(
                        dict={
                            "background": handle_file(temp_user_path),
                            "layers": [],
                            "composite": None
                        },
                        garm_img=handle_file(temp_product_path),
                        garment_des="clothing item",
                        is_checked=True,
                        is_checked_crop=False,
                        denoise_steps=30,
                        seed=42,
                        api_name="/tryon"
                    )
                    
                    # Extract image path from result
                    if isinstance(result, (tuple, list)):
                        generated_image_path = result[0]
                    else:
                        generated_image_path = result
                    
                    print(f"[STEP 5] ✓ AI generated image at: {generated_image_path}")
                    
                    # Upload to Supabase
                    generated_filename = f"{user_id}/{uuid.uuid4()}.jpg"
                    with open(generated_image_path, "rb") as f:
                        supabase.storage.from_("generated-images").upload(
                            generated_filename, 
                            f.read(), 
                            {"content-type": "image/jpeg", "upsert": "true"}
                        )
                    
                    generated_url = supabase.storage.from_("generated-images").get_public_url(
                        generated_filename
                    )
                    print(f"[STEP 5] ✓ Uploaded result: {generated_url}")
                    break  # Success!
                    
                except Exception as e:
                    print(f"[STEP 5] ✗ Provider {provider} failed: {str(e)}")
                    continue  # Try next provider
        
        # ===== STEP 6: Fallback if AI Failed =====
        if not generated_url:
            print("\n[STEP 6] AI unavailable, using fallback overlay...")
            
            if simple_overlay_fallback(temp_user_path, temp_product_path, temp_result_path):
                print("[STEP 6] ✓ Fallback overlay created")
                
                # Upload fallback result
                generated_filename = f"{user_id}/fallback_{uuid.uuid4()}.jpg"
                with open(temp_result_path, "rb") as f:
                    supabase.storage.from_("generated-images").upload(
                        generated_filename, 
                        f.read(), 
                        {"content-type": "image/jpeg", "upsert": "true"}
                    )
                
                generated_url = supabase.storage.from_("generated-images").get_public_url(
                    generated_filename
                )
                used_fallback = True
                print(f"[STEP 6] ✓ Fallback uploaded: {generated_url}")
            else:
                print("[STEP 6] ✗ Fallback also failed, returning original")
                generated_url = user_photo_url

        # ===== STEP 7: Save to History =====
        print("\n[STEP 7] Saving to history...")
        supabase.table("tryon_history").insert({
            "user_id": user_id,
            "product_id": product_id,
            "original_image_url": user_photo_url,
            "generated_image_url": generated_url,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        print("[STEP 7] ✓ Saved to database")

        # ===== SUCCESS =====
        print(f"\n{'='*60}")
        print(f"[SUCCESS] Try-on complete!")
        print(f"[SUCCESS] Mode: {'AI' if not used_fallback else 'Fallback Overlay'}")
        print(f"{'='*60}\n")

        return {
            "success": True,
            "original_image": user_photo_url,
            "product_image": product_image_url,
            "generated_image": generated_url,
            "product_name": product_name,
            "used_fallback": used_fallback
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"\n{'='*60}")
        print(f"[ERROR] Critical failure: {str(e)}")
        print(f"{'='*60}\n")
        import traceback
        traceback.print_exc()
        
        # Return error response with whatever we have
        return {
            "success": False,
            "error": f"Try-on failed: {str(e)}",
            "original_image": user_photo_url if 'user_photo_url' in locals() else "",
            "generated_image": user_photo_url if 'user_photo_url' in locals() else "",
            "product_name": product_name if 'product_name' in locals() else "Unknown"
        }
        
    finally:
        # Cleanup temp files
        for path in [temp_user_path, temp_product_path, temp_result_path]:
            if os.path.exists(path):
                try:
                    os.remove(path)
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
