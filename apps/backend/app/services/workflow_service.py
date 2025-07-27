from app.db.database import db
from datetime import datetime
from zoneinfo import ZoneInfo
from bson import ObjectId
from app.utils.logger import logger
from app.services.llm_generator import generate_dummy_tasks


def prepare_task_for_db(task: dict) -> dict:
    if not task.get("_id"):
        task["_id"] = ObjectId()
    else:
        task["_id"] = ObjectId(task["_id"])
    return task


async def save_workflow_to_db(user_id: str, prompt: str) -> str:
    try:
        # 1. Insert Workflow
        
        workflow = {
            "user_id": user_id,
            "prompt": prompt,
            "created_at": datetime.now(ZoneInfo("Asia/Jakarta"))
        }
        result = await db["workflows"].insert_one(workflow)
        workflow_id = str(result.inserted_id)
        
        dummy_tasks = generate_dummy_tasks(workflow_id, num_root=10, num_sub=2)
        # 2. Insert Tasks
        if dummy_tasks:
            for task in dummy_tasks:
                task["workflow_id"] = workflow_id
                task["created_at"] = datetime.now(ZoneInfo("Asia/Jakarta"))
                task = prepare_task_for_db(task)
                await db["tasks"].insert_one(task)
        return workflow_id
    except Exception as e:
        logger.error(f"Error saving workflow: {e}")
        raise

async def get_workflow_by_id(workflow_id: str):
    try:
        workflow = await db["workflows"].find_one({"_id": ObjectId(workflow_id)})
        if not workflow:
            return None
        
        workflow["_id"] = str(workflow["_id"])
        tasks_cursor = db["tasks"].find({"workflow_id": workflow_id})
        tasks = []
        async for task in tasks_cursor:
            task["_id"] = str(task["_id"])
            tasks.append(task)

        workflow["tasks"] = tasks
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