from fastapi import APIRouter, Body, HTTPException
from typing import List, Dict
from app.utils.logger import logger
from app.services.llm_generator import generate_tasks_from_prompt
import app.services.workflow_service as workflow_service


router = APIRouter()

router = APIRouter(prefix="/workflows", tags=["workflows"])

@router.post("/generate-tasks")
async def generate_workflow(
    prompt: str = Body(..., embed=True),
    user_id: str = Body(..., embed=True)
) -> Dict:
    """
    Generate a workflow based on the provided prompt and save to DB.
    """
    try:
        workflow_id = await workflow_service.save_workflow_to_db(user_id, prompt)
        logger.info("Generated and saved workflow successfully")
        return {"workflow_id": workflow_id}
    except Exception as e:
        logger.error(f"Error generating workflow: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/{workflow_id}")
async def fetch_workflow_by_id(workflow_id: str):
    try:
        workflow = await workflow_service.get_workflow_by_id(workflow_id)
        if not workflow:
            logger.warning(f"Workflow not found: {workflow_id}")
            raise HTTPException(status_code=404, detail="Workflow not found")
        logger.info(f"Fetched workflow: {workflow_id}")
        return workflow
    except Exception as e:
        logger.error(f"Error fetching workflow {workflow_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/user/{user_id}")
async def fetch_workflows_by_user(user_id: str):
    try:
        workflows = await workflow_service.get_workflows_by_user_id(user_id)
        logger.info(f"Fetched {len(workflows)} workflows for user: {user_id}")
        return workflows
    except Exception as e:
        logger.error(f"Error fetching workflows for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
    