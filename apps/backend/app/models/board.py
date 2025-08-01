from typing import List, Optional
from pydantic import BaseModel, Field
from app.db.base import BaseDocument, PyObjectId

class BoardColumn(BaseModel):
    id: str
    name: str
    position: int
    color: Optional[str] = None
    task_limit: Optional[int] = None

class Board(BaseDocument):
    name: str = Field(..., min_length=1, max_length=100)
    project_id: PyObjectId
    columns: List[BoardColumn] = []
    is_default: bool = False

class BoardCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    project_id: str
    columns: List[BoardColumn] = []

class BoardUpdate(BaseModel):
    name: Optional[str] = None
    columns: Optional[List[BoardColumn]] = None