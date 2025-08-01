from fastapi import APIRouter
from app.api.routes import task
from app.api.routes import user


router = APIRouter()

router.include_router(task.router, prefix="/api")
router.include_router(user.router, prefix="/api")