from app.db.database import db
from datetime import datetime
from bson import ObjectId
from app.utils.logger import logger
from app.utils.validators import validate_task_status

async def update_parent_task_status(workflow_id: str, task_id: str, new_status: str):
    try:
        validate_task_status(new_status) 
        result = await db["workflows"].update_one(
            {
                "_id": ObjectId(workflow_id),
                "tasks.id": task_id 
            },
            {
                "$set": {
                    "tasks.$.status": new_status
                }
            }
        )
        return result.modified_count
    except Exception as e:
        logger.error(f"Error updating parent task status: {e}")
        raise