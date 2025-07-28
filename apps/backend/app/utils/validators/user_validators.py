from pydantic import BaseModel

class RegisterUser(BaseModel):
    email: str
    name: str
    password: str
