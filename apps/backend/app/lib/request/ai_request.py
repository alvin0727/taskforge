from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class GenerateDescriptionRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Task title")
    project_id: Optional[str] = Field(None, description="Project ID for context")
    user_requirements: Optional[str] = Field(None, max_length=1000, description="Additional user requirements")
    priority: Optional[str] = Field(None, description="Task priority")

class EnhanceDescriptionRequest(BaseModel):
    current_description: str = Field(..., description="Current task description in JSON block format")
    title: str = Field(..., min_length=1, max_length=200, description="Task title")
    enhancement_request: str = Field(..., min_length=1, max_length=500, description="What to enhance or improve")

class SuggestImprovementsRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Task title")
    description: str = Field(..., description="Current task description")