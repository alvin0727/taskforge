from fastapi import APIRouter
from app.api.routes import user
from app.api.routes import organizations
from app.api.routes import projects
from app.api.routes import boards
from app.api.routes import task
from app.api.routes import ai_service
from app.api.routes import dashboard

router = APIRouter()

router.include_router(user.router, prefix="/api")
router.include_router(organizations.router, prefix="/api")
router.include_router(projects.router, prefix="/api")
router.include_router(boards.router, prefix="/api")
router.include_router(task.router, prefix="/api")
router.include_router(ai_service.router, prefix="/api")
router.include_router(dashboard.router, prefix="/api")
