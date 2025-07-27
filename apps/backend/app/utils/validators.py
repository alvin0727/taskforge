from app.utils.const_value import TaskStatus
from pydantic import BaseModel

class StatusUpdateRequest(BaseModel):
    new_status: TaskStatus

class ReorderUpdateRequest(BaseModel):
    from_order: int
    to_order: int