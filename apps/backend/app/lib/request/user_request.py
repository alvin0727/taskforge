from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

class PersonalSignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class TeamSignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    organization_name: str
    organization_description: Optional[str] = None

class InvitationSignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    invitation_token: str