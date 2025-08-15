from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from app.services.dashboard_service import DashboardService
from app.api.dependencies import get_current_user
from app.utils.permissions import verify_user_access_to_organization
from app.utils.logger import logger

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary/{org_id}")
async def get_dashboard_summary(
    org_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get complete dashboard summary data
    Returns stats, recent tasks, active projects, upcoming deadlines, and recent activity
    """
    try:
        user_id = ObjectId(current_user["id"])
        organization_id = ObjectId(org_id)
        
        # Verify user has access to this organization
        await verify_user_access_to_organization(
            current_user=user_id,
            org_id=organization_id,
            action="view"
        )
        
        # Get dashboard data
        dashboard_data = await DashboardService.get_dashboard_summary(organization_id, user_id)
        
        return {
            "success": True,
            "data": dashboard_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dashboard summary endpoint failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard data")


@router.get("/stats/{org_id}")
async def get_dashboard_stats(
    org_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get dashboard statistics only
    Useful for refreshing stats without loading all data
    """
    try:
        user_id = ObjectId(current_user["id"])
        organization_id = ObjectId(org_id)
        
        # Verify user has access to this organization
        await verify_user_access_to_organization(
            current_user=user_id,
            org_id=organization_id,
            action="view"
        )
        
        # Get only stats
        stats = await DashboardService._get_dashboard_stats(organization_id)
        team_stats = await DashboardService._get_team_stats(organization_id)
        
        # Merge stats
        stats.update(team_stats)
        
        return {
            "success": True,
            "stats": stats
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dashboard stats endpoint failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard stats")


@router.get("/recent-tasks/{org_id}")
async def get_recent_tasks(
    org_id: str,
    limit: int = 5,
    current_user: dict = Depends(get_current_user)
):
    """
    Get recent tasks for the organization
    """
    try:
        user_id = ObjectId(current_user["id"])
        organization_id = ObjectId(org_id)
        
        # Verify user has access to this organization
        await verify_user_access_to_organization(
            current_user=user_id,
            org_id=organization_id,
            action="view"
        )
        
        # Get recent tasks
        recent_tasks = await DashboardService._get_recent_tasks(organization_id, limit)
        
        return {
            "success": True,
            "tasks": recent_tasks,
            "total": len(recent_tasks)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Recent tasks endpoint failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get recent tasks")


@router.get("/active-projects/{org_id}")
async def get_active_projects(
    org_id: str,
    limit: int = 4,
    current_user: dict = Depends(get_current_user)
):
    """
    Get active projects for the organization
    """
    try:
        user_id = ObjectId(current_user["id"])
        organization_id = ObjectId(org_id)
        
        # Verify user has access to this organization
        await verify_user_access_to_organization(
            current_user=user_id,
            org_id=organization_id,
            action="view"
        )
        
        # Get active projects
        active_projects = await DashboardService._get_active_projects(organization_id, limit)
        
        return {
            "success": True,
            "projects": active_projects,
            "total": len(active_projects)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Active projects endpoint failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get active projects")


@router.get("/upcoming-deadlines/{org_id}")
async def get_upcoming_deadlines(
    org_id: str,
    days: int = 7,
    current_user: dict = Depends(get_current_user)
):
    """
    Get upcoming deadlines for the organization
    """
    try:
        user_id = ObjectId(current_user["id"])
        organization_id = ObjectId(org_id)
        
        # Verify user has access to this organization
        await verify_user_access_to_organization(
            current_user=user_id,
            org_id=organization_id,
            action="view"
        )
        
        # Get upcoming deadlines
        upcoming_deadlines = await DashboardService._get_upcoming_deadlines(organization_id, days)
        
        return {
            "success": True,
            "deadlines": upcoming_deadlines,
            "total": len(upcoming_deadlines)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upcoming deadlines endpoint failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get upcoming deadlines")


@router.get("/recent-activity/{org_id}")
async def get_recent_activity(
    org_id: str,
    limit: int = 5,
    current_user: dict = Depends(get_current_user)
):
    """
    Get recent activity for the organization
    """
    try:
        user_id = ObjectId(current_user["id"])
        organization_id = ObjectId(org_id)
        
        # Verify user has access to this organization
        await verify_user_access_to_organization(
            current_user=user_id,
            org_id=organization_id,
            action="view"
        )
        
        # Get recent activity
        recent_activity = await DashboardService._get_recent_activity(organization_id, limit)
        
        return {
            "success": True,
            "activities": recent_activity,
            "total": len(recent_activity)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Recent activity endpoint failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get recent activity")
