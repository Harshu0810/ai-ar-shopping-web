# backend/utils/config.py
# ============================================================================

import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    HUGGING_FACE_API_KEY = os.getenv("HUGGING_FACE_API_KEY")
    JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

settings = Settings()
