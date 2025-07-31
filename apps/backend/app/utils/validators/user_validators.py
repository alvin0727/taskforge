from pydantic import BaseModel

class register_user(BaseModel):
    email: str
    name: str
    password: str
    
class LoginUser(BaseModel):
    email: str
    password: str

class verify_otp(BaseModel):
    email: str
    otp: str
    