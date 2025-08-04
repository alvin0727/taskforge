from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
from app.services.board_service import BoardService
from app.api.dependencies import get_current_user
from app.db.enums import UserRole
from app.db.enums import InvitationStatus
import app.lib.request.board_request as board_request
from app.utils.permissions import verify_user_access_to_organization

from app.db.database import get_db
from app.utils.logger import logger


router = APIRouter(prefix="/board", tags=["board"])
db = get_db()
board_service = BoardService()


@router.get("/{project_id}")
async def getBoard(
    project_id: str,
    current_user=Depends(get_current_user),
):
    """Get all boards for the current user"""
    user_id = ObjectId(current_user["id"])
    project_id = ObjectId(project_id)

    boards = await board_service.get_board(user_id, project_id)
    return {
        "boards": boards
    }
    
@router.get("/{board_id}/tasks")
async def getBoardTasks(
    board_id: str,
    current_user=Depends(get_current_user),
):
    """Get all tasks for a board"""
    user_id = ObjectId(current_user["id"])
    board_id = ObjectId(board_id)

    tasks = await board_service.get_board_tasks(user_id, board_id)
    return {
        "tasks": tasks
    }