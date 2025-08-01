from datetime import datetime
from pydantic import BaseModel, Field
from app.db.base import BaseDocument, PyObjectId

class UserFavorite(BaseDocument):
    user_id: PyObjectId
    item_type: str  # "project", "task", "board"
    item_id: PyObjectId
    favorited_at: datetime = Field(default_factory=datetime.utcnow)

class FavoriteCreate(BaseModel):
    item_type: str
    item_id: str