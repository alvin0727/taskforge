import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from fastapi import HTTPException
from app.db.database import get_db
from app.db.enums import TaskStatus
from app.utils.logger import logger

db = get_db()


class DashboardService:

    @staticmethod
    async def get_dashboard_summary(organization_id: str, user_id: str) -> Dict[str, Any]:
        """
        Get complete dashboard data with parallel queries for better performance
        """
        try:

            # Run all queries in parallel for better performance
            stats_task = DashboardService._get_dashboard_stats(organization_id)
            recent_tasks_task = DashboardService._get_recent_tasks(
                organization_id, limit=5)
            active_projects_task = DashboardService._get_active_projects(
                organization_id, limit=4)
            upcoming_deadlines_task = DashboardService._get_upcoming_deadlines(
                organization_id, days=7)
            recent_activity_task = DashboardService._get_recent_activity(
                organization_id, limit=5)
            team_stats_task = DashboardService._get_team_stats(organization_id)

            # Wait for all parallel queries to complete
            stats, recent_tasks, active_projects, upcoming_deadlines, recent_activity, team_stats = await asyncio.gather(
                stats_task,
                recent_tasks_task,
                active_projects_task,
                upcoming_deadlines_task,
                recent_activity_task,
                team_stats_task,
                return_exceptions=True
            )

            # Handle any exceptions from parallel queries
            if isinstance(stats, Exception):
                logger.error(f"Stats query failed: {stats}")
                stats = DashboardService._get_default_stats()

            if isinstance(recent_tasks, Exception):
                logger.error(f"Recent tasks query failed: {recent_tasks}")
                recent_tasks = []

            if isinstance(active_projects, Exception):
                logger.error(
                    f"Active projects query failed: {active_projects}")
                active_projects = []

            if isinstance(upcoming_deadlines, Exception):
                logger.error(
                    f"Upcoming deadlines query failed: {upcoming_deadlines}")
                upcoming_deadlines = []

            if isinstance(recent_activity, Exception):
                logger.error(
                    f"Recent activity query failed: {recent_activity}")
                recent_activity = []

            if isinstance(team_stats, Exception):
                logger.error(f"Team stats query failed: {team_stats}")
                team_stats = {"total_members": 0, "online_members": 0}

            # Merge team stats with main stats
            stats.update(team_stats)

            return {
                "stats": stats,
                "recent_tasks": recent_tasks,
                "active_projects": active_projects,
                "upcoming_deadlines": upcoming_deadlines,
                "recent_activity": recent_activity
            }

        except Exception as e:
            logger.error(f"Dashboard summary failed: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Failed to get dashboard data: {str(e)}")

    @staticmethod
    async def _get_dashboard_stats(organization_id: str) -> Dict[str, Any]:
        """Get dashboard statistics with aggregation pipeline for efficiency"""
        try:
            # Convert string ID to ObjectId
            org_object_id = ObjectId(organization_id)

            # Single aggregation query to get all task stats
            task_stats_pipeline = [
                {
                    "$match": {
                        "project_id": {"$in": await DashboardService._get_organization_project_ids(organization_id)},
                        "archived": {"$ne": True}
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "total_tasks": {"$sum": 1},
                        "completed_tasks": {
                            "$sum": {"$cond": [{"$eq": ["$status", TaskStatus.DONE.value]}, 1, 0]}
                        },
                        "in_progress_tasks": {
                            "$sum": {"$cond": [{"$eq": ["$status", TaskStatus.IN_PROGRESS]}, 1, 0]}
                        },
                        "overdue_tasks": {
                            "$sum": {
                                "$cond": [
                                    {
                                        "$and": [
                                            {"$ne": ["$due_date", None]},
                                            {"$lt": ["$due_date",
                                                     datetime.utcnow()]},
                                            {"$ne": ["$status",
                                                     TaskStatus.DONE.value]}
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ]

            task_stats_result = await db["tasks"].aggregate(task_stats_pipeline).to_list(length=1)
            task_stats = task_stats_result[0] if task_stats_result else {
                "total_tasks": 0,
                "completed_tasks": 0,
                "in_progress_tasks": 0,
                "overdue_tasks": 0
            }

            # Get project count 
            project_count = await db["projects"].count_documents({
                "organization_id": org_object_id,
                "archived": {"$ne": True}
            })

            # Calculate completion rate
            completion_rate = 0
            if task_stats["total_tasks"] > 0:
                completion_rate = round(
                    (task_stats["completed_tasks"] / task_stats["total_tasks"]) * 100)

            return {
                "total_tasks": task_stats["total_tasks"],
                "completed_tasks": task_stats["completed_tasks"],
                "in_progress_tasks": task_stats["in_progress_tasks"],
                "overdue_tasks": task_stats["overdue_tasks"],
                "active_projects": project_count,
                "completion_rate": completion_rate
            }

        except Exception as e:
            logger.error(f"Failed to get dashboard stats: {str(e)}")
            return DashboardService._get_default_stats()

    @staticmethod
    async def _get_recent_tasks(organization_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Get recent tasks with project and user details"""
        try:
            project_ids = await DashboardService._get_organization_project_ids(organization_id)

            pipeline = [
                {
                    "$match": {
                        "project_id": {"$in": project_ids},
                        "archived": {"$ne": True}
                    }
                },
                {"$sort": {"_id": -1}},  # Sort by _id instead of updated_at
                {"$limit": limit},
                {
                    "$lookup": {
                        "from": "projects",
                        "localField": "project_id",
                        "foreignField": "_id",
                        "as": "project"
                    }
                },
                {
                    "$lookup": {
                        "from": "users",
                        "localField": "assignee_id",
                        "foreignField": "_id",
                        "as": "assignee"
                    }
                },
                {
                    "$project": {
                        "id": {"$toString": "$_id"},
                        "title": 1,
                        "status": 1,
                        "priority": 1,
                        "due_date": 1,
                        "project": {"$arrayElemAt": ["$project.name", 0]},
                        "project_color": {"$arrayElemAt": ["$project.color", 0]},
                        "assignee": {"$arrayElemAt": ["$assignee.name", 0]},
                        "created_at": 1,
                        "updated_at": 1
                    }
                }
            ]

            tasks = await db["tasks"].aggregate(pipeline).to_list(length=limit)

            # Format dates and ensure all ObjectIds are converted to strings
            formatted_tasks = []
            for task in tasks:
                formatted_task = {
                    "id": str(task.get("_id", task.get("id", ""))),
                    "title": task.get("title", ""),
                    "status": task.get("status", ""),
                    "priority": task.get("priority", "medium"),
                    "project": task.get("project", "Unknown Project"),
                    "assignee": task.get("assignee", "Unassigned"),
                    "project_color": task.get("project_color", "#3B82F6"),
                }

                # Use _format_datetime for all date fields
                formatted_task["due_date"] = DashboardService._format_datetime(
                    task.get("due_date"))
                formatted_task["created_at"] = DashboardService._format_datetime(
                    task.get("created_at"))
                formatted_task["updated_at"] = DashboardService._format_datetime(
                    task.get("updated_at"))

                formatted_tasks.append(formatted_task)

            return formatted_tasks

        except Exception as e:
            logger.error(f"Failed to get recent tasks: {str(e)}")
            return []

    @staticmethod
    async def _get_active_projects(organization_id: str, limit: int = 4) -> List[Dict[str, Any]]:
        """Get active projects with progress calculation"""
        try:
            # Convert string ID to ObjectId
            org_object_id = ObjectId(organization_id)

            # Debug: log the query
            logger.info(
                f"Getting active projects for organization: {org_object_id}")

            # First try simple query to check if projects exist
            simple_projects = await db["projects"].find({
                "organization_id": org_object_id,
                "archived": {"$ne": True}
            }).limit(limit).to_list(length=limit)

            logger.info(f"Simple query found {len(simple_projects)} projects")

            if not simple_projects:
                # Try without archived filter
                all_projects = await db["projects"].find({
                    "organization_id": org_object_id
                }).limit(limit).to_list(length=limit)
                logger.info(
                    f"Without archived filter found {len(all_projects)} projects")

                if not all_projects:
                    return []

            pipeline = [
                {
                    "$match": {
                        "organization_id": org_object_id,
                        "archived": {"$ne": True}
                    }
                },
                {"$sort": {"_id": -1}},  # Sort by _id instead of updated_at
                {"$limit": limit},
                {
                    "$lookup": {
                        "from": "tasks",
                        "let": {"project_id": "$_id"},
                        "pipeline": [
                            {
                                "$match": {
                                    # Fixed: use $$project_id
                                    "$expr": {"$eq": ["$project_id", "$$project_id"]},
                                    "archived": {"$ne": True}
                                }
                            },
                            {
                                "$group": {
                                    "_id": None,
                                    "total_tasks": {"$sum": 1},
                                    "completed_tasks": {
                                        "$sum": {"$cond": [{"$eq": ["$status", TaskStatus.DONE.value]}, 1, 0]}
                                    }
                                }
                            }
                        ],
                        "as": "task_stats"
                    }
                },
                {
                    "$project": {
                        "id": {"$toString": "$_id"},
                        "name": 1,
                        "description": 1,
                        "color": 1,
                        "status": 1,
                        "members_count": {"$size": {"$ifNull": ["$members", []]}},
                        "total_tasks": {"$ifNull": [{"$arrayElemAt": ["$task_stats.total_tasks", 0]}, 0]},
                        "completed_tasks": {"$ifNull": [{"$arrayElemAt": ["$task_stats.completed_tasks", 0]}, 0]},
                        "created_at": 1,
                        "end_date": 1
                    }
                }
            ]

            projects = await db["projects"].aggregate(pipeline).to_list(length=limit)

            logger.info(
                f"Found {len(projects)} active projects via aggregation")

            # Calculate progress and format data, ensuring no ObjectIds remain
            formatted_projects = []
            for project in projects:
                total_tasks = project.get("total_tasks", 0)
                completed_tasks = project.get("completed_tasks", 0)

                # Calculate progress percentage
                if total_tasks > 0:
                    progress = round((completed_tasks / total_tasks) * 100)
                else:
                    progress = 0

                # Determine project status based on progress
                if progress >= 90:
                    display_status = "Almost Done"
                elif progress >= 70:
                    display_status = "On Track"
                elif progress >= 40:
                    display_status = "In Progress"
                else:
                    display_status = "At Risk"

                formatted_project = {
                    "id": str(project.get("_id", project.get("id", ""))),
                    "name": project.get("name", ""),
                    "description": project.get("description", ""),
                    "color": project.get("color", "#3B82F6"),
                    "status": project.get("status", ""),
                    "members_count": project.get("members_count", 0),
                    "total_tasks": total_tasks,
                    "completed_tasks": completed_tasks,
                    "progress": progress,
                    "display_status": display_status
                }

                # Use _format_datetime for all date fields
                formatted_project["end_date"] = DashboardService._format_datetime(
                    project.get("end_date"))
                formatted_project["created_at"] = DashboardService._format_datetime(
                    project.get("created_at"))

                formatted_projects.append(formatted_project)

            return formatted_projects

        except Exception as e:
            logger.error(f"Failed to get active projects: {str(e)}")
            return []

    @staticmethod
    async def _get_upcoming_deadlines(organization_id: str, days: int = 7) -> List[Dict[str, Any]]:
        """Get upcoming deadlines from tasks"""
        try:
            end_date = datetime.utcnow() + timedelta(days=days)
            project_ids = await DashboardService._get_organization_project_ids(organization_id)

            # Get tasks with upcoming due dates
            tasks_pipeline = [
                {
                    "$match": {
                        "project_id": {"$in": project_ids},
                        "due_date": {
                            "$gte": datetime.utcnow(),
                            "$lte": end_date
                        },
                        "status": {"$ne": TaskStatus.DONE.value},
                        "archived": {"$ne": True}
                    }
                },
                {"$sort": {"due_date": 1}},
                {"$limit": 10},
                {
                    "$lookup": {
                        "from": "projects",
                        "localField": "project_id",
                        "foreignField": "_id",
                        "as": "project"
                    }
                },
                {
                    "$project": {
                        "title": 1,
                        "due_date": 1,
                        "priority": 1,
                        "project_name": {"$arrayElemAt": ["$project.name", 0]}
                    }
                }
            ]

            upcoming_tasks = await db["tasks"].aggregate(tasks_pipeline).to_list(length=10)

            # Format the results, ensuring no ObjectIds remain
            deadlines = []
            for item in upcoming_tasks:
                deadline = {
                    "title": item.get("title", ""),
                    # Use _format_datetime
                    "date": DashboardService._format_datetime(item.get("due_date")),
                    "type": "deliverable",  # Map task to deliverable
                    "priority": item.get("priority", "medium"),
                    "project_name": item.get("project_name", "Unknown Project")
                }
                deadlines.append(deadline)

            # Sort by date (handle None values)
            deadlines.sort(key=lambda x: x["date"]
                           if x["date"] else "9999-12-31")

            return deadlines[:7]  # Return top 7 upcoming deadlines

        except Exception as e:
            logger.error(f"Failed to get upcoming deadlines: {str(e)}")
            return []

    @staticmethod
    async def _get_recent_activity(organization_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Get recent activity from the organization"""
        try:
            # Get activities related to organization projects
            project_ids = await DashboardService._get_organization_project_ids(organization_id)

            pipeline = [
                {
                    "$match": {
                        "$or": [
                            {"project_id": {"$in": project_ids}},
                            # Keep as string since metadata likely stores string IDs
                            {"metadata.organization_id": organization_id}
                        ]
                    }
                },
                # Sort by _id instead of created_at (safer)
                {"$sort": {"_id": -1}},
                {"$limit": limit},
                {
                    "$lookup": {
                        "from": "users",
                        "localField": "user_id",
                        "foreignField": "_id",
                        "as": "user"
                    }
                },
                {
                    "$project": {
                        "id": {"$toString": "$_id"},
                        "type": 1,
                        "description": 1,
                        "created_at": 1,
                        "user_name": {"$arrayElemAt": ["$user.name", 0]},
                        "user_email": {"$arrayElemAt": ["$user.email", 0]}
                    }
                }
            ]

            activities = await db["activities"].aggregate(pipeline).to_list(length=limit)

            # Format activity data, ensuring no ObjectIds remain
            formatted_activities = []
            for activity in activities:
                user_name = activity.get("user_name", "Unknown User")

                # Generate avatar initials
                avatar = ""
                if user_name and user_name != "Unknown User":
                    name_parts = user_name.strip().split()
                    avatar = "".join([part[0].upper()
                                     for part in name_parts[:2] if part])

                # Format time
                created_at = activity.get("created_at")
                if created_at and isinstance(created_at, datetime):
                    time_diff = datetime.utcnow() - created_at

                    if time_diff.days > 0:
                        time_str = f"{time_diff.days} day{'s' if time_diff.days > 1 else ''} ago"
                    elif time_diff.seconds > 3600:
                        hours = time_diff.seconds // 3600
                        time_str = f"{hours} hour{'s' if hours > 1 else ''} ago"
                    elif time_diff.seconds > 60:
                        minutes = time_diff.seconds // 60
                        time_str = f"{minutes} minute{'s' if minutes > 1 else ''} ago"
                    else:
                        time_str = "Just now"
                else:
                    time_str = "Unknown time"
                    created_at = datetime.utcnow()  # fallback

                formatted_activity = {
                    "id": str(activity.get("_id", activity.get("id", ""))),
                    "user": user_name,
                    "avatar": avatar,
                    "action": DashboardService._format_activity_action(activity.get("type", "")),
                    "item": activity.get("description", ""),
                    "time": time_str,
                    # Use _format_datetime
                    "created_at": DashboardService._format_datetime(created_at)
                }

                formatted_activities.append(formatted_activity)

            return formatted_activities

        except Exception as e:
            logger.error(f"Failed to get recent activity: {str(e)}")
            return []

    @staticmethod
    async def _get_team_stats(organization_id: str) -> Dict[str, Any]:
        """Get team statistics for the organization"""
        try:
            # Convert string ID to ObjectId
            org_object_id = ObjectId(organization_id)

            # Get organization to get member count
            org = await db["organizations"].find_one({"_id": org_object_id})
            if not org:
                return {"team_members": 0, "active_members": 0}

            members = org.get("members", [])
            total_members = len(members)

            # Active members: logged in within last 7 days (more realistic than 24h)
            active_members = 0
            if members:
                week_ago = datetime.utcnow() - timedelta(days=7)
                active_members = await db["users"].count_documents({
                    "_id": {"$in": members},
                    "last_login": {"$gte": week_ago}
                })

            return {
                "team_members": total_members,
                "active_members": active_members
            }

        except Exception as e:
            logger.error(f"Failed to get team stats: {str(e)}")
            return {"team_members": 0, "active_members": 0}

    @staticmethod
    async def _get_organization_project_ids(organization_id: str) -> List[ObjectId]:
        """Get all project IDs for an organization"""
        try:
            # Convert string ID to ObjectId
            org_object_id = ObjectId(organization_id)

            # Debug: log the query
            logger.info(
                f"Looking for projects with organization_id: {org_object_id}")

            projects = await db["projects"].find(
                {"organization_id": org_object_id, "archived": {"$ne": True}},
                {"_id": 1}
            ).to_list(length=None)

            logger.info(
                f"Found {len(projects)} projects for organization {organization_id}")

            return [project["_id"] for project in projects]

        except Exception as e:
            logger.error(f"Failed to get organization project IDs: {str(e)}")
            return []

    @staticmethod
    def _format_activity_action(activity_type: str) -> str:
        """Format activity type to human readable action"""
        action_map = {
            "TASK_CREATED": "created task",
            "TASK_UPDATED": "updated task",
            "TASK_COMPLETED": "completed",
            "TASK_ASSIGNED": "assigned",
            "TASK_COMMENTED": "commented on",
            "PROJECT_CREATED": "created project",
            "PROJECT_UPDATED": "updated project",
            "USER_JOINED": "joined",
            "USER_INVITED": "invited user to"
        }

        return action_map.get(activity_type, "updated")

    @staticmethod
    def _get_default_stats() -> Dict[str, Any]:
        """Return default stats when query fails"""
        return {
            "total_tasks": 0,
            "completed_tasks": 0,
            "in_progress_tasks": 0,
            "overdue_tasks": 0,
            "active_projects": 0,
            "completion_rate": 0
        }

    @staticmethod
    def _format_datetime(dt_value) -> Optional[str]:
        """Safely format datetime value to ISO string"""
        if dt_value is None:
            return None
        if isinstance(dt_value, datetime):
            return dt_value.isoformat()
        if isinstance(dt_value, str):
            return dt_value  # Assume already formatted
        return None
