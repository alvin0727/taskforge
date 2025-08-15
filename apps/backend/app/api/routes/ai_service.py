from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
import asyncio
from bson import ObjectId
from app.lib.request.ai_request import GenerateDescriptionRequest, EnhanceDescriptionRequest
from app.api.dependencies import get_current_user
from app.models.user import User
from app.services.openai_service import openai_service
from app.services.ai_rate_limit_service import ai_rate_limit_service
from app.db.database import get_db
from app.utils.logger import logger
from app.utils.permissions import verify_user_access_to_project

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


async def get_project_context(project_id: str, user_id: ObjectId) -> Dict[str, Any]:
    """Get project context with proper error handling based on project service structure"""
    context = {}

    if not project_id:
        return context

    try:
        # Convert project_id to ObjectId
        project_obj_id = ObjectId(project_id)

        # Verify user has access to project
        has_access = await verify_user_access_to_project(user_id, project_obj_id)
        if not has_access:
            logger.warning(
                f"User {user_id} doesn't have access to project {project_id}")
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
            context['existing_tasks'] = [
                task.get('title', '') for task in recent_tasks if task.get('title')]
            logger.info(
                f"Found {len(recent_tasks)} recent tasks for project {project['name']}")

        return context

    except asyncio.TimeoutError:
        logger.error(
            f"Timeout getting project context for project {project_id}")
        return context
    except Exception as e:
        logger.error(
            f"Error getting project context for project {project_id}: {str(e)}")
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

        # Check rate limit FIRST
        rate_limit_check = await ai_rate_limit_service.check_rate_limit(user_id, "generate_description")

        if not rate_limit_check["allowed"]:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=create_error_response(
                    rate_limit_check["message"],
                    f"Daily limit: {rate_limit_check['limit']} requests. Resets at: {rate_limit_check['reset_time'].strftime('%Y-%m-%d %H:%M:%S')} UTC"
                )
            )

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

        # Log request for monitoring (include rate limit info)
        logger.info(
            f"Generating task description - User: {user_id}, "
            f"Title: '{title[:50]}...', "
            f"Project: {request.project_id or 'None'}, "
            f"Has Requirements: {bool(user_requirements)}, "
            f"Remaining: {rate_limit_check['remaining']}"
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
            logger.error(
                f"Timeout generating description for '{title}' by user {user_id}")
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

        # Increment usage count AFTER successful generation
        usage_result = await ai_rate_limit_service.increment_usage(user_id, "generate_description")

        logger.info(
            f"Successfully generated task description for '{title}' by user {user_id}. {usage_result['message']}")

        return create_success_response({
            "description": description,
            "context_used": bool(context),
            "project_id": request.project_id,
            "has_requirements": bool(user_requirements),
            "rate_limit": {
                "remaining": usage_result["remaining"],
                "limit": rate_limit_check["limit"],
                "reset_time": rate_limit_check["reset_time"]
            }
        }, "Task description generated successfully")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error generating description for '{request.title if request.title else 'Unknown'}': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                "An unexpected error occurred while generating the task description",
                "Please try again or contact support if the problem persists"
            )
        )


