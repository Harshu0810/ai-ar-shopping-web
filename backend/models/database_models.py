# backend/models/database_models.py
# ============================================================================

from datetime import datetime
from typing import Optional

class User:
    """User model"""
    def __init__(self, id: str, email: str, name: str):
        self.id = id
        self.email = email
        self.name = name

class Product:
    """Product model"""
    def __init__(
        self,
        id: str,
        name: str,
        description: str,
        price: float,
        discount_price: Optional[float],
        category: str,
        image_url: str,
        stock_quantity: int,
        rating: float = 0,
        reviews_count: int = 0,
        created_at: Optional[datetime] = None
    ):
        self.id = id
        self.name = name
        self.description = description
        self.price = price
        self.discount_price = discount_price
        self.category = category
        self.image_url = image_url
        self.stock_quantity = stock_quantity
        self.rating = rating
        self.reviews_count = reviews_count
        self.created_at = created_at or datetime.utcnow()

class CartItem:
    """Cart item model"""
    def __init__(self, id: str, user_id: str, product_id: str, quantity: int):
        self.id = id
        self.user_id = user_id
        self.product_id = product_id
        self.quantity = quantity

class Order:
    """Order model"""
    def __init__(
        self,
        id: str,
        user_id: str,
        total_amount: float,
        payment_method: str,
        shipping_address: str,
        order_status: str = "pending",
        created_at: Optional[datetime] = None
    ):
        self.id = id
        self.user_id = user_id
        self.total_amount = total_amount
        self.payment_method = payment_method
        self.shipping_address = shipping_address
        self.order_status = order_status
        self.created_at = created_at or datetime.utcnow()

class Review:
    """Review model"""
    def __init__(
        self,
        id: str,
        user_id: str,
        product_id: str,
        rating: int,
        comment: str,
        created_at: Optional[datetime] = None
    ):
        self.id = id
        self.user_id = user_id
        self.product_id = product_id
        self.rating = rating
        self.comment = comment
        self.created_at = created_at or datetime.utcnow()

class TryOnHistory:
    """Virtual try-on history model"""
    def __init__(
        self,
        id: str,
        user_id: str,
        product_id: str,
        original_image_url: str,
        generated_image_url: str,
        created_at: Optional[datetime] = None
    ):
        self.id = id
        self.user_id = user_id
        self.product_id = product_id
        self.original_image_url = original_image_url
        self.generated_image_url = generated_image_url
        self.created_at = created_at or datetime.utcnow()
