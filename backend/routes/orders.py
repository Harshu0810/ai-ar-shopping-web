# BACKEND: routes/orders.py
# ============================================================================

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from datetime import datetime
import uuid
import os
from supabase import create_client, Client
from middleware.auth_middleware import get_current_user # <--- IMPORT ADDED

router = APIRouter()
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

class OrderCreate(BaseModel):
    items: List[dict]
    payment_method: str
    shipping_address: str

@router.post("/")
async def create_order(
    order: OrderCreate, 
    current_user: dict = Depends(get_current_user) # <--- SECURE DEPENDENCY
):
    user_id = current_user["id"]
    
    try:
        # Calculate total
        total = sum(item["price"] * item["quantity"] for item in order.items)
        
        # Create order
        order_id = str(uuid.uuid4())
        order_data = supabase.table("orders").insert({
            "id": order_id,
            "user_id": user_id,
            "total_amount": total,
            "payment_method": order.payment_method,
            "shipping_address": order.shipping_address,
            "order_status": "pending",
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
        # Add order items
        for item in order.items:
            supabase.table("order_items").insert({
                "order_id": order_id,
                "product_id": item["product_id"],
                "quantity": item["quantity"],
                "price": item["price"]
            }).execute()
        
        # Clear cart
        supabase.table("cart_items").delete().eq("user_id", user_id).execute()
        
        return order_data.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/")
async def get_orders(current_user: dict = Depends(get_current_user)): # <--- FIXED HERE
    """Get orders for the logged-in user"""
    user_id = current_user["id"]
    
    response = supabase.table("orders").select(
        "*, order_items(*, products(*))"
    ).eq("user_id", user_id).order("created_at", desc=True).execute()
    
    return response.data

@router.get("/{order_id}")
async def get_order(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get single order details"""
    # Verify the order belongs to this user
    response = supabase.table("orders").select(
        "*, order_items(*, products(*))"
    ).eq("id", order_id).eq("user_id", current_user["id"]).single().execute()
    
    if not response.data:
         raise HTTPException(status_code=404, detail="Order not found")

    return response.data

@router.patch("/{order_id}")
async def update_order(
    order_id: str, 
    status: str,
    current_user: dict = Depends(get_current_user)
):
    # Only allow updates if authorized (add admin check here if needed)
    response = supabase.table("orders").update({
        "order_status": status
    }).eq("id", order_id).eq("user_id", current_user["id"]).execute()
    
    return response.data
