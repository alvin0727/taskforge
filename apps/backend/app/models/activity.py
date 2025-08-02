from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.db.base import BaseDocument, PyObjectId
from app.db.enums import ActivityType


class Activity(BaseDocument):
    type: ActivityType
    user_id: PyObjectId
    project_id: Optional[PyObjectId] = None
    task_id: Optional[PyObjectId] = None
    target_user_id: Optional[PyObjectId] = None
    metadata: Dict[str, Any] = {}
    description: str


class ActivityCreate(BaseModel):
    type: ActivityType
    user_id: str
    project_id: Optional[str] = None
    task_id: Optional[str] = None
    target_user_id: Optional[str] = None
    metadata: Dict[str, Any] = {}
    description: str
