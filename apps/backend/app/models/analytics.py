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


class UserStats(BaseDocument):
    user_id: PyObjectId
    date: date
    tasks_completed: int = 0
    tasks_created: int = 0
    hours_logged: float = 0.0
    projects_active: int = 0
    comments_made: int = 0


class DashboardStats(BaseModel):
    total_tasks: int
    completed_tasks: int
    overdue_tasks: int
    active_projects: int
    team_members: int
    completion_rate: float
