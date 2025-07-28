from pydantic import BaseModel, Field
from typing import List
from datetime import datetime
from zoneinfo import ZoneInfo
from bson import ObjectId

class Workflow(BaseModel):
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    title: str
    prompt: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Jakarta")))
    user_id: str  # user_id

    model_config = {
        "validate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {
            ObjectId: str
        }
    }