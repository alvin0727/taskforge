from datetime import datetime
from typing import Optional, List
from bson import ObjectId
from pydantic import BaseModel, Field
from app.db.base import BaseDocument, PyObjectId
from app.db.enums import TaskStatus, TaskPriority


class TaskAttachment(BaseModel):
    filename: str
    file_url: str
    file_size: int
    mime_type: str
    uploaded_by: PyObjectId
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


class TaskComment(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    content: str
    author_id: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    mentions: List[PyObjectId] = []


class TaskTimeLog(BaseModel):
    user_id: PyObjectId
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    description: Optional[str] = None


class Task(BaseDocument):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.NO_PRIORITY
    project_id: PyObjectId
    board_id: Optional[PyObjectId] = None
    column_id: Optional[str] = None
    creator_id: PyObjectId
    assignee_id: Optional[PyObjectId] = None
    reviewers: List[PyObjectId] = []
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    labels: List[str] = []
    attachments: List[TaskAttachment] = []
    comments: List[TaskComment] = []
    time_logs: List[TaskTimeLog] = []
    # subtasks: List[PyObjectId] = []
    # parent_task_id: Optional[PyObjectId] = None
    dependencies: List[PyObjectId] = []
    position: float = 0.0
    archived: bool = False


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.NO_PRIORITY
    project_id: str
    board_id: Optional[str] = None
    column_id: Optional[str] = None
    assignee_id: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    labels: List[str] = []


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assignee_id: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    labels: Optional[List[str]] = None
    column_id: Optional[str] = None
    position: Optional[float] = None
