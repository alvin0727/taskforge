from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from zoneinfo import ZoneInfo


class User(BaseModel):
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    email: str
    name: str
    password: str
    is_verified: bool = False
    workflows: Optional[List[str]] = []
    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Jakarta")))
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Jakarta")))

    model_config = {
        "validate_by_name": True,
        "arbitrary_types_allowed": True,
    }