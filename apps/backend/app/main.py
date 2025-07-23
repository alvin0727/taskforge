
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import get_db
from app.utils.logger import logger
from app.api import router as api_router
import logging

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Lebih aman, hanya izinkan frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_check():
    try:
        db = get_db()
        await db.command("ping")
        logger.info("MongoDB connected successfully.")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")

@app.get("/")
def read_root():
    logging.info("Root endpoint accessed")
    return {"message": "Hello from FastAPI!"}

app.include_router(api_router)