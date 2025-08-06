from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
from app.services.organization_service import OrganizationService
from app.api.dependencies import get_current_user
from app.db.enums import UserRole
from app.db.enums import InvitationStatus
import app.lib.request.organization_request as org_req
from app.utils.permissions import verify_user_access_to_organization

from app.db.database import get_db
from app.utils.logger import logger

router = APIRouter(prefix="/organizations", tags=["organizations"])
db = get_db()


@router.post("/create-team")
async def create_team_organization(
    request: org_req.CreateTeamOrganizationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create new team organization for existing user"""
    user_id = ObjectId(current_user["id"])

    organization_id = await OrganizationService.create_team_organization(
        owner_id=user_id,
        name=request.name,
        description=request.description
    )

    await OrganizationService.add_user_to_organization(
        user_id=user_id,
        organization_id=organization_id,
        role=UserRole.MANAGER
    )

    org = await db["organizations"].find_one({"_id": organization_id})

    return {
        "message": "Team organization created successfully",
        "organization": {
            "id": str(organization_id),
            "name": org["name"],
            "slug": org["slug"],
            "type": "team"
        }
    }


@router.get("/my-organizations")
async def get_my_organizations(current_user: dict = Depends(get_current_user)):
    """Get all organizations user belongs to"""
    user_id = ObjectId(current_user["id"])
    organizations = await OrganizationService.get_user_organizations(user_id)

    return {
        "organizations": organizations,
        "total": len(organizations)
    }


@router.post("/switch/{org_id}")
async def switch_organization(
    org_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Switch user's active organization"""
    user_id = ObjectId(current_user["id"])
    organization_id = ObjectId(org_id)

    await OrganizationService.switch_active_organization(user_id, organization_id)

    return {"message": "Organization switched successfully"}


@router.get("/{org_id}")
async def get_organization_details(
    org_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get organization details"""

    # Verify user has access to this organization
    user_id = ObjectId(current_user["id"])
    organization_id = ObjectId(org_id)

    user = await db["users"].find_one({"_id": user_id})
    user_orgs = user.get("organizations", [])

    has_access = any(
        org.get("organization_id") == organization_id and org.get(
            "status") == "active"
        for org in user_orgs
    )

    if not has_access:
        raise HTTPException(status_code=403, detail={
                            "message": "Access denied"})

    org = await db["organizations"].find_one({"_id": organization_id})
    if not org:
        raise HTTPException(status_code=404, detail={
                            "message": "Organization not found"})

    # Get user's role in this organization
    user_role = next(
        (uo["role"]
         for uo in user_orgs if uo["organization_id"] == organization_id),
        None
    )

    return {
        "id": str(org["_id"]),
        "name": org["name"],
        "slug": org["slug"],
        "description": org.get("description"),
        "logo_url": org.get("logo_url"),
        "type": org.get("settings", {}).get("type", "team"),
        "member_count": len(org.get("members", [])),
        "is_owner": org["owner_id"] == user_id,
        "user_role": user_role,
        "created_at": org["created_at"]
    }


@router.post("/{org_id}/invite")
async def invite_member(
    org_id: str,
    request: org_req.InviteMemberRequest,
    current_user: dict = Depends(get_current_user)
):
    """Invite member to organization"""
    # Check permissions
    user_id = ObjectId(current_user["id"])
    organization_id = ObjectId(org_id)

    user, org = await verify_user_access_to_organization(
        current_user=user_id,
        org_id=organization_id,
        action="who_can_invite_members"
    )

    invitation_token = await OrganizationService.invite_user_to_organization(
        organization_id=organization_id,
        inviter_name=user["name"],
        email=request.email,
        role=request.role,
        invited_by=user_id,
        message=request.message
    )

    return {
        "message": f"Invitation sent to {request.email}",
        "invitation_token": invitation_token
    }


@router.get("/invitations/{token}")
async def get_invitation_details(token: str):
    invitation = await db["organization_invitations"].find_one({
        "token": token,
        "expires_at": {"$gt": datetime.utcnow()},
        "status": InvitationStatus.PENDING
    })
    if not invitation:
        raise HTTPException(status_code=404, detail={
                            "message": "Invalid or expired invitation token"})

    # Get organization name from database
    org = await db["organizations"].find_one({"_id": ObjectId(invitation["organization_id"])})
    organization_name = org["name"] if org else ""

    return {
        "email": invitation["email"],
        "organization_name": organization_name,
        "role": invitation["role"],
        "message": invitation.get("message", "")
    }


@router.post("/accept-invitation/{token}")
async def accept_invitation(
    token: str,
    current_user: dict = Depends(get_current_user)
):
    """Accept organization invitation (for existing users)"""
    user_id = ObjectId(current_user["id"])

    result = await OrganizationService.accept_invitation(token, user_id)

    return {
        "message": result["message"]
    }


@router.get("/{org_slug}/members")
async def get_organization_members(
    org_slug: str,
    current_user: dict = Depends(get_current_user)
):
    """Get members of an organization by slug"""
    user_id = ObjectId(current_user["id"])

    # Verify user has access to this organization
    org = await db["organizations"].find_one({"slug": org_slug})
    if not org:
        raise HTTPException(status_code=404, detail={
                            "message": "Organization not found"})

    await verify_user_access_to_organization(
            current_user=user_id,
            org_id=ObjectId(org["_id"]),
            action="view"
        )

    members = await OrganizationService.get_organization_members_by_slug(org["slug"])

    return { "members": members }