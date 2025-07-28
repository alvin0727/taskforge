from pydantic import BaseModel

class AddWorkflow(BaseModel):
    user_id: str
    prompt: str
    title: str
