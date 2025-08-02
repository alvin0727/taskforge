from typing import Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime
from app.db.base import BaseDocument, PyObjectId


class OTPMetadata(BaseModel):
    attempts: int = 0
    max_attempts: int = 3
    last_attempt: Optional[datetime] = None
    is_blocked: bool = False
    block_until: Optional[datetime] = None
    last_generated: Optional[datetime] = None


class VerificationToken(BaseDocument):
    user_id: PyObjectId = Field(..., description="User ID (ObjectId)")
    token: str
    type: Literal['email_verification', 'password_reset', 'otp']
    otp_metadata: Optional[OTPMetadata] = None
    expires_at: datetime
    is_used: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class VerificationTokenCreate(BaseModel):
    user_id: PyObjectId
    token: str
    type: Literal['email_verification', 'password_reset', 'otp']
    otp_metadata: Optional[OTPMetadata] = None
    expires_at: datetime


class VerificationTokenUpdate(BaseModel):
    otp_metadata: Optional[OTPMetadata] = None
    is_used: Optional[bool] = None
    expires_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class VerificationTokenResponse(BaseModel):
    id: str
    user_id: str
    type: str
    expires_at: datetime
    is_used: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
