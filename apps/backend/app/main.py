from app.db.database import get_db
from fastapi import FastAPI
from app.utils.logger import logger
from app.api import router as api_router

app = FastAPI()

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
    logger.info("Root endpoint accessed")
    return {"message": "Hello from FastAPI!"}

app.include_router(api_router)