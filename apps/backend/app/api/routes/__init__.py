from fastapi import APIRouter
from app.api.routes import workflows
from app.api.routes import task


router = APIRouter()

router.include_router(workflows.router, prefix="/api")
router.include_router(task.router, prefix="/api")