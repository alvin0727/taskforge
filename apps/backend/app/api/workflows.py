from fastapi import APIRouter, Body, HTTPException
from typing import List, Dict
from app.utils.logger import logger



from app.services.llm_generator import generate_tasks_from_prompt
from app.services.workflow_service import save_workflow_to_db

router = APIRouter()

@router.post("/workflows/generate-tasks")
async def generate_workflow(
    prompt: str = Body(..., embed=True),
    user_id: str = Body(..., embed=True)
) -> Dict:
    """
    Generate a workflow based on the provided prompt and save to DB.
    """
    try:
        tasks = generate_tasks_from_prompt(prompt)
        workflow_id = await save_workflow_to_db(user_id, prompt, tasks)
        logger.info("Generated and saved workflow successfully")
        return {"workflow_id": workflow_id, "tasks": tasks}
    except Exception as e:
        logger.error(f"Error generating workflow: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
  