from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
from app.db.base import BaseDocument, PyObjectId
from app.db.enums import UserRole, NotificationType

class UserOrganization(BaseModel):
    """User's membership in an organization"""
    organization_id: PyObjectId
    role: UserRole
    status: str = "active"  # active, invited, suspended
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    invited_by: Optional[PyObjectId] = None

class UserProfile(BaseModel):
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    timezone: str = "UTC"
    language: str = "en"
    theme: str = "dark"

class UserPreferences(BaseModel):
    email_notifications: bool = True
    push_notifications: bool = True
    task_reminders: bool = True
    weekly_digest: bool = True
    notification_types: List[NotificationType] = []

class User(BaseDocument):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr = Field(..., unique=True)
    password_hash: str
    
    # Multi-organization support
    organizations: List[UserOrganization] = []
    active_organization_id: Optional[PyObjectId] = None  # Currently selected org
    
    profile: UserProfile = Field(default_factory=UserProfile)
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    is_active: bool = True
    is_verified: bool = False
    last_login: Optional[datetime] = None
    
    # Legacy fields (for backward compatibility)
    joined_projects: List[PyObjectId] = []
    starred_items: List[PyObjectId] = []
    
class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    name: Optional[str] = None
    profile: Optional[UserProfile] = None
    preferences: Optional[UserPreferences] = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    profile: UserProfile
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

class UserWithMessage(BaseModel):
    message: str
    user: UserResponse