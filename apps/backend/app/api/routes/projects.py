from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
from app.services.project_service import ProjectService
from app.api.dependencies import get_current_user
from app.db.enums import UserRole
from app.db.enums import InvitationStatus
import app.lib.request.project_request as project_request
from app.utils.permissions import verify_user_access_to_organization

from app.db.database import get_db
from app.utils.logger import logger


router = APIRouter(prefix="/projects", tags=["projects"])
db = get_db()
project_service = ProjectService()


@router.post("/create-project")
async def create_project(
    request: project_request.CreateProjectRequest,
    current_user=Depends(get_current_user),
):
    """Create a new project for an organization"""
    user_id = ObjectId(current_user["id"])
    organization_id = ObjectId(request.organization_id)
    projectData = {
        "name": request.name,
        "description": request.description,
        "color": request.color,
        "start_date": request.start_date,
        "end_date": request.end_date,
    }
    # Verify user access to the organization
    await verify_user_access_to_organization(
        current_user=user_id,
        org_id=organization_id,
        action="who_can_create_projects"
    )

    project = await project_service.create_project(
        user_id=user_id,
        organization_id=organization_id,
        project_data=projectData
    )

    return {
        "message": "Project created successfully",
        "project": project
    }


@router.get("/{org_id}/sidebar-projects")
async def get_sidebar_projects(
    org_id: str,
    current_user=Depends(get_current_user),
):
    """Get all projects for the current user in a specific organization"""
    user_id = ObjectId(current_user["id"])
    organization_id = ObjectId(org_id)

    # Verify user access to the organization
    await verify_user_access_to_organization(
        current_user=user_id,
        org_id=organization_id,
        action="view"
    )

    projects = await project_service.get_sidebar_projects(user_id, organization_id)
    total = len(projects)

    return {
        "projects": projects,
        "total": total,
    }
