from app.db.database import db
from datetime import datetime
from pymongo import UpdateOne
from bson import ObjectId
from app.utils.logger import logger

async def update_parent_task_status(workflow_id: str, task_id: str, new_status: str):
    """
    Update the status of a parent task in a workflow.
    Setelah pindah status, urutkan ulang order di status lama.
    """
    try:
        # Get the task to be updated
        task = await db["tasks"].find_one({"_id": ObjectId(task_id), "workflow_id": workflow_id})
        if not task:
            raise ValueError("Task not found")
        old_status = task["status"]

        # Set order most biggest in new status
        max_order_task = await db["tasks"].find_one(
            {"workflow_id": workflow_id, "status": new_status, "parent_id": None},
            sort=[("order", -1)]
        )
        new_order = (max_order_task["order"] + 1) if max_order_task and "order" in max_order_task else 0

        # Update status & order task that will be moved
        result = await db["tasks"].update_one(
            {
                "_id": ObjectId(task_id),
                "workflow_id": workflow_id,
            },
            {
                "$set": {
                    "status": new_status,
                    "order": new_order
                }
            }
        )

        # Reorder all parent tasks in the old status
        old_tasks = await db["tasks"].find({
            "workflow_id": workflow_id,
            "status": old_status,
            "parent_id": None,
            "_id": {"$ne": ObjectId(task_id)}
        }).sort("order", 1).to_list(length=None)
        
        bulk_ops = []
        for idx, t in enumerate(old_tasks):
            if t["order"] != idx:
                bulk_ops.append(
                    UpdateOne(
                        {"_id": t["_id"]},
                        {"$set": {"order": idx}}
                    )
                )
        if bulk_ops:
            await db["tasks"].bulk_write(bulk_ops)

        return result.modified_count
    except Exception as e:
        logger.error(f"Error updating parent task status: {e}")
        raise

async def update_parent_task_order(workflow_id:str, task_id:str, from_order: int, to_order: int):
    """
    Update the order of a parent task in a workflow.
    
    Args:
        workflow_id (str): The ID of the workflow.
        task_id (str): The ID of the task.
        from_order (int): The current order of the task.
        to_order (int): The new order to set for the task.
    Returns:
        int: The number of documents modified.
    """
    
    try:
        task = await db["tasks"].find_one({"_id": ObjectId(task_id), "workflow_id": workflow_id})
        if not task:
            raise ValueError("Task not found")
        
        status = task["status"]
        
        # Get all parents in the same status and sort
        tasks = await db["tasks"].find({
            "workflow_id": workflow_id,
            "status": status,
            "parent_id": None
        }).sort("order", 1).to_list(length=None)
        
        if from_order < 0 or from_order >= len(tasks) or to_order < 0 or to_order >= len(tasks):
            raise ValueError("Invalid from_order or to_order")   
        
        moved_task = tasks.pop(from_order)
        tasks.insert(to_order, moved_task)
         
        # Update order every task in this status
        bulk_ops = []
        for idx, t in enumerate(tasks):
            if t["order"] != idx:
                bulk_ops.append(
                    UpdateOne(
                        {"_id": t["_id"]},
                        {"$set": {"order": idx}}
                    )
                )
        if bulk_ops:
            await db["tasks"].bulk_write(bulk_ops)
        
        return len(bulk_ops)
    except Exception as e:
        logger.error(f"Error updating parent task order: {e}")
        raise