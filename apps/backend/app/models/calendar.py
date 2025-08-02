from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.db.base import BaseDocument, PyObjectId


class CalendarEvent(BaseDocument):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    all_day: bool = False
    event_type: str = "meeting"
    project_id: Optional[PyObjectId] = None
    task_id: Optional[PyObjectId] = None
    attendees: List[PyObjectId] = []
    location: Optional[str] = None
    meeting_url: Optional[str] = None
    creator_id: PyObjectId


class CalendarEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    all_day: bool = False
    event_type: str = "meeting"
    project_id: Optional[str] = None
    task_id: Optional[str] = None
    attendees: List[str] = []
    location: Optional[str] = None
    meeting_url: Optional[str] = None


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    all_day: Optional[bool] = None
    event_type: Optional[str] = None
    attendees: Optional[List[str]] = None
    location: Optional[str] = None
    meeting_url: Optional[str] = None
