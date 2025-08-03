from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any


class GetBoardRequest(BaseModel):
    project_id: str



