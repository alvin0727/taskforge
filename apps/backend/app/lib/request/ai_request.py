from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class GenerateDescriptionRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Task title")
    project_id: Optional[str] = Field(None, description="Project ID for context")
    user_requirements: Optional[str] = Field(None, max_length=1000, description="Additional user requirements")
    priority: Optional[str] = Field(None, description="Task priority")

class EnhanceDescriptionRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200, description="Task title")
    existing_description: str = Field(..., min_length=1, max_length=10000, description="Current task description to enhance")
    project_id: Optional[str] = Field(None, description="Project ID for context")
    enhancement_instructions: Optional[str] = Field(None, max_length=1000, description="Specific enhancement instructions")
    priority: Optional[str] = Field(None, description="Task priority")
