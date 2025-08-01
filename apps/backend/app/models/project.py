from typing import Optional, List
from datetime import date
from pydantic import BaseModel, Field
from app.db.base import BaseDocument, PyObjectId
from app.db.enums import ProjectStatus

class ProjectSettings(BaseModel):
    public: bool = False
    allow_comments: bool = True
    auto_assign: bool = False
    default_assignee: Optional[PyObjectId] = None

class Project(BaseDocument):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str
    description: Optional[str] = None
    color: str = "#3B82F6"
    status: ProjectStatus = ProjectStatus.ACTIVE
    organization_id: PyObjectId
    owner_id: PyObjectId
    members: List[PyObjectId] = []
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    settings: ProjectSettings = Field(default_factory=ProjectSettings)
    tags: List[str] = []
    archived: bool = False

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str
    description: Optional[str] = None
    color: str = "#3B82F6"
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    status: Optional[ProjectStatus] = None
    end_date: Optional[date] = None
    settings: Optional[ProjectSettings] = None