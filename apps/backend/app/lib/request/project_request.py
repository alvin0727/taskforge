from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any


class CreateProjectRequest(BaseModel):
    organization_id: str
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#3B82F6"  # Default color
    start_date: Optional[str] = None  # ISO date format
    end_date: Optional[str] = None  # ISO date format


class AddMemberRequest(BaseModel):
    project_slug: str
    organization_id: str
    member_ids: List[str]  # Changed from member_id to member_ids (list)
    
class GetMemberRequest(BaseModel):
    project_slug: str
    organization_id: str