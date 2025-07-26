from pydantic import BaseModel, Field
from typing import List
from datetime import datetime
from bson import ObjectId

def generate_id():
    return str(ObjectId())

class Workflow(BaseModel):
    id: str = Field(default_factory=generate_id, alias="_id")
    title: str
    prompt: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: str  # user_id

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }