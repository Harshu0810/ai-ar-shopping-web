# BACKEND: routes/reviews.py
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

class ReviewCreate(BaseModel):
    product_id: str
    rating: int
    comment: str

class Review(BaseModel):
    id: str
    product_id: str
    rating: int
    comment: str
    created_at: str

@router.post("/")
async def create_review(review: ReviewCreate, user_id: str = None):
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    response = supabase.table("reviews").insert({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "product_id": review.product_id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": datetime.utcnow().isoformat()
    }).execute()
    
    return response.data[0]

@router.get("/product/{product_id}")
async def get_product_reviews(product_id: str) -> List[Review]:
    response = supabase.table("reviews").select("*").eq(
        "product_id", product_id
    ).execute()
    
    return response.data
