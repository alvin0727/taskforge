from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from typing import Optional
from app.utils.logger import logger
from app.services.task_service import TaskService
from app.models.task import TaskCreate
from app.lib.request.task_request import TaskCreateRequest, TaskUpdatePositionRequest, TaskUpdateRequest, TaskUpdateStatusRequest
from app.db.enums import UserRole
from app.utils.permissions import verify_user_access_to_project
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("/create-task")
async def create_task(
    task_data: TaskCreateRequest,
    current_user: str = Depends(get_current_user)
):
    """
    Create a new task.
    All project members can create tasks.
    """
    try:
        user_id = ObjectId(current_user["id"])
        result = await TaskService.create_task(user_id, task_data)
        return {
            "message": "Task created successfully",
            "task": result
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating task: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.patch("/{task_id}/position")
async def update_task_position(
    task_id: str,
    task: TaskUpdatePositionRequest,
    current_user: str = Depends(get_current_user)
):
    """
    Update task position within the same status/column.
    All project members can update task positions.
    """
    try:
        user_id = ObjectId(current_user["id"])
        task_object_id = ObjectId(task_id)

        result = await TaskService.update_task_position(
            user_id,
            task_object_id,
            task.new_position,
            task.column_id
        )
        return {
            "message": "Task position updated successfully",
            "task": result
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating task position: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.patch("/update-status")
async def change_task_status(
    task: TaskUpdateStatusRequest,
    current_user: str = Depends(get_current_user)
):
    """
    Change task status by moving to different column.
    All project members can change task status.
    """
    try:
        user_id = ObjectId(current_user["id"])
        task_object_id = ObjectId(task.task_id)

        result = await TaskService.change_task_status(
            user_id, 
            task_object_id, 
            task.new_column_id, 
        )
        return {
            "message": "Task status changed successfully",
            "task": result
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing task status: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.put("/update-task-partial")
async def update_task_partial(
    task_data: TaskUpdateRequest,
    current_user: str = Depends(get_current_user)
):
    """
    Update task partially.
    All project members can update tasks.
    """
    try:
        user_id = ObjectId(current_user["id"])
        task_object_id = ObjectId(task_data.task_id)

        result = await TaskService.update_task_partial(
            user_id, 
            task_object_id, 
            task_data.updates
        )
        return {
            "message": "Task updated successfully",
            "task": result
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating task: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Delete a task.
    Only project members can delete tasks.
    """
    try:
        user_id = ObjectId(current_user["id"])
        task_object_id = ObjectId(task_id)

        result = await TaskService.delete_task(user_id, task_object_id)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting task: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/generate-dummy-tasks")
async def generate_dummy_tasks(
    project_id: str, 
    board_id: str, 
    num_tasks: int = 10, 
    current_user: str = Depends(get_current_user)
):
    """
    Generate dummy tasks for testing.
    All project members can generate dummy tasks.
    """
    try:
        # Verify user has access to project
        user_id = ObjectId(current_user["id"])
        await verify_user_access_to_project(user_id, ObjectId(project_id))
        
        result = await TaskService.generate_tasks_for_board(
            project_id, 
            board_id, 
            num_tasks, 
            user_id
        )
        return {
            "message": "Dummy tasks generated successfully", 
            "task_ids": [str(task_id) for task_id in result]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating dummy tasks: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")