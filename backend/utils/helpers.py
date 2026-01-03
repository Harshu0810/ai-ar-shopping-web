# backend/utils/helpers.py
# ============================================================================

import uuid
from datetime import datetime

def generate_id():
    """Generate unique ID"""
    return str(uuid.uuid4())

def get_timestamp():
    """Get current UTC timestamp"""
    return datetime.utcnow().isoformat()

def calculate_discount_percentage(original_price: float, discount_price: float) -> int:
    """Calculate discount percentage"""
    if original_price == 0:
        return 0
    return int(((original_price - discount_price) / original_price) * 100)

def paginate(offset: int = 0, limit: int = 10) -> tuple:
    """Return pagination offset and limit"""
    return offset, limit

def format_price(price: float) -> float:
    """Format price to 2 decimal places"""
    return round(price, 2)
