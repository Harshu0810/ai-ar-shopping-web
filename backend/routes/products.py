# BACKEND: routes/products.py
# ============================================================================

from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List
import os
from supabase import create_client, Client

router = APIRouter()
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

class Product(BaseModel):
    id: str
    name: str
    description: str
    price: float
    discount_price: float = None
    category: str
    image_url: str
    stock_quantity: int
    rating: float
    reviews_count: int

@router.get("/", response_model=List[Product])
async def get_products(
    limit: int = Query(12, le=100),
    offset: int = Query(0),
    category: str = Query(None)
):
    query = supabase.table("products").select("*")
    
    if category:
        query = query.eq("category", category)
    
    response = query.range(offset, offset + limit - 1).execute()
    return response.data

@router.get("/{product_id}", response_model=Product)
async def get_product(product_id: str):
    response = supabase.table("products").select("*").eq(
        "id", product_id
    ).single().execute()
    return response.data

@router.get("/search")
async def search_products(q: str = Query(..., min_length=1)):
    response = supabase.table("products").select("*").ilike(
        "name", f"%{q}%"
    ).execute()
    return response.data

@router.get("/category/{category_name}")
async def get_by_category(category_name: str):
    response = supabase.table("products").select("*").eq(
        "category", category_name
    ).execute()
    return response.data
