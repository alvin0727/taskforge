from pydantic import BaseModel

class RegisterUser(BaseModel):
    email: str
    name: str
    password: str
    
class LoginUser(BaseModel):
    email: str
    password: str
