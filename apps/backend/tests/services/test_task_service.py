import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from bson import ObjectId
from app.services.task_service import update_parent_task_order

@pytest.mark.asyncio
async def test_update_parent_task_order_success():
    workflow_id = "64b8f36ebab50588c956e55c"
    task_id = "64b8f36ebab50588c956e55d"
    from_order = 1
    to_order = 0

    # Mock tasks in the same status
    mock_tasks = [
        {"_id": ObjectId("64b8f36ebab50588c956e55a"), "order": 0},
        {"_id": ObjectId(task_id), "order": 1},
        {"_id": ObjectId("64b8f36ebab50588c956e55b"), "order": 2},
    ]
    mock_task = {
        "_id": ObjectId(task_id),
        "workflow_id": workflow_id,
        "status": "todo",
        "order": 1
    }

    with patch("app.services.task_service.db") as mock_db:
        mock_db["tasks"].find_one = AsyncMock(return_value=mock_task)
        # Fix chaining cursor
        mock_cursor = MagicMock()
        mock_cursor.sort.return_value = mock_cursor
        mock_cursor.to_list = AsyncMock(return_value=mock_tasks)
        mock_db["tasks"].find.return_value = mock_cursor
        mock_db["tasks"].bulk_write = AsyncMock(return_value=AsyncMock())

        result = await update_parent_task_order(workflow_id, task_id, from_order, to_order)
        assert result == 2
        assert mock_db["tasks"].bulk_write.called


@pytest.mark.asyncio
async def test_update_parent_task_order_invalid_index():
    workflow_id = "64b8f36ebab50588c956e55c"
    task_id = "64b8f36ebab50588c956e55d"
    from_order = 5  # out of range
    to_order = 0

    mock_task = {
        "_id": ObjectId(task_id),
        "workflow_id": workflow_id,
        "status": "todo",
        "order": 1
    }
    mock_tasks = [
        {"_id": ObjectId("64b8f36ebab50588c956e55a"), "order": 0},
        {"_id": ObjectId(task_id), "order": 1},
        {"_id": ObjectId("64b8f36ebab50588c956e55b"), "order": 2},
    ]

    with patch("app.services.task_service.db") as mock_db:
        mock_db["tasks"].find_one = AsyncMock(return_value=mock_task)
        mock_cursor = MagicMock()
        mock_cursor.sort.return_value = mock_cursor
        mock_cursor.to_list = AsyncMock(return_value=mock_tasks)
        mock_db["tasks"].find.return_value = mock_cursor
        mock_db["tasks"].bulk_write = AsyncMock(return_value=AsyncMock())

        with pytest.raises(ValueError, match="Invalid from_order or to_order"):
            await update_parent_task_order(workflow_id, task_id, from_order, to_order)