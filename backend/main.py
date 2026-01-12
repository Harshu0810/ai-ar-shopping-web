# BACKEND: main.py 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

# Import ALL routes
from routes import (
    auth, 
    products, 
    cart, 
    orders, 
    reviews, 
    tryOn, 
    wishlist,
    ai_stylist
)

app = FastAPI(
    title="AI Shopping API",
    description="E-commerce API with AI Virtual Try-On & Style Consultant",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ============================================================================
# CORS CONFIGURATION - FIXED FOR PRODUCTION
# ============================================================================

# Get frontend URL from environment or use defaults
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Define allowed origins
allowed_origins = [
    "http://localhost:5173",              # Local development
    "http://localhost:3000",              # Alternative local
    "https://ai-ar-shopping-web.vercel.app",  # Your Vercel app (SPECIFIC)
]

# Add environment frontend URL if different
if FRONTEND_URL not in allowed_origins:
    allowed_origins.append(FRONTEND_URL)

# Add CORS middleware with proper configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,        # Specific origins (more secure)
    allow_credentials=True,               # Allow cookies/auth headers
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],  # All methods
    allow_headers=["*"],                  # All headers
    expose_headers=["*"],                 # Expose all headers to frontend
    max_age=3600,                         # Cache preflight for 1 hour
)

# ============================================================================
# INCLUDE ROUTERS
# ============================================================================

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(products.router, prefix="/products", tags=["Products"])
app.include_router(cart.router, prefix="/cart", tags=["Cart"])
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
app.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])
app.include_router(tryOn.router, prefix="/tryOn", tags=["Virtual Try-On"])
app.include_router(wishlist.router, prefix="/wishlist", tags=["Wishlist"])
app.include_router(ai_stylist.router, prefix="/ai-stylist", tags=["AI Stylist"])

# ============================================================================
# ROOT ENDPOINTS
# ============================================================================

@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "AI Shopping Platform API",
        "version": "1.0.0",
        "status": "online",
        "documentation": "/docs",
        "cors_enabled": True
    }

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "message": "All systems operational",
        "cors": {
            "allowed_origins": allowed_origins,
            "credentials": True
        },
        "features": {
            "authentication": "enabled",
            "products": "enabled",
            "cart": "enabled",
            "orders": "enabled",
            "reviews": "enabled",
            "virtual_tryon": "enabled",
            "wishlist": "enabled",
            "ai_stylist": "enabled"
        }
    }

# CORS preflight handler (for OPTIONS requests)
@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    """Handle CORS preflight requests"""
    return {"message": "OK"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
