from typing import Dict, Any, List, Optional
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
from app.db.database import get_db
from app.models.task import Task, TaskCreate, TaskUpdate
from app.db.enums import TaskStatus, ActivityType
from app.utils.permissions import verify_user_access_to_project
from app.utils.logger import logger
from pymongo import UpdateOne

db = get_db()


class TaskService:

    @staticmethod
    async def create_task(
        user_id: ObjectId,
        task_data: TaskCreate
    ) -> Dict[str, Any]:
        """Create a new task"""
        try:
            project_id = ObjectId(task_data.project_id)
            
            # Verify user has access to project
            await verify_user_access_to_project(user_id, project_id)
            
            # Get the board and validate column_id if provided
            board = None
            if task_data.board_id:
                board_id = ObjectId(task_data.board_id)
                board = await db["boards"].find_one({"_id": board_id, "project_id": project_id})
                if not board:
                    raise HTTPException(status_code=404, detail="Board not found")
                
                # Validate column_id exists in board
                if task_data.column_id:
                    column_ids = [col["id"] for col in board["columns"]]
                    if task_data.column_id not in column_ids:
                        raise HTTPException(
                            status_code=400, 
                            detail="Invalid column_id for this board"
                        )
                else:
                    # Default to first column if no column_id specified
                    task_data.column_id = board["columns"][0]["id"] if board["columns"] else "todo"
            
            # Get next position for the task in the specified column
            position = await TaskService._get_next_position(
                project_id, 
                task_data.board_id, 
                task_data.column_id or "todo"
            )
            
            # Map column_id to status if needed
            status = TaskService._map_column_to_status(task_data.column_id or "todo")
            
            # Prepare task document
            task_doc = {
                "title": task_data.title,
                "description": task_data.description,
                "status": status,
                "priority": task_data.priority,
                "project_id": project_id,
                "board_id": ObjectId(task_data.board_id) if task_data.board_id else None,
                "column_id": task_data.column_id,
                "creator_id": user_id,
                "assignee_id": ObjectId(task_data.assignee_id) if task_data.assignee_id else None,
                "reviewers": [],
                "due_date": task_data.due_date,
                "start_date": None,
                "completed_at": None,
                "estimated_hours": task_data.estimated_hours,
                "actual_hours": None,
                "labels": task_data.labels,
                "attachments": [],
                "comments": [],
                "time_logs": [],
                "dependencies": [],
                "position": position,
                "archived": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Insert task
            result = await db["tasks"].insert_one(task_doc)
            task_doc["_id"] = result.inserted_id
            
            # Log activity
            await TaskService._log_activity(
                user_id=user_id,
                project_id=project_id,
                activity_type=ActivityType.TASK_CREATED,
                description=f"Created task '{task_data.title}'"
            )
            
            return TaskService._format_task_response(task_doc)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to create task: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create task: {str(e)}"
            )

    @staticmethod
    async def update_task_position(
        user_id: ObjectId,
        task_id: ObjectId,
        new_position: float,
        column_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update task position within the same status/column and reorder others"""
        try:
            # Find the task
            task = await db["tasks"].find_one({"_id": task_id})
            if not task:
                raise HTTPException(status_code=404, detail="Task not found")
            
            # Verify user has access to project
            await verify_user_access_to_project(user_id, task["project_id"])
            
            # Use existing column_id if not provided
            target_column_id = column_id or task.get("column_id", "todo")
            
            # If column_id is different, this is a status change, not just position update
            if target_column_id != task.get("column_id"):
                raise HTTPException(
                    status_code=400,
                    detail="Use change_task_status for moving between columns"
                )
            
            # Get all tasks in the column ordered by position
            query = {
                "project_id": task["project_id"],
                "column_id": target_column_id,
                "archived": False
            }
            tasks_in_column = await db["tasks"].find(query).sort("position", 1).to_list(length=None)
            
            # Remove the task being moved
            tasks_in_column = [t for t in tasks_in_column if t["_id"] != task_id]
            
            # Insert the task at the new position index
            # Find the index where new_position should be
            # If new_position is an index (int), use it directly
            # If new_position is a float, round it to int
            insert_index = int(new_position)
            if insert_index < 0:
                insert_index = 0
            if insert_index > len(tasks_in_column):
                insert_index = len(tasks_in_column)
            tasks_in_column.insert(insert_index, task)
            
            # Reassign positions (0, 1, 2, ...)
            bulk_ops = []
            for idx, t in enumerate(tasks_in_column):
                bulk_ops.append(
                    (
                        "update_one",
                        {
                            "filter": {"_id": t["_id"]},
                            "update": {"$set": {"position": idx, "updated_at": datetime.utcnow()}}
                        }
                    )
                )
                
            # Fix: use pymongo UpdateOne objects for bulk_write
            bulk_requests = [
                UpdateOne(op[1]["filter"], op[1]["update"])
                for op in bulk_ops if op[0] == "update_one"
            ]
            if bulk_requests:
                await db["tasks"].bulk_write(bulk_requests)
            
            # Get updated task
            updated_task = await db["tasks"].find_one({"_id": task_id})
            
            # Log activity
            await TaskService._log_activity(
                user_id=user_id,
                project_id=task["project_id"],
                activity_type=ActivityType.TASK_UPDATED,
                description=f"Updated position of task '{task['title']}'"
            )
            
            return TaskService._format_task_response(updated_task)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to update task position: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update task position: {str(e)}"
            )

    @staticmethod
    async def change_task_status(
        user_id: ObjectId,
        task_id: ObjectId,
        new_column_id: str,
    ) -> Dict[str, Any]:
        """Change task status by moving to different column. Always put at last position in target column and reindex source column."""
        try:
            # Find the task
            task = await db["tasks"].find_one({"_id": task_id})
            if not task:
                raise HTTPException(status_code=404, detail="Task not found")
            
            # Verify user has access to project
            await verify_user_access_to_project(user_id, task["project_id"])
            
            # Validate board and column if board_id exists
            if task.get("board_id"):
                board = await db["boards"].find_one({"_id": task["board_id"]})
                if board:
                    column_ids = [col["id"] for col in board["columns"]]
                    if new_column_id not in column_ids:
                        raise HTTPException(
                            status_code=400,
                            detail="Invalid column_id for this board"
                        )
            
            # Get all tasks in target column ordered by position
            target_query = {
                "project_id": task["project_id"],
                "column_id": new_column_id,
                "archived": False
            }
            target_tasks = await db["tasks"].find(target_query).sort("position", 1).to_list(length=None)
            # New position is always last
            new_position_val = len(target_tasks)
            
            # Map column to status
            new_status = TaskService._map_column_to_status(new_column_id)
            old_column_id = task.get("column_id")
            old_status = task.get("status")
            
            # Prepare update data for moved task
            update_data = {
                "column_id": new_column_id,
                "status": new_status,
                "position": new_position_val,
                "updated_at": datetime.utcnow()
            }
            # Set completion time for done/canceled status
            if new_status in [TaskStatus.DONE, TaskStatus.CANCELED]:
                update_data["completed_at"] = datetime.utcnow()
            elif old_status in [TaskStatus.DONE, TaskStatus.CANCELED] and new_status not in [TaskStatus.DONE, TaskStatus.CANCELED]:
                update_data["completed_at"] = None
            
            # Update the moved task
            await db["tasks"].update_one(
                {"_id": task_id},
                {"$set": update_data}
            )
            
            # Reindex positions in source column (exclude moved task)
            source_query = {
                "project_id": task["project_id"],
                "column_id": old_column_id,
                "archived": False
            }
            source_tasks = await db["tasks"].find(source_query).sort("position", 1).to_list(length=None)
            source_tasks = [t for t in source_tasks if t["_id"] != task_id]
            bulk_requests = []
            for idx, t in enumerate(source_tasks):
                bulk_requests.append(
                    UpdateOne({"_id": t["_id"]}, {"$set": {"position": idx, "updated_at": datetime.utcnow()}})
                )
            if bulk_requests:
                await db["tasks"].bulk_write(bulk_requests)
            
            # Get updated task
            updated_task = await db["tasks"].find_one({"_id": task_id})
            
            # Log activity
            await TaskService._log_activity(
                user_id=user_id,
                project_id=task["project_id"],
                activity_type=ActivityType.TASK_UPDATED,
                description=f"Moved task '{task['title']}' from {old_column_id} to {new_column_id}"
            )
            
            return TaskService._format_task_response(updated_task)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to change task status: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to change task status: {str(e)}"
            )

    @staticmethod
    async def _get_next_position(
        project_id: ObjectId,
        board_id: Optional[str],
        column_id: str
    ) -> int:
        """Get the next position for a task in a specific column (start from 0, increment by 1)"""
        try:
            query = {
                "project_id": project_id,
                "column_id": column_id,
                "archived": False
            }
            if board_id:
                query["board_id"] = ObjectId(board_id)
            last_task = await db["tasks"].find_one(
                query,
                sort=[("position", -1)]
            )
            return (last_task["position"] + 1) if last_task else 0
        except Exception as e:
            logger.error(f"Failed to get next position: {str(e)}")
            return 0

    @staticmethod
    def _map_column_to_status(column_id: str) -> TaskStatus:
        """Map column ID to TaskStatus enum"""
        column_status_map = {
            "backlog": TaskStatus.BACKLOG,
            "todo": TaskStatus.TODO,
            "in_progress": TaskStatus.IN_PROGRESS,
            "review": TaskStatus.REVIEW,
            "done": TaskStatus.DONE,
            "canceled": TaskStatus.CANCELED
        }
        return column_status_map.get(column_id, TaskStatus.TODO)

    @staticmethod
    def _format_task_response(task_doc: Dict[str, Any]) -> Dict[str, Any]:
        """Format task document for API response"""
        return {
            "id": str(task_doc["_id"]),
            "title": task_doc["title"],
            "description": task_doc.get("description"),
            "status": task_doc["status"],
            "priority": task_doc["priority"],
            "project_id": str(task_doc["project_id"]),
            "board_id": str(task_doc["board_id"]) if task_doc.get("board_id") else None,
            "column_id": task_doc.get("column_id"),
            "creator_id": str(task_doc["creator_id"]),
            "assignee_id": str(task_doc["assignee_id"]) if task_doc.get("assignee_id") else None,
            "due_date": task_doc.get("due_date"),
            "start_date": task_doc.get("start_date"),
            "completed_at": task_doc.get("completed_at"),
            "estimated_hours": task_doc.get("estimated_hours"),
            "actual_hours": task_doc.get("actual_hours"),
            "labels": task_doc.get("labels", []),
            "position": task_doc.get("position", 0.0),
            "archived": task_doc.get("archived", False),
            "created_at": task_doc["created_at"],
            "updated_at": task_doc["updated_at"]
        }

    @staticmethod
    async def _log_activity(
        user_id: ObjectId,
        project_id: ObjectId,
        activity_type: ActivityType,
        description: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log task activity"""
        try:
            activity_doc = {
                "type": activity_type,
                "user_id": user_id,
                "project_id": project_id,
                "description": description,
                "metadata": metadata or {},
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db["activities"].insert_one(activity_doc)
        except Exception as e:
            logger.error(f"Failed to log activity: {str(e)}")
            # Don't raise exception for logging failures

    # Generate dummy tasks method (existing)
    @staticmethod
    async def generate_tasks_for_board(project_id: str, board_id: str, num_tasks: int = 10, creator_id: str = None):
        """
        Generate dummy tasks for a board and insert them into the database.
        """
        from app.services.llm_generator import generate_dummy_tasks
        
        dummy_tasks = generate_dummy_tasks(project_id, board_id, num_tasks)
        # Set creator_id if provided
        if creator_id:
            for t in dummy_tasks:
                t["creator_id"] = ObjectId(creator_id)
        # Insert to database
        result = await db["tasks"].insert_many(dummy_tasks)
        return result.inserted_ids