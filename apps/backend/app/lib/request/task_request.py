from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime
from app.models.task import TaskPriority

class TaskCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.NO_PRIORITY
    project_id: str
    board_id: str
    column_id: str
    assignee_id: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    labels: List[str] = []
    
class TaskUpdatePositionRequest(BaseModel):
    new_position: float
    column_id: str
    
class TaskUpdateStatusRequest(BaseModel):
    task_id: str
    new_column_id: str

class TaskUpdateRequest(BaseModel):
    task_id: str
    updates: Dict[str, Any]