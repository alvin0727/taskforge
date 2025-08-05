from datetime import date
from typing import Optional
from pydantic import BaseModel
from app.db.base import BaseDocument, PyObjectId

class ProjectStats(BaseDocument):
    project_id: PyObjectId
    date: date
    total_tasks: int = 0
    completed_tasks: int = 0
    in_progress_tasks: int = 0
    overdue_tasks: int = 0
    active_members: int = 0
    completion_rate: float = 0.0
    average_completion_time: Optional[float] = None
