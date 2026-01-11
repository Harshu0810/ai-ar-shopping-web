# BACKEND: main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

# Import ALL routes (including ai_stylist)
from routes import (
    auth, 
    products, 
    cart, 
    orders, 
    reviews, 
    tryOn, 
    wishlist,
    ai_stylist  # <-- ADDED
)

app = FastAPI(
    title="AI Shopping API",
    description="E-commerce API with AI Virtual Try-On & Style Consultant",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration - UPDATED with proper origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://*.vercel.app",
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include ALL routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(products.router, prefix="/products", tags=["Products"])
app.include_router(cart.router, prefix="/cart", tags=["Cart"])
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
app.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])
app.include_router(tryOn.router, prefix="/tryOn", tags=["Virtual Try-On"])
app.include_router(wishlist.router, prefix="/wishlist", tags=["Wishlist"])
app.include_router(ai_stylist.router, prefix="/ai-stylist", tags=["AI Stylist"])

@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "AI Shopping Platform API",
        "version": "1.0.0",
        "status": "online",
        "documentation": "/docs"
    }

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "message": "All systems operational",
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

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
