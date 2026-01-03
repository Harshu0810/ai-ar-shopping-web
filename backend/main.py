from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

# Import routes
from routes import auth, products, cart, orders, reviews, tryOn

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Server started")
    yield
    # Shutdown
    print("🛑 Server stopped")

app = FastAPI(
    title="AI Shopping API",
    description="E-commerce API with AI Virtual Try-On",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
