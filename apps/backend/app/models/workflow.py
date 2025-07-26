from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from bson import ObjectId
from app.utils.const_value import TaskStatus


def generate_id():
    return str(ObjectId())



class Task(BaseModel):
    id: str = Field(default_factory=generate_id)
    title: str
    description: Optional[str] = None
    status: TaskStatus = Field(default=TaskStatus.TODO)
    is_completed: bool = Field(default=False)
    dependencies: List[str] = Field(default_factory=list)
    order: int = Field(default=0)
    parent_id: Optional[str] = None  # None if root task, else id of parent task

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }



class Workflow(BaseModel):
    id: str = Field(default_factory=generate_id, alias="_id")
    title: str
    prompt: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str  # user_id
    tasks: List[Task] = Field(default_factory=list)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }


