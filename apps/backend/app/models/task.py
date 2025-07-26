from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.utils.const_value import TaskStatus

def generate_id():
    return str(ObjectId())

class Task(BaseModel):
    id: str = Field(default_factory=generate_id, alias="_id")
    workflow_id: str  # Foreign key ke Workflow
    title: str
    description: Optional[str] = None
    status: TaskStatus = Field(default=TaskStatus.TODO)
    is_completed: bool = Field(default=False)
    dependencies: List[str] = Field(default_factory=list)
    order: int = Field(default=0)
    parent_id: Optional[str] = None  # None if root task, else id of parent task
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }