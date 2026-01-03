# backend/services/database.py
# ============================================================================

from utils.config import settings
from supabase import create_client, Client

class DatabaseService:
    def __init__(self):
        self.supabase: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )

    # Products
    async def get_all_products(self, limit: int = 12, offset: int = 0):
        """Get all products with pagination"""
        response = self.supabase.table("products").select("*").range(offset, offset + limit - 1).execute()
        return response.data

    async def get_product_by_id(self, product_id: str):
        """Get product by ID"""
        response = self.supabase.table("products").select("*").eq("id", product_id).single().execute()
        return response.data

    async def search_products(self, query: str):
        """Search products by name"""
        response = self.supabase.table("products").select("*").ilike("name", f"%{query}%").execute()
        return response.data

    async def get_products_by_category(self, category: str):
        """Get products by category"""
        response = self.supabase.table("products").select("*").eq("category", category).execute()
        return response.data

    # Orders
    async def create_order(self, user_id: str, total_amount: float, payment_method: str, shipping_address: str):
        """Create new order"""
        response = self.supabase.table("orders").insert({
            "user_id": user_id,
            "total_amount": total_amount,
            "payment_method": payment_method,
            "shipping_address": shipping_address,
            "order_status": "pending"
        }).execute()
        return response.data[0]

    async def get_user_orders(self, user_id: str):
        """Get all orders for a user"""
        response = self.supabase.table("orders").select("*").eq("user_id", user_id).execute()
        return response.data

    async def get_order_by_id(self, order_id: str):
        """Get order by ID"""
        response = self.supabase.table("orders").select("*").eq("id", order_id).single().execute()
        return response.data

    # Cart
    async def get_user_cart(self, user_id: str):
        """Get user's cart items"""
        response = self.supabase.table("cart_items").select("*, products(*)").eq("user_id", user_id).execute()
        return response.data

    async def add_to_cart(self, user_id: str, product_id: str, quantity: int):
        """Add item to cart"""
        response = self.supabase.table("cart_items").upsert({
            "user_id": user_id,
            "product_id": product_id,
            "quantity": quantity
        }).execute()
        return response.data[0]

    async def remove_from_cart(self, item_id: str):
        """Remove item from cart"""
        self.supabase.table("cart_items").delete().eq("id", item_id).execute()

    # Reviews
    async def create_review(self, user_id: str, product_id: str, rating: int, comment: str):
        """Create product review"""
        response = self.supabase.table("reviews").insert({
            "user_id": user_id,
            "product_id": product_id,
            "rating": rating,
            "comment": comment
        }).execute()
        return response.data[0]

    async def get_product_reviews(self, product_id: str):
        """Get reviews for a product"""
        response = self.supabase.table("reviews").select("*").eq("product_id", product_id).execute()
        return response.data
