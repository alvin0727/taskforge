from fastapi import APIRouter
from app.utils.logger import logger

router = APIRouter()

@router.get("/hello")
def hello():
    logger.info("Hello endpoint accessed")
    return {"message": "Hello from /hello route!"}
