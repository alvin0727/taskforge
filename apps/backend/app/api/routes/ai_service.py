from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
import asyncio
from bson import ObjectId
from app.lib.request.ai_request import GenerateDescriptionRequest
from app.api.dependencies import get_current_user
from app.models.user import User
from app.services.openai_service import openai_service
from app.db.database import get_db
from app.utils.logger import logger

router = APIRouter(prefix="/ai", tags=["ai"])
db = get_db()


def create_error_response(message: str, details: str = None) -> Dict[str, Any]:
    """Create standardized error response"""
    response = {
        "success": False,
        "message": message,
        "error": True
    }
    if details:
        response["details"] = details
    return response


def create_success_response(data: Dict[str, Any], message: str = "Operation completed successfully") -> Dict[str, Any]:
    """Create standardized success response"""
    return {
        "success": True,
        "message": message,
        **data
    }


async def verify_user_project_access(user_id: ObjectId, project_id: ObjectId) -> bool:
    """Verify user has access to the project"""
    try:
        project = await db["projects"].find_one({
            "_id": project_id,
            "members": user_id,
            "archived": False
        })
        return project is not None
    except Exception as e:
        logger.error(f"Error verifying project access: {str(e)}")
        return False


async def get_project_context(project_id: str, user_id: ObjectId) -> Dict[str, Any]:
    """Get project context with proper error handling based on project service structure"""
    context = {}
    
    if not project_id:
        return context
        
    try:
        # Convert project_id to ObjectId
        project_obj_id = ObjectId(project_id)
        
        # Verify user has access to project
        has_access = await verify_user_project_access(user_id, project_obj_id)
        if not has_access:
            logger.warning(f"User {user_id} doesn't have access to project {project_id}")
            return context
        
        # Add timeout for database operations
        project = await asyncio.wait_for(
            db["projects"].find_one({
                "_id": project_obj_id,
                "archived": False
            }),
            timeout=5.0
        )
        
        if not project:
            logger.warning(f"Project {project_id} not found")
            return context
            
        context['project_name'] = project.get('name', '')
        
        # Get recent tasks with timeout (limit to 5 most recent)
        recent_tasks = await asyncio.wait_for(
            db["tasks"].find({
                "project_id": project_obj_id,
                "archived": False
            }).sort("updated_at", -1).limit(5).to_list(length=5),
            timeout=5.0
        )
        
        if recent_tasks:
            context['existing_tasks'] = [task.get('title', '') for task in recent_tasks if task.get('title')]
            logger.info(f"Found {len(recent_tasks)} recent tasks for project {project['name']}")
            
        return context
        
    except asyncio.TimeoutError:
        logger.error(f"Timeout getting project context for project {project_id}")
        return context
    except Exception as e:
        logger.error(f"Error getting project context for project {project_id}: {str(e)}")
        return context


@router.post("/generate-task-description", response_model=Dict[str, Any])
async def generate_task_description(
    request: GenerateDescriptionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate AI-powered task description using title and context.

    Returns a structured description in JSON block format compatible with the block editor.
    """
    try:
        user_id = ObjectId(current_user["id"])
        
        # Enhanced input validation
        if not request.title or not request.title.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    "Task title is required and cannot be empty",
                    "Please provide a meaningful task title"
                )
            )
            
        # Validate title length
        title = request.title.strip()
        if len(title) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    "Task title must be at least 3 characters long",
                    f"Current length: {len(title)}"
                )
            )
            
        if len(title) > 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    "Task title cannot exceed 200 characters",
                    f"Current length: {len(title)}"
                )
            )

        # Validate user requirements if provided
        user_requirements = None
        if request.user_requirements and request.user_requirements.strip():
            user_requirements = request.user_requirements.strip()
            if len(user_requirements) > 1000:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=create_error_response(
                        "User requirements cannot exceed 1000 characters",
                        f"Current length: {len(user_requirements)}"
                    )
                )

        # Validate priority if provided
        valid_priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'NO_PRIORITY']
        if request.priority and request.priority.strip():
            if request.priority.strip().upper() not in valid_priorities:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=create_error_response(
                        "Invalid priority value",
                        f"Must be one of: {', '.join(valid_priorities)}"
                    )
                )

        # Validate project_id if provided
        if request.project_id:
            try:
                ObjectId(request.project_id)
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=create_error_response(
                        "Invalid project ID format",
                        "Project ID must be a valid ObjectId"
                    )
                )

        # Build context from project and existing tasks
        context = {}
        
        # Add user context
        context['user_id'] = str(user_id)
        
        # Get project context with error handling
        if request.project_id:
            project_context = await get_project_context(request.project_id, user_id)
            context.update(project_context)

        # Add priority to context
        if request.priority and request.priority.strip():
            context['priority'] = request.priority.strip().upper()

        # Log request for monitoring
        logger.info(
            f"Generating task description - User: {user_id}, "
            f"Title: '{title[:50]}...', "
            f"Project: {request.project_id or 'None'}, "
            f"Has Requirements: {bool(user_requirements)}"
        )

        # Generate description using AI with timeout
        try:
            description = await asyncio.wait_for(
                openai_service.generate_task_description(
                    title=title,
                    context=context if context else None,
                    user_requirements=user_requirements
                ),
                timeout=30.0  # 30 second timeout
            )
        except asyncio.TimeoutError:
            logger.error(f"Timeout generating description for '{title}' by user {user_id}")
            raise HTTPException(
                status_code=status.HTTP_408_REQUEST_TIMEOUT,
                detail=create_error_response(
                    "Request timeout - AI service took too long to respond",
                    "Please try again with a shorter or simpler task description"
                )
            )
        except ValueError as e:
            # Handle validation errors from OpenAI service
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(str(e))
            )

        logger.info(f"Successfully generated task description for '{title}' by user {user_id}")

        return create_success_response({
            "description": description,
            "context_used": bool(context),
            "project_id": request.project_id,
            "has_requirements": bool(user_requirements)
        }, "Task description generated successfully")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error generating description for '{request.title if request.title else 'Unknown'}': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                "An unexpected error occurred while generating the task description",
                "Please try again or contact support if the problem persists"
            )
        )