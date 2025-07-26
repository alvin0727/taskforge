from app.db.database import db
from datetime import datetime
from bson import ObjectId
from app.utils.logger import logger
from app.utils.validators import validate_task_status

async def update_parent_task_status(workflow_id: str, task_id: str, new_status: str):
    """
    Update the status of a parent task in a workflow.

    Args:
        workflow_id (str): The ID of the workflow.
        task_id (str): The ID of the task.
        new_status (str): The new status to set for the task.

    Returns:
        int: The number of documents modified.
    """
    try:
        validate_task_status(new_status) 
        logger.info(f"Updating task: {task_id} in workflow: {workflow_id} to status: {new_status}")
        result = await db["tasks"].update_one(
            {
                "_id": ObjectId(task_id),
                "workflow_id": workflow_id,
            },
            {
                "$set": {
                    "status": new_status
                }
            }
        )
        return result.modified_count
    except Exception as e:
        logger.error(f"Error updating parent task status: {e}")
        raise
    
async def update_parent_task_order(workflow_id:str, task_id:str, new_order:int):
    """
    Update the order of a parent task in a workflow.
    
    Args:
        workflow_id (str): The ID of the workflow.
        task_id (str): The ID of the task.
        new_order (int): The new order to set for the task.
    Returns:
        int: The number of documents modified.
    """
    
    try:
        task = await db["tasks"].find_one({"_id": ObjectId(task_id), "workflow_id": workflow_id})
        if not task:
            raise ValueError("Task not found")
        
        current_status = task["status"]
        
        # Cek if there another task with status and order same in this workflow
        conflict = await db["tasks"].find_one({
            "workflow_id": workflow_id,
            "status": current_status,
            "order": new_order,
            "_id": {"$ne": ObjectId(task_id)}
        })
        
        if conflict:
            raise ValueError(f"Order {new_order} has been use in '{current_status}' status.")
        
        # Update order task
        result = await db["tasks"].update_one(
                    {"_id": ObjectId(task_id), "workflow_id": workflow_id},
                    {"$set": {"order": new_order}}
                )
        return result.modified_count
        
    except Exception as e:
        logger.error(f"Error updating parent task order: {e}")
        raise