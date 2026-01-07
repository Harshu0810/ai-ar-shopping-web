# BACKEND: main.py
# ============================================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

# Import routes
from routes import auth, products, cart, orders, reviews, tryOn, wishlist

app = FastAPI(
    title="AI Shopping API",
    description="E-commerce API with AI Virtual Try-On",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        os.getenv("FRONTEND_URL", "https://your-app.vercel.app")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(products.router, prefix="/products", tags=["Products"])
app.include_router(cart.router, prefix="/cart", tags=["Cart"])
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
app.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])
app.include_router(tryOn.router, prefix="/tryOn", tags=["Virtual Try-On"])
app.include_router(wishlist.router, prefix="/wishlist", tags=["Wishlist"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "API is running"}

@app.get("/")
async def root():
    return {
        "message": "AI Shopping API",
        "docs": "/docs",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
