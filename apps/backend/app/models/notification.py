from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.db.base import BaseDocument, PyObjectId
from app.db.enums import NotificationType

class Notification(BaseDocument):
    type: NotificationType
    recipient_id: PyObjectId
    sender_id: Optional[PyObjectId] = None
    title: str
    message: str
    data: Dict[str, Any] = {}
    read: bool = False
    read_at: Optional[datetime] = None

class NotificationCreate(BaseModel):
    type: NotificationType
    recipient_id: str
    sender_id: Optional[str] = None
    title: str
    message: str
    data: Dict[str, Any] = {}

class NotificationUpdate(BaseModel):
    read: bool