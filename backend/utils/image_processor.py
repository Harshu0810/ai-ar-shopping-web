# backend/utils/image_processor.py
# ============================================================================

import os
from io import BytesIO
from PIL import Image
import base64
from datetime import datetime
import uuid

class ImageProcessor:
    MAX_SIZE = 5 * 1024 * 1024  # 5MB
    ALLOWED_FORMATS = {'JPEG', 'PNG', 'JPG'}

    @staticmethod
    def validate_image(file_data: bytes) -> bool:
        """Validate image file"""
        if len(file_data) > ImageProcessor.MAX_SIZE:
            return False
        try:
            img = Image.open(BytesIO(file_data))
            return img.format in ImageProcessor.ALLOWED_FORMATS
        except:
            return False

    @staticmethod
    def compress_image(file_data: bytes, quality: int = 85) -> bytes:
        """Compress image to reduce size"""
        try:
            img = Image.open(BytesIO(file_data))
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            
            output = BytesIO()
            img.save(output, format='JPEG', quality=quality, optimize=True)
            return output.getvalue()
        except Exception as e:
            raise Exception(f"Image compression failed: {str(e)}")

    @staticmethod
    def get_image_name(extension: str = 'jpg') -> str:
        """Generate unique image filename"""
        return f"{uuid.uuid4()}.{extension}"

    @staticmethod
    def convert_to_base64(file_data: bytes) -> str:
        """Convert image bytes to base64"""
        return base64.b64encode(file_data).decode('utf-8')

    @staticmethod
    def convert_from_base64(base64_str: str) -> bytes:
        """Convert base64 string to image bytes"""
        return base64.b64decode(base64_str)
