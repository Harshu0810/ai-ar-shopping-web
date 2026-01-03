# BACKEND: routes/cart.py
# ============================================================================

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
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

@router.get("/")
async def get_cart(user_id: str = None):
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    response = supabase.table("cart_items").select(
        "*, products(*)"
    ).eq("user_id", user_id).execute()
    
    return response.data

@router.post("/items")
async def add_to_cart(item: CartItem, user_id: str = None):
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    response = supabase.table("cart_items").upsert({
        "user_id": user_id,
        "product_id": item.product_id,
        "quantity": item.quantity
    }).execute()
    
    return response.data[0]

@router.put("/items/{item_id}")
async def update_cart_item(item_id: str, item: CartItem):
    response = supabase.table("cart_items").update({
        "quantity": item.quantity
    }).eq("id", item_id).execute()
    
    return response.data[0]

@router.delete("/items/{item_id}")
async def remove_from_cart(item_id: str):
    supabase.table("cart_items").delete().eq("id", item_id).execute()
    return {"message": "Item removed"}
