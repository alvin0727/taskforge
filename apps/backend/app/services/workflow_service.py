from app.db.database import db
from datetime import datetime
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
        logger.info("Workflow saved successfully")
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"Error saving workflow: {e}")
        raise
    