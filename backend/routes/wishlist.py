# BACKEND: routes/wishlist.py 
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

class WishlistItem(BaseModel):
    product_id: str

@router.get("")
async def get_wishlist(current_user: dict = Depends(get_current_user)):
    """Get user's wishlist with product details"""
    try:
        response = supabase.table("wishlist").select(
            "*, products(*)"
        ).eq("user_id", current_user["id"]).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch wishlist: {str(e)}")

@router.post("")
async def add_to_wishlist(
    item: WishlistItem,
    current_user: dict = Depends(get_current_user)
):
    """Add product to wishlist"""
    try:
        product_check = supabase.table("products").select("id").eq(
            "id", item.product_id
        ).execute()
        
        if not product_check.data:
            raise HTTPException(status_code=404, detail="Product not found")
        
        existing = supabase.table("wishlist").select("*").eq(
            "user_id", current_user["id"]
        ).eq("product_id", item.product_id).execute()
        
        if existing.data:
            return {"message": "Already in wishlist", "data": existing.data[0]}
        
        response = supabase.table("wishlist").insert({
            "user_id": current_user["id"],
            "product_id": item.product_id
        }).execute()
        
        return {"message": "Added to wishlist", "data": response.data[0]}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed: {str(e)}")

@router.delete("/{product_id}")
async def remove_from_wishlist(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove product from wishlist"""
    try:
        existing = supabase.table("wishlist").select("*").eq(
            "user_id", current_user["id"]
        ).eq("product_id", product_id).execute()
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Not in wishlist")
        
        supabase.table("wishlist").delete().eq(
            "user_id", current_user["id"]
        ).eq("product_id", product_id).execute()
        
        return {"message": "Removed from wishlist", "product_id": product_id}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed: {str(e)}")
