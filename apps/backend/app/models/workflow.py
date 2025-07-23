from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId


def generate_id():
    return str(ObjectId())


class Task(BaseModel):
    id: str = Field(default_factory=generate_id)
    title: str
    description: Optional[str] = None
    status: str = Field(default="todo")  # todo | in-progress | done
    dependencies: List[str] = Field(default_factory=list)


class Workflow(BaseModel):
    id: str = Field(default_factory=generate_id, alias="_id")
    title: str
    prompt: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str  # user_id (must be a valid user ID)
    tasks: List[Task]

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
