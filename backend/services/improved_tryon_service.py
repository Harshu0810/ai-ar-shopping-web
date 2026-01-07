# backend/services/improved_tryon_service.py
# ============================================================================

import requests
import base64
from PIL import Image
from io import BytesIO
import os

class ImprovedTryOnService:
    """
    Enhanced Virtual Try-On using better AI models
    
    Options:
    1. Replicate API - VITON-HD (Best for clothing)
    2. Hugging Face - IDM-VTON or other specialized models
    3. Local processing with overlay techniques
    """
    
    def __init__(self):
        self.hf_api_key = os.getenv("HUGGING_FACE_API_KEY")
        self.replicate_api_key = os.getenv("REPLICATE_API_TOKEN")  # Optional
        
    async def generate_with_viton(self, person_image_url: str, garment_image_url: str) -> bytes:
        """
        Use VITON-HD model for realistic virtual try-on
        This is significantly better than generic Stable Diffusion
        """
        API_URL = "https://api-inference.huggingface.co/models/yisol/IDM-VTON"
        headers = {"Authorization": f"Bearer {self.hf_api_key}"}
        
        # Download images
        person_img = requests.get(person_image_url).content
        garment_img = requests.get(garment_image_url).content
        
        payload = {
            "inputs": {
                "person_image": base64.b64encode(person_img).decode(),
                "garment_image": base64.b64encode(garment_img).decode()
            }
        }
        
        try:
            response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
            if response.status_code == 200:
                return response.content
            else:
                # Fallback to simple overlay
                return await self.simple_overlay(person_img, garment_img)
        except Exception as e:
            print(f"VITON failed: {e}")
            return await self.simple_overlay(person_img, garment_img)
    
    async def simple_overlay(self, person_image: bytes, garment_image: bytes) -> bytes:
        """
        Fallback: Simple image overlay for demo purposes
        Better than nothing when AI models fail
        """
        try:
            from PIL import Image, ImageDraw, ImageFont
            
            person = Image.open(BytesIO(person_image))
            garment = Image.open(BytesIO(garment_image))
            
            # Resize garment to fit on person
            person = person.convert("RGBA")
            garment = garment.convert("RGBA")
            
            # Calculate position (center of image, slightly up)
            garment_width = int(person.width * 0.6)
            garment_height = int(garment.height * (garment_width / garment.width))
            garment = garment.resize((garment_width, garment_height))
            
            position = (
                (person.width - garment_width) // 2,
                int(person.height * 0.25)
            )
            
            # Create result
            result = person.copy()
            result.paste(garment, position, garment)
            
            # Add watermark
            draw = ImageDraw.Draw(result)
            draw.text((10, 10), "Virtual Try-On Preview", fill=(255, 255, 255, 180))
            
            # Convert to bytes
            output = BytesIO()
            result.convert("RGB").save(output, format="JPEG", quality=90)
            return output.getvalue()
            
        except Exception as e:
            print(f"Overlay failed: {e}")
            return person_image
    
    async def generate_with_replicate(self, person_image_url: str, garment_image_url: str) -> str:
        """
        Alternative: Use Replicate API (paid but very good quality)
        https://replicate.com/viktorfa/oot_diffusion
        """
        if not self.replicate_api_key:
            return None
            
        import replicate
        
        try:
            output = replicate.run(
                "viktorfa/oot_diffusion:9f0868c61af97a96b648554ba6b0e7c45ca6929d3d0826655bb411c23ecd5022",
                input={
                    "model_image": person_image_url,
                    "garment_image": garment_image_url
                }
            )
            return output
        except Exception as e:
            print(f"Replicate failed: {e}")
            return None
    
    async def validate_images(self, person_image: bytes, garment_image: bytes) -> tuple:
        """
        Validate and preprocess images before try-on
        """
        try:
            person = Image.open(BytesIO(person_image))
            garment = Image.open(BytesIO(garment_image))
            
            # Check dimensions
            if person.width < 256 or person.height < 256:
                raise ValueError("Person image too small (min 256x256)")
            
            if garment.width < 256 or garment.height < 256:
                raise ValueError("Garment image too small (min 256x256)")
            
            # Resize if too large (save API costs)
            max_size = 1024
            if person.width > max_size or person.height > max_size:
                person.thumbnail((max_size, max_size))
            
            if garment.width > max_size or garment.height > max_size:
                garment.thumbnail((max_size, max_size))
            
            # Convert to bytes
            person_buf = BytesIO()
            garment_buf = BytesIO()
            person.save(person_buf, format="JPEG", quality=90)
            garment.save(garment_buf, format="JPEG", quality=90)
            
            return person_buf.getvalue(), garment_buf.getvalue()
            
        except Exception as e:
            raise ValueError(f"Image validation failed: {str(e)}")
