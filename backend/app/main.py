from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.v1.api import api_router

# Hardcoded settings to avoid configuration issues
PROJECT_NAME = "Factory Scheduler API"
VERSION = "1.0.0"
API_V1_STR = "/api/v1"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Factory Scheduler API starting up...")
    yield
    # Shutdown
    print("📦 Factory Scheduler API shutting down...")


def create_application() -> FastAPI:
    app = FastAPI(
        title=PROJECT_NAME,
        version=VERSION,
        openapi_url=f"{API_V1_STR}/openapi.json",
        lifespan=lifespan
    )

    # Set all CORS enabled origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins temporarily for debugging
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix=API_V1_STR)

    return app


app = create_application()


@app.get("/")
async def root():
    return {
        "message": "Factory Scheduler API",
        "version": VERSION,
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}