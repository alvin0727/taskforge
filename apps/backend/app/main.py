
from fastapi import FastAPI
from app.db.database import get_db, ensure_indexes
from app.utils.logger import logger
from app.api import router as api_router
from app.api.middlewares.middleware import LoggingMiddleware, add_cors_middleware

app = FastAPI()

add_cors_middleware(app)
app.add_middleware(LoggingMiddleware)


@app.on_event("startup")
async def startup_db_check():
    try:
        db = get_db()
        await db.command("ping")
        await ensure_indexes()
        logger.info("MongoDB connected successfully.")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")


app.include_router(api_router)
