import pytest
from unittest.mock import AsyncMock, patch
from bson import ObjectId

from app.services.task_service import update_parent_task_order

@pytest.mark.asyncio
async def test_update_parent_task_order_success():
    workflow_id = "64b8f36ebab50588c956e55c"
    task_id = "64b8f36ebab50588c956e55d"
    new_order = 2

    # Mock task yang ditemukan
    mock_task = {
        "_id": ObjectId(task_id),
        "workflow_id": workflow_id,
        "status": "todo",
        "order": 1
    }

    with patch("app.services.task_service.db") as mock_db:
        mock_db["tasks"].find_one = AsyncMock(side_effect=[
            mock_task,  # find task by id
            None        # find conflict
        ])
        mock_db["tasks"].update_one = AsyncMock(return_value=AsyncMock(modified_count=1))

        result = await update_parent_task_order(workflow_id, task_id, new_order)
        assert result == 1
        mock_db["tasks"].update_one.assert_called_once()

@pytest.mark.asyncio
async def test_update_parent_task_order_conflict():
    workflow_id = "64b8f36ebab50588c956e55c"
    task_id = "64b8f36ebab50588c956e55d"
    new_order = 1

    mock_task = {
        "_id": ObjectId(task_id),
        "workflow_id": workflow_id,
        "status": "todo",
        "order": 0
    }
    mock_conflict = {
        "_id": ObjectId(),
        "workflow_id": workflow_id,
        "status": "todo",
        "order": 1
    }

    with patch("app.services.task_service.db") as mock_db:
        mock_db["tasks"].find_one = AsyncMock(side_effect=[
            mock_task,   # find task by id
            mock_conflict  # find conflict
        ])

        with pytest.raises(ValueError, match="Order 1 has been use in 'todo' status."):
            await update_parent_task_order(workflow_id, task_id, new_order)