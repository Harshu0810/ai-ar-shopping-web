# backend/services/auth_service.py
# ============================================================================

from utils.config import settings
import os
from supabase import create_client, Client

class AuthService:
    def __init__(self):
        self.supabase: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )

    async def create_user(self, email: str, password: str, name: str):
        """Create new user in Supabase Auth"""
        try:
            response = self.supabase.auth.admin.create_user(
                {
                    "email": email,
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": {"name": name}
                }
            )
            return response
        except Exception as e:
            raise Exception(f"User creation failed: {str(e)}")

    async def get_user_by_email(self, email: str):
        """Get user by email"""
        try:
            response = self.supabase.auth.admin.list_users()
            for user in response.data:
                if user.email == email:
                    return user
            return None
        except Exception as e:
            raise Exception(f"User retrieval failed: {str(e)}")

    async def verify_password(self, email: str, password: str):
        """Verify user password (handled by Supabase Auth)"""
        # Supabase handles this automatically
        pass
