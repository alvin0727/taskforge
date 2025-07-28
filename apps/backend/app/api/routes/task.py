from fastapi import APIRouter, HTTPException
from app.utils.logger import logger
import app.services.task_service as task_service
import app.utils.validators.task_validators as validators


router = APIRouter()

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.patch("/{workflow_id}/parent/{task_id}/status")
async def update_parent_task_status(
    workflow_id: str,
    task_id: str,
    body: validators.StatusUpdateRequest
):
    new_status = body.new_status
    try:
        result = await task_service.update_parent_task_status(workflow_id, task_id, new_status)
        # result can be either a success message or an object with matched_count
        # if result is an int, it means modified_count
        if hasattr(result, 'matched_count'):
            if result.matched_count > 0:
                logger.info(f"Updated task {task_id} status to {new_status} in workflow {workflow_id}")
                return {"message": "Parent task status updated successfully"}
            else:
                logger.warning(f"Task {task_id} not found in workflow {workflow_id}")
                raise HTTPException(status_code=404, detail="Task not found")
        else:
            # fallback: if result is an int, it means modified_count
            if result:
                logger.info(f"Updated task {task_id} status to {new_status} in workflow {workflow_id}")
                return {"message": "Parent task status updated successfully"}
            else:
                # modified_count = 0, could mean no change
                # Assume success (idempotent)
                logger.info(f"No changes made to task {task_id} in workflow {workflow_id} (status may be the same)")
                return {"message": "Parent task status updated successfully (no changes)"}
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating parent task status: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.patch("/{workflow_id}/parent/{task_id}/order")
async def update_parent_task_order(
    workflow_id: str,
    task_id: str,
    body: validators.ReorderUpdateRequest
):
    try:
        result = await task_service.update_parent_task_order(workflow_id, task_id, body.from_order, body.to_order)
        if result > 0:
            logger.info(f"Updated task {task_id} order to {body.to_order} in workflow {workflow_id}")
            return {"message": "Parent task order updated successfully"}
        else:
            logger.warning(f"Task {task_id} not found in workflow {workflow_id}")
            raise HTTPException(status_code=404, detail="Task not found")
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating parent task order: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
