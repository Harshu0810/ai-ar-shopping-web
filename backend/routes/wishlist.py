from fastapi import APIRouter, Depends
from middleware.auth_middleware import get_current_user
from supabase import create_client, Client
import os

router = APIRouter()
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

@router.get("/")
async def get_wishlist(current_user: dict = Depends(get_current_user)):
    response = supabase.table("wishlist").select(
        "*, products(*)"
    ).eq("user_id", current_user["id"]).execute()
    return response.data

@router.post("/")
async def add_to_wishlist(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    response = supabase.table("wishlist").insert({
        "user_id": current_user["id"],
        "product_id": product_id
    }).execute()
    return response.data[0]

@router.delete("/{product_id}")
async def remove_from_wishlist(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    supabase.table("wishlist").delete().eq(
        "user_id", current_user["id"]
    ).eq("product_id", product_id).execute()
    return {"message": "Removed from wishlist"}
