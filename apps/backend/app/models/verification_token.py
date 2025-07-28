from zoneinfo import ZoneInfo
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from bson import ObjectId

class OTPMetadata(BaseModel):
    attempts: int = 0
    maxAttempts: int = 3
    lastAttempt: Optional[datetime] = None
    isBlocked: bool = False
    blockUntil: Optional[datetime] = None
    lastGenerated: Optional[datetime] = None

class VerificationToken(BaseModel):
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    user_id: str = Field(..., description="User ID (ObjectId as str)")
    token: str
    type: Literal['email_verification', 'password_reset', 'otp']
    otpMetadata: Optional[OTPMetadata] = None
    expiresAt: datetime
    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Jakarta")))
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Jakarta")))

    model_config = {
        "validate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}    
    }