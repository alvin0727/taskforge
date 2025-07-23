from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

def generate_id():
    return str(ObjectId())

class User(BaseModel):
    id: Optional[str] = Field(default_factory=generate_id, alias="_id")
    email: str
    name: Optional[str] = None
    workflows: Optional[List[str]] = []
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
