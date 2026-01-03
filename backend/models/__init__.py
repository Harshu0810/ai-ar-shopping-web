# backend/models/__init__.py
# ============================================================================

# Models package initialization

# ============================================================================
# backend/models/schemas.py
# ============================================================================

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Authentication Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]

class AuthResponse(BaseModel):
    user: UserResponse
    access_token: str

# Product Schemas
class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    discount_price: Optional[float]
    category: str
    image_url: str
    stock_quantity: int

class ProductResponse(BaseModel):
    id: str
    name: str
    description: str
    price: float
    discount_price: Optional[float]
    category: str
    image_url: str
    stock_quantity: int
    rating: float
    reviews_count: int

# Cart Schemas
class CartItemCreate(BaseModel):
    product_id: str
    quantity: int

class CartItemUpdate(BaseModel):
    quantity: int

class CartItemResponse(BaseModel):
    id: str
    user_id: str
    product_id: str
    quantity: int

# Order Schemas
class OrderCreate(BaseModel):
    items: List[dict]
    payment_method: str
    shipping_address: str

class OrderResponse(BaseModel):
    id: str
    user_id: str
    total_amount: float
    payment_method: str
    order_status: str
    created_at: datetime

# Review Schemas
class ReviewCreate(BaseModel):
    product_id: str
    rating: int
    comment: str

class ReviewResponse(BaseModel):
    id: str
    user_id: str
    product_id: str
    rating: int
    comment: str
    created_at: datetime

# Try-On Schemas
class TryOnRequest(BaseModel):
    user_image: str
    product_id: str

class TryOnResponse(BaseModel):
    original_image: str
    product_image: str
    generated_image: str
    product_name: str