@router.post("/enhance-task-description", response_model=Dict[str, Any])
async def enhance_task_description(
    request: EnhanceDescriptionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Enhance existing task description using AI.

    Takes an existing description and improves it by adding more details,
    better acceptance criteria, code examples, and best practices.
    """
    try:
        user_id = ObjectId(current_user["id"])

        # Check rate limit FIRST
        rate_limit_check = await ai_rate_limit_service.check_rate_limit(user_id, "enhance_description")

        if not rate_limit_check["allowed"]:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=create_error_response(
                    rate_limit_check["message"],
                    f"Daily limit: {rate_limit_check['limit']} requests. Resets at: {rate_limit_check['reset_time'].strftime('%Y-%m-%d %H:%M:%S')} UTC"
                )
            )

        # Enhanced input validation
        if not request.title or not request.title.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    "Task title is required and cannot be empty",
                    "Please provide a meaningful task title"
                )
            )

        if not request.existing_description or not request.existing_description.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    "Existing description is required for enhancement",
                    "Please provide the current task description to enhance"
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

        # Validate existing description length
        existing_description = request.existing_description.strip()
        if len(existing_description) > 10000:  # Larger limit for existing content
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    "Existing description is too long to enhance",
                    f"Current length: {len(existing_description)}. Maximum: 10000 characters"
                )
            )

        # Validate enhancement instructions if provided
        enhancement_instructions = None
        if request.enhancement_instructions and request.enhancement_instructions.strip():
            enhancement_instructions = request.enhancement_instructions.strip()
            if len(enhancement_instructions) > 1000:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=create_error_response(
                        "Enhancement instructions cannot exceed 1000 characters",
                        f"Current length: {len(enhancement_instructions)}"
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
            f"Enhancing task description - User: {user_id}, "
            f"Title: '{title[:50]}...', "
            f"Project: {request.project_id or 'None'}, "
            f"Description Length: {len(existing_description)}, "
            f"Has Instructions: {bool(enhancement_instructions)}, "
            f"Remaining: {rate_limit_check['remaining']}"
        )

        # Enhance description using AI with timeout
        try:
            enhanced_description = await asyncio.wait_for(
                openai_service.enhance_task_description(
                    title=title,
                    existing_description=existing_description,
                    context=context if context else None,
                    enhancement_instructions=enhancement_instructions
                ),
                timeout=45.0  # Longer timeout for enhancement (45 seconds)
            )
        except asyncio.TimeoutError:
            logger.error(
                f"Timeout enhancing description for '{title}' by user {user_id}")
            raise HTTPException(
                status_code=status.HTTP_408_REQUEST_TIMEOUT,
                detail=create_error_response(
                    "Request timeout - AI service took too long to enhance the description",
                    "Please try again with a shorter description or simpler enhancement instructions"
                )
            )
        except ValueError as e:
            # Handle validation errors from OpenAI service
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(str(e))
            )

        # Increment usage count AFTER successful enhancement
        usage_result = await ai_rate_limit_service.increment_usage(user_id, "enhance_description")

        # Check if enhancement actually improved the content
        enhanced_success = enhanced_description != existing_description and len(
            enhanced_description) > len(existing_description) * 0.8

        logger.info(
            f"Successfully enhanced task description for '{title}' by user {user_id}. Enhanced: {enhanced_success}. {usage_result['message']}")

        return create_success_response({
            "description": enhanced_description,
            "original_description": existing_description,
            "context_used": bool(context),
            "project_id": request.project_id,
            "has_instructions": bool(enhancement_instructions),
            "enhanced": enhanced_success,
            "rate_limit": {
                "remaining": usage_result["remaining"],
                "limit": rate_limit_check["limit"],
                "reset_time": rate_limit_check["reset_time"]
            }
        }, "Task description enhanced successfully" if enhanced_success else "Task description processed (minimal changes)")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error enhancing description for '{request.title if request.title else 'Unknown'}': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                "An unexpected error occurred while enhancing the task description",
                "Please try again or contact support if the problem persists"
            )
        )


@router.get("/usage", response_model=Dict[str, Any])
async def get_ai_usage(
    current_user: User = Depends(get_current_user)
):
    """
    Get current AI usage for the authenticated user.
    """
    try:
        user_id = ObjectId(current_user["id"])

        usage_data = await ai_rate_limit_service.get_user_usage(user_id)

        return create_success_response({
            "usage": usage_data["usage"],
            "limits": usage_data["limits"],
            "reset_time": usage_data["reset_time"]
        }, "AI usage retrieved successfully")

    except Exception as e:
        logger.error(
            f"Error getting AI usage for user {current_user['id']}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                "Failed to retrieve AI usage information",
                "Please try again or contact support if the problem persists"
            )
        )
