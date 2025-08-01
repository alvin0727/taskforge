from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
from app.db.base import BaseDocument, PyObjectId
from app.db.enums import UserRole, NotificationType
from datetime import datetime

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
    role: UserRole = UserRole.MEMBER
    organization_id: Optional[PyObjectId] = None
    profile: UserProfile = Field(default_factory=UserProfile)
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    is_active: bool = True
    is_verified: bool = False
    last_login: Optional[datetime] = None
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
    role: UserRole
    profile: UserProfile
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None