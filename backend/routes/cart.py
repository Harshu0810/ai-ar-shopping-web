from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from middleware.auth_middleware import get_current_user
import os
from supabase import create_client, Client

router = APIRouter()
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

class CartItem(BaseModel):
    product_id: str
    quantity: int

# FIX: Changed path from "/" to "" to handle /cart correctly without trailing slash
@router.get("") 
async def get_cart(current_user: dict = Depends(get_current_user)):
    """Get user's cart"""
    response = supabase.table("cart_items").select(
        "*, products(*)"
    ).eq("user_id", current_user["id"]).execute()
    return response.data

@router.post("/items")
async def add_to_cart(
    item: CartItem, 
    current_user: dict = Depends(get_current_user)
):
    # Check existence
    existing = supabase.table("cart_items").select("*").eq("user_id", current_user["id"]).eq("product_id", item.product_id).execute()
    
    if existing.data:
        new_quantity = existing.data[0]['quantity'] + item.quantity
        response = supabase.table("cart_items").update({"quantity": new_quantity}).eq("id", existing.data[0]['id']).execute()
    else:
        response = supabase.table("cart_items").insert({
            "user_id": current_user["id"],
            "product_id": item.product_id,
            "quantity": item.quantity
        }).execute()
    
    return response.data[0] if response.data else {}

@router.put("/items/{item_id}")
async def update_cart_item(
    item_id: str, 
    item: CartItem,
    current_user: dict = Depends(get_current_user)
):
    response = supabase.table("cart_items").update({
        "quantity": item.quantity
    }).eq("id", item_id).eq("user_id", current_user["id"]).execute()
    return response.data

@router.delete("/items/{item_id}")
async def remove_from_cart(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    supabase.table("cart_items").delete().eq("id", item_id).eq("user_id", current_user["id"]).execute()
    return {"message": "Item removed"}
