from fastapi import APIRouter
# from app.api.routes import task
from app.api.routes import user
from app.api.routes import organizations


router = APIRouter()

router.include_router(user.router, prefix="/api")
router.include_router(organizations.router, prefix="/api")
# router.include_router(task.router, prefix="/api")
