# backend/services/huggingface_service.py
# ============================================================================

import requests
import base64
from utils.config import settings
from utils.image_processor import ImageProcessor

class HuggingFaceService:
    def __init__(self):
        self.api_key = settings.HUGGING_FACE_API_KEY
        self.api_url = "https://api-inference.huggingface.co/models/ZeroGPU/stable-diffusion-v1-5"
        self.headers = {"Authorization": f"Bearer {self.api_key}"}

    async def generate_tryon_image(self, user_image_base64: str, product_name: str, product_image_url: str) -> str:
        """Generate virtual try-on image using Hugging Face API"""
        try:
            prompt = f"A person wearing {product_name}, professional clothing fitting room photo, high quality"
            
            payload = {
                "inputs": prompt,
            }

            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                # Response is image bytes
                image_data = response.content
                return base64.b64encode(image_data).decode('utf-8')
            else:
                raise Exception(f"API error: {response.status_code}")
        except Exception as e:
            raise Exception(f"Try-on generation failed: {str(e)}")

    async def estimate_wait_time(self) -> dict:
        """Check if model is loading"""
        try:
            response = requests.head(self.api_url, headers=self.headers)
            return {
                "status": "ready" if response.status_code == 200 else "loading",
                "message": "Model is ready" if response.status_code == 200 else "Model is loading, please wait"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
