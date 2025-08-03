from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from app.db.enums import UserRole


class CreateTeamOrganizationRequest(BaseModel):
    name: str
    description: Optional[str] = None


class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.MEMBER
    message: Optional[str] = None


