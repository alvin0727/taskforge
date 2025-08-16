from typing import Dict, Any, List, Optional
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
from app.db.database import get_db
from app.models.board import Board, BoardCreate, BoardUpdate, BoardColumn
from app.db.enums import ActivityType, UserRole, TaskStatus
from app.utils.logger import logger
from app.utils.permissions import verify_user_access_to_project

db = get_db()


class BoardService:

    @staticmethod
    def _get_default_columns() -> List[Dict[str, Any]]:
        """Get default Kanban columns (6 columns based on TaskStatus)"""
        return [
            {
                "id": "backlog",
                "name": "Backlog",
                "position": 0,
                "color": "#6B7280",
                "task_limit": None
            },
            {
                "id": "todo",
                "name": "To Do",
                "position": 1,
                "color": "#94A3B8",
                "task_limit": None
            },
            {
                "id": "in_progress",
                "name": "In Progress",
                "position": 2,
                "color": "#3B82F6",
                "task_limit": None
            },
            {
                "id": "review",
                "name": "Review",
                "position": 3,
                "color": "#F59E0B",
                "task_limit": None
            },
            {
                "id": "done",
                "name": "Done",
                "position": 4,
                "color": "#10B981",
                "task_limit": None
            },
            {
                "id": "canceled",
                "name": "Canceled",
                "position": 5,
                "color": "#EF4444",
                "task_limit": None
            }
        ]

    @staticmethod
    async def get_board(
        user_id: ObjectId,
        project_id: ObjectId
    ) -> Dict[str, Any]:
        try:
            board = await db["boards"].find_one({"project_id": project_id, "is_default": True})
            if not board:
                raise HTTPException(status_code=404, detail="Board not found")
            await verify_user_access_to_project(user_id, board["project_id"])
            return {
                "id": str(board["_id"]),
                "name": board["name"],
                "project_id": str(board["project_id"]),
                "columns": board["columns"],
                "is_default": board["is_default"],
                "created_at": board["created_at"],
                "updated_at": board["updated_at"]
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get board: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Failed to get board: {str(e)}")

    @staticmethod
    async def get_board_tasks(
        user_id: ObjectId,
        board_id: ObjectId
    ) -> Dict[str, List[Dict[str, Any]]]:
        try:
            board = await db["boards"].find_one({"_id": board_id})
            if not board:
                raise HTTPException(status_code=404, detail="Board not found")
            await verify_user_access_to_project(user_id, board["project_id"])
            return await BoardService._get_board_tasks(board_id)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get board tasks: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Failed to get board tasks: {str(e)}")

    @staticmethod
    async def list_boards_by_organization(
        user_id: ObjectId,
        organization_id: ObjectId
    ) -> Dict[str, Any]:
        """
        List all boards in an organization, grouped by project (active & archived),
        with board stats.
        """
        try:
            db = get_db()

            # 1. Get all projects in the organization (active & archived)
            projects = await db["projects"].find({
                "organization_id": organization_id
            }).to_list(length=None)

            # Pisahkan project aktif & archived
            active_projects = [
                p for p in projects if not p.get("archived", False)]
            archived_projects = [
                p for p in projects if p.get("archived", False)]

            # Helper untuk ambil boards & stats per project
            async def get_boards_for_projects(projects):
                result = []
                for project in projects:
                    boards = await db["boards"].find({
                        "project_id": project["_id"]
                    }).sort("updated_at", -1).to_list(length=None)
                    board_list = []
                    for board in boards:
                        stats = await BoardService.get_board_statistics(user_id, board["_id"])
                        board_list.append({
                            "id": str(board["_id"]),
                            "name": board["name"],
                            "project_id": str(board["project_id"]),
                            "is_default": board.get("is_default", False),
                            "created_at": board["created_at"],
                            "updated_at": board["updated_at"],
                            "stats": stats
                        })
                    result.append({
                        "project": {
                            "id": str(project["_id"]),
                            "name": project["name"],
                            "archived": project.get("archived", False),
                            "color": project.get("color", "#3B82F6"),
                        },
                        "boards": board_list
                    })
                return result

            # 2. Get boards & stats for active and archived projects
            active = await get_boards_for_projects(active_projects)
            archived = await get_boards_for_projects(archived_projects)
            
            # Sort active projects by latest board updated_at
            active.sort(
                key=lambda x: x["boards"][0]["updated_at"] if x["boards"] else datetime.min,
                reverse=True
            )
            # (opsional) Sort archived 
            archived.sort(
                key=lambda x: x["boards"][0]["updated_at"] if x["boards"] else datetime.min,
                reverse=True
)

            return {
                "active": active,
                "archived": archived
            }

        except Exception as e:
            logger.error(f"Failed to list boards by organization: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to list boards by organization: {str(e)}"
            )

    @staticmethod
    async def update_board(
        user_id: ObjectId,
        board_id: ObjectId,
        board_data: BoardUpdate
    ) -> Dict[str, Any]:
        """Update board"""
        try:
            # Find board
            board = await db["boards"].find_one({"_id": board_id})
            if not board:
                raise HTTPException(status_code=404, detail="Board not found")

            # Verify project access
            access = await verify_user_access_to_project(user_id, board["project_id"])
            if not access["can_manage"]:
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions to update board"
                )

            # Prepare update data
            update_data = {"updated_at": datetime.utcnow()}
            if board_data.name is not None:
                update_data["name"] = board_data.name
            if board_data.columns is not None:
                await BoardService._validate_columns(board_data.columns)
                columns = []
                for col in board_data.columns:
                    columns.append({
                        "id": col.id,
                        "name": col.name,
                        "position": col.position,
                        "color": col.color,
                        "task_limit": col.task_limit
                    })
                update_data["columns"] = columns

            # Update board
            await db["boards"].update_one(
                {"_id": board_id},
                {"$set": update_data}
            )

            # If columns were updated, update tasks
            if board_data.columns is not None:
                await BoardService._handle_column_changes(
                    board_id,
                    board["columns"],
                    update_data["columns"]
                )

            # Log activity
            await BoardService._log_activity(
                user_id=user_id,
                project_id=board["project_id"],
                activity_type=ActivityType.BOARD_UPDATED,
                description=f"Updated board '{board['name']}'"
            )

            # Return updated board
            return await BoardService.get_board(user_id, board_id)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to update board: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update board: {str(e)}"
            )

    @staticmethod
    async def list_project_boards(
        user_id: ObjectId,
        project_id: ObjectId
    ) -> List[Dict[str, Any]]:
        """List all boards for a project"""
        try:
            # Verify project access
            await verify_user_access_to_project(user_id, project_id)

            # Get boards
            boards = await db["boards"].find({
                "project_id": project_id
            }).sort("is_default", -1).to_list(length=None)  # Default board first

            # Enrich with task counts
            enriched_boards = []
            for board in boards:
                task_count = await db["tasks"].count_documents({
                    "board_id": board["_id"],
                    "archived": False
                })

                enriched_boards.append({
                    "id": str(board["_id"]),
                    "name": board["name"],
                    "project_id": str(board["project_id"]),
                    "columns": board["columns"],
                    "is_default": board["is_default"],
                    "task_count": task_count,
                    "created_at": board["created_at"],
                    "updated_at": board["updated_at"]
                })

            return enriched_boards

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to list project boards: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to list project boards: {str(e)}"
            )

    @staticmethod
    async def reorder_columns(
        user_id: ObjectId,
        board_id: ObjectId,
        column_order: List[str]
    ) -> bool:
        """Reorder board columns"""
        try:
            # Find board
            board = await db["boards"].find_one({"_id": board_id})
            if not board:
                raise HTTPException(status_code=404, detail="Board not found")

            # Verify project access
            access = await verify_user_access_to_project(user_id, board["project_id"])
            if not access["can_manage"]:
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions to reorder columns"
                )

            # Validate all column IDs exist
            current_columns = {col["id"]: col for col in board["columns"]}
            if set(column_order) != set(current_columns.keys()):
                raise HTTPException(
                    status_code=400,
                    detail="Column order must include all existing columns"
                )

            # Reorder columns
            reordered_columns = []
            for i, col_id in enumerate(column_order):
                col = current_columns[col_id].copy()
                col["position"] = i + 1
                reordered_columns.append(col)

            # Update board
            await db["boards"].update_one(
                {"_id": board_id},
                {"$set": {
                    "columns": reordered_columns,
                    "updated_at": datetime.utcnow()
                }}
            )

            # Log activity
            await BoardService._log_activity(
                user_id=user_id,
                project_id=board["project_id"],
                activity_type=ActivityType.BOARD_UPDATED,
                description=f"Reordered columns in board '{board['name']}'"
            )

            return True

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to reorder columns: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to reorder columns: {str(e)}"
            )

    @staticmethod
    async def move_task(
        user_id: ObjectId,
        board_id: ObjectId,
        task_id: ObjectId,
        target_column_id: str,
        position: float
    ) -> bool:
        """Move task to different column"""
        try:
            # Find board
            board = await db["boards"].find_one({"_id": board_id})
            if not board:
                raise HTTPException(status_code=404, detail="Board not found")

            # Verify project access
            await verify_user_access_to_project(user_id, board["project_id"])

            # Validate column exists
            column_ids = [col["id"] for col in board["columns"]]
            if target_column_id not in column_ids:
                raise HTTPException(
                    status_code=400,
                    detail="Target column does not exist"
                )

            # Find task
            task = await db["tasks"].find_one({"_id": task_id})
            if not task:
                raise HTTPException(status_code=404, detail="Task not found")

            # Update task position and column
            update_data = {
                "column_id": target_column_id,
                "position": position,
                "updated_at": datetime.utcnow()
            }

            # Update task status based on column
            if target_column_id == "backlog":
                update_data["status"] = TaskStatus.BACKLOG
            elif target_column_id == "todo":
                update_data["status"] = TaskStatus.TODO
            elif target_column_id == "in_progress":
                update_data["status"] = TaskStatus.IN_PROGRESS
            elif target_column_id == "review":
                update_data["status"] = TaskStatus.REVIEW
            elif target_column_id == "done":
                update_data["status"] = TaskStatus.DONE
                update_data["completed_at"] = datetime.utcnow()
            elif target_column_id == "canceled":
                update_data["status"] = TaskStatus.CANCELED
                update_data["completed_at"] = datetime.utcnow()

            await db["tasks"].update_one(
                {"_id": task_id},
                {"$set": update_data}
            )

            # Log activity
            await BoardService._log_activity(
                user_id=user_id,
                project_id=board["project_id"],
                activity_type=ActivityType.TASK_UPDATED,
                description=f"Moved task '{task['title']}' to {target_column_id}"
            )

            return True

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to move task: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to move task: {str(e)}"
            )

    @staticmethod
    async def _get_board_tasks(board_id: ObjectId) -> Dict[str, List[Dict[str, Any]]]:
        """Get tasks grouped by column for a board"""
        try:
            tasks = await db["tasks"].find({
                "board_id": board_id,
                "archived": False
            }).sort("position", 1).to_list(length=None)

            # Group tasks by column (default to backlog if no column_id)
            tasks_by_column = {}
            for task in tasks:
                column_id = task.get("column_id", "backlog")
                if column_id not in tasks_by_column:
                    tasks_by_column[column_id] = []

                # Convert ObjectIds to strings and format task
                task_data = {
                    "id": str(task["_id"]),
                    "title": task["title"],
                    "status": task["status"],
                    "priority": task["priority"],
                    "board_id": str(task["board_id"]) if task.get("board_id") else None,
                    "project_id": str(task["project_id"]) if task.get("project_id") else None,
                    "assignee_id": str(task["assignee_id"]) if task.get("assignee_id") else None,
                    "due_date": task.get("due_date"),
                    "estimated_hours": task.get("estimated_hours", 0),
                    "labels": task.get("labels", []),
                    "position": task.get("position", 0.0),
                    "created_at": task["created_at"],
                    "updated_at": task["updated_at"]
                }
                tasks_by_column[column_id].append(task_data)

            return tasks_by_column

        except Exception as e:
            logger.error(f"Failed to get board tasks: {str(e)}")
            return {}

    @staticmethod
    async def _validate_columns(columns: List[BoardColumn]) -> None:
        """Validate column structure"""
        if not columns:
            raise HTTPException(
                status_code=400,
                detail="At least one column is required"
            )

        # Check for duplicate IDs
        column_ids = [col.id for col in columns]
        if len(column_ids) != len(set(column_ids)):
            raise HTTPException(
                status_code=400,
                detail="Column IDs must be unique"
            )

        # Validate positions
        positions = [col.position for col in columns]
        if len(positions) != len(set(positions)):
            raise HTTPException(
                status_code=400,
                detail="Column positions must be unique"
            )

    @staticmethod
    async def _handle_column_changes(
        board_id: ObjectId,
        old_columns: List[Dict[str, Any]],
        new_columns: List[Dict[str, Any]]
    ) -> None:
        """Handle column changes and update affected tasks"""
        try:
            old_column_ids = {col["id"] for col in old_columns}
            new_column_ids = {col["id"] for col in new_columns}

            # Find removed columns
            removed_columns = old_column_ids - new_column_ids

            if removed_columns:
                # Move tasks from removed columns to the first available column
                if new_columns:
                    default_column_id = new_columns[0]["id"]

                    # Update tasks in removed columns
                    await db["tasks"].update_many(
                        {
                            "board_id": board_id,
                            "column_id": {"$in": list(removed_columns)}
                        },
                        {
                            "$set": {
                                "column_id": default_column_id,
                                "updated_at": datetime.utcnow()
                            }
                        }
                    )

        except Exception as e:
            logger.error(f"Failed to handle column changes: {str(e)}")
            # Don't raise exception, as this is a cleanup operation

    @staticmethod
    async def get_board_statistics(
        user_id: ObjectId,
        board_id: ObjectId
    ) -> Dict[str, Any]:
        """Get detailed board statistics"""
        try:
            # Find board
            board = await db["boards"].find_one({"_id": board_id})
            if not board:
                raise HTTPException(status_code=404, detail="Board not found")

            # Verify project access
            await verify_user_access_to_project(user_id, board["project_id"])

            # Get task counts by column
            pipeline = [
                {"$match": {"board_id": board_id, "archived": False}},
                {"$group": {
                    "_id": "$column_id",
                    "count": {"$sum": 1},
                    "high_priority": {"$sum": {"$cond": [{"$eq": ["$priority", "high"]}, 1, 0]}},
                    "urgent_priority": {"$sum": {"$cond": [{"$eq": ["$priority", "urgent"]}, 1, 0]}},
                    "overdue": {"$sum": {"$cond": [
                        {"$and": [
                            {"$ne": ["$due_date", None]},  # <-- Add check for due_date not null
                            {"$lt": ["$due_date", datetime.utcnow()]},
                            {"$not": {"$in": ["$status", ["done", "canceled"]]}}
                        ]}, 1, 0
                    ]}}
                }}
            ]

            column_stats = await db["tasks"].aggregate(pipeline).to_list(length=None)

            # Initialize stats for all columns
            stats = {
                "total_tasks": 0,
                "columns": {
                    "backlog": {"count": 0, "high_priority": 0, "urgent_priority": 0, "overdue": 0},
                    "todo": {"count": 0, "high_priority": 0, "urgent_priority": 0, "overdue": 0},
                    "in_progress": {"count": 0, "high_priority": 0, "urgent_priority": 0, "overdue": 0},
                    "review": {"count": 0, "high_priority": 0, "urgent_priority": 0, "overdue": 0},
                    "done": {"count": 0, "high_priority": 0, "urgent_priority": 0, "overdue": 0},
                    "canceled": {"count": 0, "high_priority": 0, "urgent_priority": 0, "overdue": 0}
                },
                "completion_rate": 0.0,
                "workflow_efficiency": {}
            }

            # Fill in actual stats
            for stat in column_stats:
                column_id = stat["_id"] or "backlog"
                if column_id in stats["columns"]:
                    stats["columns"][column_id] = {
                        "count": stat["count"],
                        "high_priority": stat["high_priority"],
                        "urgent_priority": stat["urgent_priority"],
                        "overdue": stat["overdue"]
                    }
                    stats["total_tasks"] += stat["count"]

            # Calculate completion rate
            completed_tasks = stats["columns"]["done"]["count"]
            if stats["total_tasks"] > 0:
                stats["completion_rate"] = round(
                    (completed_tasks / stats["total_tasks"]) * 100, 1)

            # Calculate workflow efficiency (tasks moving through pipeline)
            active_tasks = (stats["columns"]["todo"]["count"] +
                            stats["columns"]["in_progress"]["count"] +
                            stats["columns"]["review"]["count"])

            stats["workflow_efficiency"] = {
                "active_tasks": active_tasks,
                "blocked_tasks": stats["columns"]["backlog"]["count"],
                "completed_tasks": completed_tasks,
                "canceled_tasks": stats["columns"]["canceled"]["count"]
            }

            return stats

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get board statistics: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to get board statistics: {str(e)}"
            )

    @staticmethod
    async def bulk_move_tasks(
        user_id: ObjectId,
        board_id: ObjectId,
        task_moves: List[Dict[str, Any]]
    ) -> bool:
        """Bulk move multiple tasks between columns"""
        try:
            # Find board
            board = await db["boards"].find_one({"_id": board_id})
            if not board:
                raise HTTPException(status_code=404, detail="Board not found")

            # Verify project access
            await verify_user_access_to_project(user_id, board["project_id"])

            # Validate all columns exist
            column_ids = [col["id"] for col in board["columns"]]

            # Process each move
            bulk_operations = []
            for move in task_moves:
                task_id = ObjectId(move["task_id"])
                target_column_id = move["target_column_id"]
                position = move.get("position", 0.0)

                if target_column_id not in column_ids:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Column '{target_column_id}' does not exist"
                    )

                # Prepare update data
                update_data = {
                    "column_id": target_column_id,
                    "position": position,
                    "updated_at": datetime.utcnow()
                }

                # Update status based on column
                if target_column_id == "backlog":
                    update_data["status"] = TaskStatus.BACKLOG
                elif target_column_id == "todo":
                    update_data["status"] = TaskStatus.TODO
                elif target_column_id == "in_progress":
                    update_data["status"] = TaskStatus.IN_PROGRESS
                elif target_column_id == "review":
                    update_data["status"] = TaskStatus.REVIEW
                elif target_column_id == "done":
                    update_data["status"] = TaskStatus.DONE
                    update_data["completed_at"] = datetime.utcnow()
                elif target_column_id == "canceled":
                    update_data["status"] = TaskStatus.CANCELED
                    update_data["completed_at"] = datetime.utcnow()

                bulk_operations.append({
                    "update_one": {
                        "filter": {"_id": task_id},
                        "update": {"$set": update_data}
                    }
                })

            # Execute bulk update
            if bulk_operations:
                await db["tasks"].bulk_write(bulk_operations)

            # Log activity
            await BoardService._log_activity(
                user_id=user_id,
                project_id=board["project_id"],
                activity_type=ActivityType.BOARD_UPDATED,
                description=f"Bulk moved {len(task_moves)} tasks in board '{board['name']}'"
            )

            return True

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to bulk move tasks: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to bulk move tasks: {str(e)}"
            )

    @staticmethod
    async def archive_column_tasks(
        user_id: ObjectId,
        board_id: ObjectId,
        column_id: str
    ) -> int:
        """Archive all tasks in a specific column"""
        try:
            # Find board
            board = await db["boards"].find_one({"_id": board_id})
            if not board:
                raise HTTPException(status_code=404, detail="Board not found")

            # Verify project access
            access = await verify_user_access_to_project(user_id, board["project_id"])
            if not access["can_manage"]:
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions to archive tasks"
                )

            # Validate column exists
            column_ids = [col["id"] for col in board["columns"]]
            if column_id not in column_ids:
                raise HTTPException(
                    status_code=400,
                    detail="Column does not exist"
                )

            # Archive all tasks in column
            result = await db["tasks"].update_many(
                {
                    "board_id": board_id,
                    "column_id": column_id,
                    "archived": False
                },
                {
                    "$set": {
                        "archived": True,
                        "archived_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )

            # Log activity
            column_name = next(
                (col["name"] for col in board["columns"] if col["id"] == column_id), column_id)
            await BoardService._log_activity(
                user_id=user_id,
                project_id=board["project_id"],
                activity_type=ActivityType.BOARD_UPDATED,
                description=f"Archived {result.modified_count} tasks from column '{column_name}'"
            )

            return result.modified_count

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to archive column tasks: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to archive column tasks: {str(e)}"
            )
    # ...existing code...

    @staticmethod
    async def _log_activity(
        user_id: ObjectId,
        project_id: ObjectId,
        activity_type: ActivityType,
        description: str,
        target_user_id: Optional[ObjectId] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log board activity"""
        try:
            activity_doc = {
                "type": activity_type,
                "user_id": user_id,
                "project_id": project_id,
                "target_user_id": target_user_id,
                "description": description,
                "metadata": metadata or {},
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db["activities"].insert_one(activity_doc)
        except Exception as e:
            logger.error(f"Failed to log activity: {str(e)}")
            # Don't raise exception for logging failures

    @staticmethod
    async def delete_board(
        user_id: ObjectId,
        board_id: ObjectId
    ) -> bool:
        """Delete board (non-default boards only)"""
        try:
            # Find board
            board = await db["boards"].find_one({"_id": board_id})
            if not board:
                raise HTTPException(status_code=404, detail="Board not found")

            # Verify project access
            access = await verify_user_access_to_project(user_id, board["project_id"])
            if not access["can_manage"]:
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions to delete board"
                )

            # Don't allow deletion of default board
            if board["is_default"]:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot delete default board"
                )

            # Check if there are tasks on this board
            task_count = await db["tasks"].count_documents({
                "board_id": board_id,
                "archived": False
            })

            if task_count > 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot delete board with {task_count} active tasks. Move or archive tasks first."
                )

            # Delete board
            await db["boards"].delete_one({"_id": board_id})

            # Log activity
            await BoardService._log_activity(
                user_id=user_id,
                project_id=board["project_id"],
                activity_type=ActivityType.BOARD_UPDATED,
                description=f"Deleted board '{board['name']}'"
            )

            return True

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to delete board: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to delete board: {str(e)}"
            )
