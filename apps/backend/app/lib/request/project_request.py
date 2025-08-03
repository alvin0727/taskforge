from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any


class CreateProjectRequest(BaseModel):
    organization_id: str
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#3B82F6"  # Default color
    start_date: Optional[str] = None  # ISO date format
    end_date: Optional[str] = None  # ISO date format
