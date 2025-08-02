from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from fastapi import HTTPException
import re
from app.db.database import get_db
from app.models.user import User, UserOrganization
from app.models.organization import Organization
from app.models.organization_invitation import OrganizationInvitation
from app.db.enums import InvitationStatus, UserRole
from app.utils.logger import logger
from app.services.email_service import send_invitation_email
from app.config.org_settings import get_org_settings
from app.utils.token_manager import create_invitation_token

db = get_db()


class OrganizationService:
    @staticmethod
    def generate_organization_slug(name: str) -> str:
        """ Generate URL-friendly slug from organization name """
        slug = re.sub(r'[^a-zA-Z0-9\s-]', '', name.lower())
        slug = re.sub(r'\s+', '-', slug.strip())
        slug = re.sub(r'-+', '-', slug)
        return slug[:50]

    @staticmethod
    async def ensure_unique_slug(base_slug: str) -> str:
        """Ensure organization slug is unique"""
        slug = base_slug
        counter = 1

        while await db["organizations"].find_one({"slug": slug}):
            slug = f"{base_slug}-{counter}"
            counter += 1
        return slug

    @staticmethod
    async def create_personal_workspace(user_id: ObjectId, user_name: str) -> ObjectId:
        """ Create personal workspace for user """
        try:
            org_name = f"{user_name}'s Workspace"
            base_slug = OrganizationService.generate_organization_slug(
                org_name)
            unique_slug = await OrganizationService.ensure_unique_slug(base_slug)
            settings = get_org_settings("personal")

            organization = Organization(
                name=org_name,
                slug=unique_slug,
                description=f"Personal workspace for {user_name}",
                owner_id=user_id,
                members=[user_id],
                settings=settings,
                created_at=datetime.utcnow()
            )
            result = await db["organizations"].insert_one(organization.model_dump(by_alias=True))
            return result.inserted_id

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to create personal workspace: {str(e)}")

    @staticmethod
    async def create_team_organization(
        owner_id: ObjectId,
        name: str,
        description: Optional[str] = None,
    ) -> ObjectId:
        """Create team organization"""
        try:
            # Validate organization name
            if len(name.strip()) < 2:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "message": "Organization name must be at least 2 characters long."}
                )
            base_slug = OrganizationService.generate_organization_slug(name)
            unique_slug = await OrganizationService.ensure_unique_slug(base_slug)
            settings = get_org_settings("team")
            organization = Organization(
                name=name,
                slug=unique_slug,
                description=description or f"Team organization: {name}",
                owner_id=owner_id,
                members=[owner_id],
                settings=settings,
                created_at=datetime.utcnow()
            )
            result = await db["organizations"].insert_one(organization.model_dump(by_alias=True))
            return result.inserted_id
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to create team organization: {str(e)}")

    @staticmethod
    async def add_user_to_organization(
        user_id: ObjectId,
        organization_id: ObjectId,
        role: UserRole = UserRole.MEMBER,
        invited_by: Optional[ObjectId] = None,
    ) -> bool:
        try:
            # Check if user already in organization
            user = await db["users"]. find_one({"_id": user_id})
            if not user:
                raise HTTPException(status_code=404, detail={
                                    "message": "User not found"})

            # Check if already a member
            exiting_org = user.get("organizations", [])
            for org in exiting_org:
                if org["organization_id"] == organization_id:
                    raise HTTPException(status_code=400, detail={
                                        "message": "User already a member of this organization"})

            # Add user to organization list
            user_org = UserOrganization(
                organization_id=organization_id,
                role=role,
                status="active",
                joined_at=datetime.utcnow(),
                invited_by=invited_by
            )

            await db["users"].update_one(
                {"_id": user_id},
                {
                    "$push": {"organizations": user_org.model_dump(by_alias=True)},
                    "$set": {"active_organization_id": organization_id}
                }
            )

            return True
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to add user to organization: {str(e)}")

    @staticmethod
    async def invite_user_to_organization(
        organization_id: ObjectId,
        email: str,
        inviter_name: str,
        role: UserRole,
        invited_by: ObjectId,
        message: Optional[str] = None
    ) -> str:
        """ Send invitation to user to join organization """
        try:
            # Check if organization exists
            org = await db["organizations"].find_one({"_id": organization_id})
            if not org:
                raise HTTPException(status_code=404, detail={
                                    "message": "Organization not found"})

            # Check if user already exists and is a member
            existing_user = await db["users"].find_one({"email": email})
            if existing_user:
                for user_org in existing_user.get("organizations", []):
                    if user_org["organization_id"] == organization_id:
                        raise HTTPException(status_code=400, detail={
                                            "message": "User already a member of this organization"})

            # Generate unique invitation token
            token = create_invitation_token(email, str(organization_id), role)
            expires_at = datetime.utcnow() + timedelta(days=7)

            # Create invitation document
            invitation = OrganizationInvitation(
                organization_id=str(organization_id),
                email=email,
                role=role,
                invited_by=str(invited_by),
                token=token,
                expires_at=expires_at,
                status=InvitationStatus.PENDING,
                message=message,
                created_at=datetime.utcnow()
            )
            await db["organization_invitations"].insert_one(invitation.model_dump(by_alias=True))

            # Send invitation email
            await send_invitation_email(
                email=email,
                organization_name=org.get("name", "Organization"),
                inviter_name=inviter_name,
                role=role,
                token=token,
                message=message
            )

            return token
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to invite user: {str(e)}")

    @staticmethod
    async def accept_invitation(token: str, user_id: Optional[ObjectId] = None) -> Dict[str, Any]:
        """ Accept organization invitation """
        try:
            # Find invitation by token
            invitation = await db["organization_invitations"].find_one({
                "token": token,
                "status": InvitationStatus.PENDING,
                "expires_at": {"$gt": datetime.utcnow()}
            })

            if not invitation:
                raise HTTPException(status_code=404, detail={
                                    "message": "Invalid or expired invitation token"})

            organization_id = invitation["organization_id"]
            email = invitation["email"]
            role = invitation["role"]

            # If user_id not provided, find user by email
            if not user_id:
                user = await db["users"].find_one({"email": email})
                if not user:
                    raise HTTPException(status_code=404, detail={
                                        "message": "User not found"})
                user_id = user["_id"]

            # add user to organization
            await OrganizationService.add_user_to_organization(
                user_id=user_id,
                organization_id=ObjectId(organization_id),
                role=role,
                invited_by=invitation["invited_by"]
            )

            # Add user to organization's members list if not already present
            await db["organizations"].update_one(
                {"_id": ObjectId(organization_id)},
                {"$addToSet": {"members": user_id}}
            )

            # Mark invitation as accepted
            await db["organization_invitations"].update_one(
                {"_id": invitation["_id"]},
                {
                    "$set": {
                        "status": InvitationStatus.ACCEPTED,
                        "accepted_at": datetime.utcnow(),
                        "accepted_by": user_id
                    }
                }
            )

            # Get organization details
            organization = await db["organizations"].find_one({"_id": organization_id})

            return {
                "organization": organization,
                "user_id": str(user_id),
                "role": role,
                "message": "Successfully joined organization"
            }

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to accept invitation: {str(e)}")

    @staticmethod
    async def switch_active_organization(
        user_id: ObjectId,
        organization_id: ObjectId
    ) -> bool:
        """Swithch user's active organization"""
        try:
            # Verify user is member of organization
            user = await db["users"].find_one({"_id": user_id})
            if not user:
                raise HTTPException(status_code=404, detail={
                                    "message": "User not found"})

            user_orgs = user.get("organizations", [])
            is_member = any(
                org.get("organization_id") == organization_id and org.get(
                    "status") == "active"
                for org in user_orgs
            )

            if not is_member:
                raise HTTPException(status_code=403, detail={
                                    "message": "User not member of organization"})

            # Update active organization
            await db["users"].update_one(
                {"_id": user_id},
                {"$set": {"active_organization_id": organization_id}}
            )

            return True
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to switch active organization: {str(e)}")

    @staticmethod
    async def get_user_organizations(user_id: ObjectId) -> List[Dict[str, Any]]:
        """ Get all organizations user is a member of """
        try:
            user = await db["users"].find_one({"_id": user_id})
            if not user:
                raise HTTPException(status_code=404, detail={
                                    "message": "User not found"})
            user_orgs = user.get("organizations", [])
            organization_ids = [org["organization_id"]
                                for org in user_orgs if org.get("status") == "active"]

            # Get organization details
            organizations = await db["organizations"].find(
                {"_id": {"$in": organization_ids}}
            ).to_list(length=None)

            # Combine with user's role information
            result = []
            for org in organizations:
                # Find user's role in this organization
                user_org = next(
                    (uo for uo in user_orgs if uo["organization_id"]
                     == org["_id"]),
                    None
                )

                if user_org:
                    result.append({
                        "id": str(org["_id"]),
                        "name": org["name"],
                        "slug": org["slug"],
                        "description": org.get("description", ""),
                        "logo_url": org.get("logo_url", ""),
                        "type": org.get("settings", {}).get("type", "team"),
                        "role": user_org["role"],
                        "joined_at": user_org["joined_at"],
                        "is_active": org["_id"] == user.get("active_organization_id"),
                        "members_count": len(org.get("members", [])),
                        "is_owner": org["owner_id"] == user_id,
                    })

            return result
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to get user organizations: {str(e)}")
