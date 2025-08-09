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

@router.post("/add-project-members")
async def add_project_members(
    request: project_request.AddMemberRequest,
    current_user=Depends(get_current_user),
):
    """Add multiple members to a project"""
    user_id = ObjectId(current_user["id"])
    organization_id = ObjectId(request.organization_id)
    project_slug = request.project_slug
    member_ids = [ObjectId(member_id) for member_id in request.member_ids]

    # Verify user access and add members
    result = await project_service.add_project_members(
        user_id=user_id,
        organization_id=organization_id,
        project_slug=project_slug,
        member_ids=member_ids
    )

    return {
        "message": f"Successfully processed {len(member_ids)} member(s)",
        "data": result
    }

@router.get("/{organization_id}/member-projects/{project_slug}")
async def get_member_projects(
    organization_id: str,
    project_slug: str,
    current_user=Depends(get_current_user),
):
    """Get all member projects for a specific organization"""
    
    user_id = ObjectId(current_user["id"])
    org_id = ObjectId(organization_id)
    members = await project_service.get_project_members_by_slug(user_id, org_id, project_slug)
    total = len(members)

    return {
        "members": members,
        "total": total,
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


@router.post("/{org_id}/list-projects")
async def list_projects(
    org_id: str,
    query: project_request.ListProjectQueryRequest,
    current_user=Depends(get_current_user),
):
    """List all projects for a specific organization"""
    user_id = ObjectId(current_user["id"])
    organization_id = ObjectId(org_id)

    # Verify user access to the organization
    await verify_user_access_to_organization(
        current_user=user_id,
        org_id=organization_id,
        action="view"
    )

    projects = await project_service.list_projects(user_id, organization_id, query.status, query.archived, query.limit, query.offset)
    total = len(projects)

    return {
        "projects": projects,
        "total": total,
    }