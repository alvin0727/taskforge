from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from app.db.enums import ActivityType, TaskPriority, TaskStatus, UserRole


class CreateTeamOrganizationRequest(BaseModel):
    name: str
    description: Optional[str] = None


class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.MEMBER
    message: Optional[str] = None

    
class GetOrganizationTasksRequest(BaseModel):
    project_id: Optional[str] = Field(None, description="Filter by specific project ID")
    limit: int = Field(20, ge=1, le=100, description="Number of tasks per page")
    offset: int = Field(0, ge=0, description="Number of tasks to skip")
    search: Optional[str] = Field(None, description="Search tasks by title ")
    status: Optional[TaskStatus] = Field(None, description="Filter by task status")
    priority: Optional[TaskPriority] = Field(None, description="Filter by task priority")
    assignee_id: Optional[str] = Field(None, description="Filter by assignee ID")
    
    
class GetOrganizationActivitiesRequest(BaseModel):
    limit: int = Field(20, ge=1, le=100, description="Number of activities per page")
    offset: int = Field(0, ge=0, description="Number of activities to skip")
    search: Optional[str] = Field(None, description="Search activities by description")
    project_id: Optional[str] = Field(None, description="Filter by specific project ID")
    user_id: Optional[str] = Field(None, description="Filter by specific user ID")
    date_from: Optional[datetime] = Field(None, description="Filter activities from this date")
    date_to: Optional[datetime] = Field(None, description="Filter activities to this date")
