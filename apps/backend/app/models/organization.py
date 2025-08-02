from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.db.base import BaseDocument, PyObjectId


class Organization(BaseDocument):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., unique=True)
    description: Optional[str] = None
    logo_url: Optional[str] = None
    owner_id: PyObjectId
    members: List[PyObjectId] = []
    settings: Dict[str, Any] = {}
    is_active: bool = True


class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str
    description: Optional[str] = None


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
