# BACKEND: routes/cart.py - FIXED VERSION
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from middleware.auth_middleware import get_current_user
import os
from supabase import create_client, Client
from datetime import datetime

router = APIRouter()
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

class CartItem(BaseModel):
    product_id: str
    quantity: int

class CartItemUpdate(BaseModel):
    quantity: int

@router.get("/") 
async def get_cart(current_user: dict = Depends(get_current_user)):
    """Get user's cart with product details"""
    try:
        # FIX: Use proper join syntax for Supabase
        response = supabase.table("cart_items").select(
            "id, product_id, quantity, created_at, updated_at, products(id, name, price, discount_price, image_url, stock_quantity)"
        ).eq("user_id", current_user["id"]).execute()
        
        print(f"[CART] Fetched {len(response.data)} items for user {current_user['id']}")
        return response.data
    except Exception as e:
        print(f"[CART ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch cart: {str(e)}")

@router.post("/items")
async def add_to_cart(
    item: CartItem, 
    current_user: dict = Depends(get_current_user)
):
    """Add item to cart or update quantity if exists"""
    try:
        # Verify product exists
        product_check = supabase.table("products").select("id, stock_quantity").eq(
            "id", item.product_id
        ).execute()
        
        if not product_check.data:
            raise HTTPException(status_code=404, detail="Product not found")
        
        product = product_check.data[0]
        
        # Check stock
        if product["stock_quantity"] < item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Only {product['stock_quantity']} items available"
            )
        
        # Check if already in cart
        existing = supabase.table("cart_items").select("*").eq(
            "user_id", current_user["id"]
        ).eq("product_id", item.product_id).execute()
        
        if existing.data:
            # Update existing cart item
            new_quantity = existing.data[0]['quantity'] + item.quantity
            
            if product["stock_quantity"] < new_quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot add more. Only {product['stock_quantity']} available"
                )
            
            response = supabase.table("cart_items").update({
                "quantity": new_quantity,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", existing.data[0]['id']).execute()
            
            print(f"[CART] Updated item {existing.data[0]['id']} to quantity {new_quantity}")
            return {"message": "Cart updated", "data": response.data[0]}
        else:
            # Insert new cart item - FIX: Add all required fields
            insert_data = {
                "user_id": current_user["id"],
                "product_id": item.product_id,
                "quantity": item.quantity,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            response = supabase.table("cart_items").insert(insert_data).execute()
            
            print(f"[CART] Added new item: {item.product_id} with quantity {item.quantity}")
            return {"message": "Added to cart", "data": response.data[0]}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[CART ERROR] {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed: {str(e)}")

@router.put("/items/{item_id}")
async def update_cart_item(
    item_id: str, 
    item: CartItemUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update cart item quantity"""
    try:
        if item.quantity < 1:
            raise HTTPException(status_code=400, detail="Quantity must be at least 1")
        
        # Get cart item with product info
        cart_item = supabase.table("cart_items").select(
            "*, products(stock_quantity)"
        ).eq("id", item_id).eq("user_id", current_user["id"]).execute()
        
        if not cart_item.data:
            raise HTTPException(status_code=404, detail="Cart item not found")
        
        stock = cart_item.data[0]["products"]["stock_quantity"]
        if stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Only {stock} items available"
            )
        
        response = supabase.table("cart_items").update({
            "quantity": item.quantity,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", item_id).eq("user_id", current_user["id"]).execute()
        
        return {"message": "Cart updated", "data": response.data[0] if response.data else {}}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed: {str(e)}")

@router.delete("/items/{item_id}")
async def remove_from_cart(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove item from cart"""
    try:
        existing = supabase.table("cart_items").select("id").eq(
            "id", item_id
        ).eq("user_id", current_user["id"]).execute()
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Cart item not found")
        
        supabase.table("cart_items").delete().eq(
            "id", item_id
        ).eq("user_id", current_user["id"]).execute()
        
        return {"message": "Removed from cart", "item_id": item_id}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed: {str(e)}")

@router.delete("/")
async def clear_cart(current_user: dict = Depends(get_current_user)):
    """Clear entire cart"""
    try:
        supabase.table("cart_items").delete().eq(
            "user_id", current_user["id"]
        ).execute()
        return {"message": "Cart cleared"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed: {str(e)}")
