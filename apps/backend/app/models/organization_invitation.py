from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel, Field, EmailStr
from app.db.base import BaseDocument, PyObjectId
from app.db.enums import InvitationStatus, UserRole


class OrganizationInvitation(BaseDocument):
    """Invitation to join an organization"""
    organization_id: PyObjectId
    email: EmailStr
    role: UserRole = UserRole.MEMBER
    invited_by: PyObjectId
    token: str = Field(..., unique=True)
    expires_at: datetime
    status: InvitationStatus = InvitationStatus.PENDING
    message: Optional[str] = None
    accepted_at: Optional[datetime] = None
    accepted_by: Optional[PyObjectId] = None
