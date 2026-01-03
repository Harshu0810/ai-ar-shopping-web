
# BACKEND: routes/orders.py
# ============================================================================

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime
import uuid
import os
from supabase import create_client, Client

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
async def create_order(order: OrderCreate, user_id: str = None):
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
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
async def get_orders(user_id: str = None):
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    response = supabase.table("orders").select(
        "*, order_items(*, products(*))"
    ).eq("user_id", user_id).execute()
    
    return response.data

@router.get("/{order_id}")
async def get_order(order_id: str):
    response = supabase.table("orders").select(
        "*, order_items(*, products(*))"
    ).eq("id", order_id).single().execute()
    
    return response.data

@router.patch("/{order_id}")
async def update_order(order_id: str, status: str):
    response = supabase.table("orders").update({
        "order_status": status,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", order_id).execute()
    
    return response.data[0]
