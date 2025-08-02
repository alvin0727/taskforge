from typing import List, Any
from fastapi import HTTPException
from bson import ObjectId
from app.db.enums import UserRole

async def check_org_permission(user: dict, organization_id: ObjectId, allowed_roles: List[UserRole]) -> None:
    """
    Check if user has one of the allowed roles in the given organization.
    Raise HTTPException(403) if not permitted.
    """
    user_orgs = user.get("organizations", [])
    user_role = next(
        (uo["role"] for uo in user_orgs if uo["organization_id"] == organization_id),
        None
    )
    if user_role not in allowed_roles:
        raise HTTPException(status_code=403, detail={
            "message": "Insufficient permissions"
        })

def get_allowed_roles_for_action(org_settings: dict, action: str) -> List[UserRole]:
    """
    Return allowed roles for a given action (e.g. 'who_can_invite_members') based on org_settings.
    """
    perm = org_settings.get("permissions", {}).get(action, "admin_only")
    if perm == "admin_only":
        return [UserRole.ADMIN]
    elif perm == "admin_and_managers":
        return [UserRole.ADMIN, UserRole.MANAGER]
    elif perm == "all_members":
        return [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER]
    return [UserRole.ADMIN]
