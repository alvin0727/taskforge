from fastapi import APIRouter
from app.api import workflows

router = APIRouter()

router.include_router(workflows.router, prefix="/api")