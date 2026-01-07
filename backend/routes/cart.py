from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from pydantic import BaseModel
from middleware.auth_middleware import get_current_user
import os
from supabase import create_client, Client

router = APIRouter()
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# ============================================================================
# SECURE CART ROUTES
# ============================================================================

class CartItem(BaseModel):
    product_id: str
    quantity: int

@router.get("/cart")
async def get_cart(current_user: dict = Depends(get_current_user)):
    """Get user's cart - now secure with JWT validation"""
    response = supabase.table("cart_items").select(
        "*, products(*)"
    ).eq("user_id", current_user["id"]).execute()
    
    return response.data

@router.post("/cart/items")
async def add_to_cart(
    item: CartItem, 
    current_user: dict = Depends(get_current_user)
):
    """Add item to cart - user ID from JWT token"""
    response = supabase.table("cart_items").upsert({
        "user_id": current_user["id"],
        "product_id": item.product_id,
        "quantity": item.quantity
    }).execute()
    
    return response.data[0]

@router.put("/cart/items/{item_id}")
async def update_cart_item(
    item_id: str, 
    item: CartItem,
    current_user: dict = Depends(get_current_user)
):
    """Update cart item - verify ownership"""
    # First check if item belongs to user
    existing = supabase.table("cart_items").select("*").eq(
        "id", item_id
    ).eq("user_id", current_user["id"]).single().execute()
    
    if not existing.data:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    response = supabase.table("cart_items").update({
        "quantity": item.quantity
    }).eq("id", item_id).execute()
    
    return response.data[0]

@router.delete("/cart/items/{item_id}")
async def remove_from_cart(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove item from cart - verify ownership"""
    supabase.table("cart_items").delete().eq(
        "id", item_id
    ).eq("user_id", current_user["id"]).execute()
    
    return {"message": "Item removed"}
