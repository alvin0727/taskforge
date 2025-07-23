from fastapi import APIRouter
from app.api.routes import workflows

router = APIRouter()

router.include_router(workflows.router, prefix="/api")