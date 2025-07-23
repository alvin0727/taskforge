from app.db.database import db
from datetime import datetime
from bson import ObjectId
from app.utils.logger import logger

async def save_workflow_to_db(user_id: str, prompt: str, tasks: list) -> str:
    try:
        workflow = {
            "user_id": user_id,
            "prompt": prompt,
            "tasks": tasks,
            "created_at": datetime.utcnow()
        }
        result = await db["workflows"].insert_one(workflow)
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"Error saving workflow: {e}")
        raise

async def get_workflow_by_id(workflow_id: str):
    try:
        workflow = await db["workflows"].find_one({"_id": ObjectId(workflow_id)})
        if workflow:
            workflow["_id"] = str(workflow["_id"])
        return workflow
    except Exception as e:
        logger.error(f"Error fetching workflow {workflow_id}: {e}")
        raise

async def get_workflows_by_user_id(user_id: str):
    try:
        cursor = db["workflows"].find({"user_id": user_id})
        workflows = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            workflows.append(doc)
        return workflows
    except Exception as e:
        logger.error(f"Error fetching workflows for user {user_id}: {e}")
        raise