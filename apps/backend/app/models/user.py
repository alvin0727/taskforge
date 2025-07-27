from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from zoneinfo import ZoneInfo

def generate_id():
    return str(ObjectId())

class User(BaseModel):
    id: Optional[str] = Field(default_factory=generate_id, alias="_id")
    email: str
    name: Optional[str] = None
    isVerified: bool = False
    workflows: Optional[List[str]] = []
    created_at: Optional[datetime] = Field(default_factory=datetime.now(ZoneInfo("Asia/Jakarta")))
    updated_at: Optional[datetime] = Field(default_factory=datetime.now(ZoneInfo("Asia/Jakarta")))

    class Config:
        validate_by_name = True
