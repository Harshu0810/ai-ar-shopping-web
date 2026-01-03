# BACKEND: routes/auth.py
# ============================================================================

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
import os
from supabase import create_client, Client
from datetime import datetime

router = APIRouter()
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    user_id: str
    email: str
    name: str
    access_token: str

@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    try:
        # Create user in Supabase Auth
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {"name": request.name}
            }
        })
        
        if not response.user:
            raise HTTPException(status_code=400, detail="Registration failed")
        
        # Create profile
        supabase.table("profiles").insert({
            "id": response.user.id,
            "name": request.name,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
        return AuthResponse(
            user_id=response.user.id,
            email=response.user.email,
            name=request.name,
            access_token=response.session.access_token if response.session else ""
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Get profile
        profile = supabase.table("profiles").select("*").eq(
            "id", response.user.id
        ).single().execute()
        
        return AuthResponse(
            user_id=response.user.id,
            email=response.user.email,
            name=profile.data.get("name", ""),
            access_token=response.session.access_token
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")
