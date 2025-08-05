from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.task import TaskPriority, TaskLabel

class TaskCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    project_id: str
    board_id: str
    column_id: str
    assignee_id: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    labels: List[TaskLabel] = []
    
class TaskUpdatePositionRequest(BaseModel):
    new_position: float
    column_id: str
    
class TaskUpdateStatusRequest(BaseModel):
    task_id: str
    new_column_id: str
