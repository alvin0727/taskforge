from typing import Dict, Any, List, Optional
from datetime import datetime, date
from bson import ObjectId
from fastapi import HTTPException
import re
from app.db.database import get_db
from app.models.project import Project, ProjectCreate, ProjectUpdate, ProjectSettings
from app.models.board import Board, BoardColumn
from app.db.enums import ProjectStatus, UserRole, ActivityType
from app.utils.logger import logger

db = get_db()


class ProjectService:

    @staticmethod
    def generate_project_slug(name: str) -> str:
        """Generate URL-friendly slug from project name"""
        slug = re.sub(r'[^a-zA-Z0-9\s-]', '', name.lower())
        slug = re.sub(r'\s+', '-', slug.strip())
        slug = re.sub(r'-+', '-', slug)
        return slug[:50]

    @staticmethod
    async def ensure_unique_slug(base_slug: str, organization_id: ObjectId) -> str:
        """Ensure project slug is unique within organization"""
        slug = base_slug
        counter = 1

        while await db["projects"].find_one({
            "slug": slug,
            "organization_id": organization_id
        }):
            slug = f"{base_slug}-{counter}"
            counter += 1
        return slug

    @staticmethod
    async def verify_user_access(user_id: ObjectId, organization_id: ObjectId) -> Dict[str, Any]:
        """Verify user has access to organization and get role"""
        user = await db["users"].find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_orgs = user.get("organizations", [])
        user_org = next(
            (org for org in user_orgs
             if org["organization_id"] == organization_id
             and org.get("status") == "active"),
            None
        )

        if not user_org:
            raise HTTPException(
                status_code=403,
                detail="User not member of organization or access denied"
            )

        return {
            "role": user_org["role"],
            "can_create": user_org["role"] in [UserRole.ADMIN, UserRole.MANAGER],
            "can_manage": user_org["role"] in [UserRole.ADMIN, UserRole.MANAGER]
        }

    @staticmethod
    async def create_default_board(project_id: ObjectId, project_name: str) -> ObjectId:
        """Create default Kanban board for new project"""
        try:
            # Default columns for Kanban board (match BoardService)
            default_columns = [
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

            board_data = {
                "name": f"{project_name} Board",
                "project_id": project_id,
                "columns": default_columns,
                "is_default": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }

            result = await db["boards"].insert_one(board_data)
            logger.info(
                f"Created default board {result.inserted_id} for project {project_id}")
            return result.inserted_id

        except Exception as e:
            logger.error(f"Failed to create default board: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create default board: {str(e)}"
            )

    @staticmethod
    async def create_project(
        user_id: ObjectId,
        organization_id: ObjectId,
        project_data: ProjectCreate
    ) -> Dict[str, Any]:
        """Create new project with default board"""
        try:
            # Verify organization exists
            org = await db["organizations"].find_one({"_id": organization_id})
            if not org:
                raise HTTPException(
                    status_code=404, detail="Organization not found")

            # Generate unique slug
            base_slug = ProjectService.generate_project_slug(
                project_data["name"])
            unique_slug = await ProjectService.ensure_unique_slug(base_slug, organization_id)

            # Create project document
            project_doc = {
                "name": project_data["name"],
                "slug": unique_slug,
                "description": project_data.get("description"),
                "color": project_data.get("color"),
                "status": ProjectStatus.ACTIVE,
                "organization_id": organization_id,
                "owner_id": user_id,
                "members": [user_id],  # Owner is automatically a member
                "start_date": project_data.get("start_date"),
                "end_date": project_data.get("end_date"),
                "settings": {
                    "public": False,
                    "allow_comments": True,
                    "auto_assign": False,
                    "default_assignee": None
                },
                "tags": [],
                "archived": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }

            # Insert project
            result = await db["projects"].insert_one(project_doc)
            project_id = result.inserted_id

            # Owner: add project to joined_projects as manager
            await db["users"].update_one(
                {"_id": user_id},
                {"$addToSet": {"joined_projects": {
                    "project_id": project_id,
                    "role": UserRole.MANAGER,
                    "status": "active",
                    "joined_at": datetime.utcnow(),
                    "invited_by": None
                }}}
            )

            # Create default board
            board_id = await ProjectService.create_default_board(project_id, project_data["name"])

            # Log activity
            await ProjectService._log_activity(
                user_id=user_id,
                project_id=project_id,
                activity_type=ActivityType.PROJECT_CREATED,
                description=f"Created project '{project_data['name']}'"
            )

            # Get created project with board info
            created_project = await db["projects"].find_one({"_id": project_id})

            return {
                "id": str(project_id),
                "name": created_project["name"],
                "slug": created_project["slug"],
                "description": created_project.get("description"),
                "color": created_project.get("color"),
                "status": created_project["status"],
                "organization_id": str(created_project["organization_id"]),
                "owner_id": str(created_project["owner_id"]),
                "members": [str(m) for m in created_project["members"]],
                "default_board_id": str(board_id),
                "created_at": created_project["created_at"],
                "updated_at": created_project.get("updated_at"),
                "start_date": created_project.get("start_date"),
                "end_date": created_project.get("end_date"),
                "settings": created_project.get("settings", {}),
                "tags": created_project.get("tags", []),
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to create project: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create project: {str(e)}"
            )

    @staticmethod
    async def get_project(
        user_id: ObjectId,
        organization_id: ObjectId,
        project_slug: str
    ) -> Dict[str, Any]:
        """Get project by slug"""
        try:
            # Verify user access
            await ProjectService.verify_user_access(user_id, organization_id)

            # Find project
            project = await db["projects"].find_one({
                "slug": project_slug,
                "organization_id": organization_id,
                "archived": False
            })

            if not project:
                raise HTTPException(
                    status_code=404, detail="Project not found")

            # Check if user is project member
            if user_id not in project.get("members", []):
                raise HTTPException(
                    status_code=403,
                    detail="Access denied: Not a project member"
                )

            # Get project statistics
            stats = await ProjectService._get_project_stats(project["_id"])

            # Get default board
            default_board = await db["boards"].find_one({
                "project_id": project["_id"],
                "is_default": True
            })

            return {
                "id": str(project["_id"]),
                "name": project["name"],
                "slug": project["slug"],
                "description": project.get("description"),
                "color": project["color"],
                "status": project["status"],
                "organization_id": str(project["organization_id"]),
                "owner_id": str(project["owner_id"]),
                "members": [str(m) for m in project["members"]],
                "start_date": project.get("start_date"),
                "end_date": project.get("end_date"),
                "settings": project.get("settings", {}),
                "tags": project.get("tags", []),
                "default_board_id": str(default_board["_id"]) if default_board else None,
                "stats": stats,
                "created_at": project["created_at"],
                "updated_at": project["updated_at"]
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get project: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to get project: {str(e)}"
            )

    @staticmethod
    async def update_project(
        user_id: ObjectId,
        organization_id: ObjectId,
        project_slug: str,
        project_data: ProjectUpdate
    ) -> Dict[str, Any]:
        """Update project"""
        try:
            # Verify user access
            access = await ProjectService.verify_user_access(user_id, organization_id)

            # Find project
            project = await db["projects"].find_one({
                "slug": project_slug,
                "organization_id": organization_id,
                "archived": False
            })

            if not project:
                raise HTTPException(
                    status_code=404, detail="Project not found")

            # Check permissions (owner or manager can update)
            if project["owner_id"] != user_id and not access["can_manage"]:
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions to update project"
                )

            # Prepare update data
            update_data = {}
            if project_data.name is not None:
                update_data["name"] = project_data.name
            if project_data.description is not None:
                update_data["description"] = project_data.description
            if project_data.color is not None:
                update_data["color"] = project_data.color
            if project_data.status is not None:
                update_data["status"] = project_data.status
            if project_data.end_date is not None:
                update_data["end_date"] = project_data.end_date
            if project_data.settings is not None:
                update_data["settings"] = {
                    "public": project_data.settings.public,
                    "allow_comments": project_data.settings.allow_comments,
                    "auto_assign": project_data.settings.auto_assign,
                    "default_assignee": project_data.settings.default_assignee
                }

            update_data["updated_at"] = datetime.utcnow()

            # Update project
            await db["projects"].update_one(
                {"_id": project["_id"]},
                {"$set": update_data}
            )

            # Log activity
            await ProjectService._log_activity(
                user_id=user_id,
                project_id=project["_id"],
                activity_type=ActivityType.PROJECT_UPDATED,
                description=f"Updated project '{project['name']}'"
            )

            # Return updated project
            return await ProjectService.get_project(user_id, organization_id, project_slug)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to update project: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update project: {str(e)}"
            )

    @staticmethod
    async def list_projects(
        user_id: ObjectId,
        organization_id: ObjectId,
        status: Optional[ProjectStatus] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """List projects in organization"""
        try:
            # Verify user access
            await ProjectService.verify_user_access(user_id, organization_id)

            # Build query
            query = {
                "organization_id": organization_id,
                "members": user_id,  # User must be a member
                "archived": False
            }

            if status:
                query["status"] = status

            # Get total count
            total = await db["projects"].count_documents(query)

            # Get projects
            projects = await db["projects"].find(query)\
                .sort("updated_at", -1)\
                .skip(offset)\
                .limit(limit)\
                .to_list(length=None)

            # Enrich with stats
            enriched_projects = []
            for project in projects:
                stats = await ProjectService._get_project_stats(project["_id"])

                enriched_projects.append({
                    "id": str(project["_id"]),
                    "name": project["name"],
                    "slug": project["slug"],
                    "description": project.get("description"),
                    "color": project["color"],
                    "status": project["status"],
                    "owner_id": str(project["owner_id"]),
                    "members_count": len(project["members"]),
                    "stats": stats,
                    "created_at": project["created_at"],
                    "updated_at": project["updated_at"]
                })

            return {
                "projects": enriched_projects,
                "total": total,
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to list projects: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to list projects: {str(e)}"
            )

    @staticmethod
    async def add_project_members(
        user_id: ObjectId,
        organization_id: ObjectId,
        project_slug: str,
        member_ids: List[ObjectId]
    ) -> Dict:
        """Add multiple members to project"""
        try:
            # Verify user access
            access = await ProjectService.verify_user_access(user_id, organization_id)

            # Find project
            project = await db["projects"].find_one({
                "slug": project_slug,
                "organization_id": organization_id,
                "archived": False
            })

            if not project:
                raise HTTPException(
                    status_code=404, detail="Project not found")

            # Check permissions
            if project["owner_id"] != user_id and not access["can_manage"]:
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions to add members"
                )

            added_members = []
            failed_members = []

            # Process each member
            for member_id in member_ids:
                try:
                    # Verify member exists and is in organization
                    member = await db["users"].find_one({"_id": member_id})
                    if not member:
                        failed_members.append({
                            "member_id": str(member_id),
                            "reason": "User not found"
                        })
                        continue

                    member_orgs = member.get("organizations", [])
                    is_org_member = any(
                        org["organization_id"] == organization_id
                        and org.get("status") == "active"
                        for org in member_orgs
                    )

                    if not is_org_member:
                        failed_members.append({
                            "member_id": str(member_id),
                            "reason": "User is not a member of the organization"
                        })
                        continue

                    # Check if already a project member
                    if member_id in project.get("members", []):
                        failed_members.append({
                            "member_id": str(member_id),
                            "reason": "User is already a project member"
                        })
                        continue

                    # Add to project members
                    result = await db["projects"].update_one(
                        {"_id": project["_id"]},
                        {"$addToSet": {"members": member_id}}
                    )

                    # Add joined_projects entry
                    joined_project_info = {
                        "project_id": project["_id"],
                        "role": UserRole.MEMBER,
                        "status": "active",
                        "joined_at": datetime.utcnow(),
                        "invited_by": user_id
                    }

                    await db["users"].update_one(
                        {"_id": member_id},
                        {"$addToSet": {"joined_projects": joined_project_info}}
                    )

                    # Log activity
                    await ProjectService._log_activity(
                        user_id=user_id,
                        project_id=project["_id"],
                        activity_type=ActivityType.USER_JOINED,
                        target_user_id=member_id,
                        description=f"Added {member['name']} to project"
                    )

                    # Build member response
                    member_response = {
                        "id": str(member["_id"]),
                        "name": member.get("name"),
                        "email": member.get("email"),
                        "avatar": member.get("avatar_url") if member.get("avatar_url") else ProjectService.get_initials(member.get("name", "")),
                        "role": joined_project_info.get("role"),
                        "status": joined_project_info.get("status"),
                        "joined_at": joined_project_info.get("joined_at"),
                    }

                    added_members.append(member_response)

                except Exception as e:
                    failed_members.append({
                        "member_id": str(member_id),
                        "reason": str(e)
                    })

            return {
                "added": added_members,
                "failed": failed_members,
                "summary": {
                    "total_processed": len(member_ids),
                    "successfully_added": len(added_members),
                    "failed_to_add": len(failed_members)
                }
            }

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to add members: {str(e)}")

    @staticmethod
    def get_initials(name: str) -> str:
        if not name:
            return ""
        parts = name.strip().split()
        initials = "".join([p[0].upper() for p in parts if p])
        return initials[:2]

    @staticmethod
    async def get_project_members_by_slug(
        user_id: ObjectId,
        organization_id: ObjectId,
        project_slug: str
    ) -> List[Dict[str, Any]]:
        """Get project members by project slug, include role, status, joined_at"""
        # Verify user access
        await ProjectService.verify_user_access(user_id, organization_id)

        project = await db["projects"].find_one({
            "slug": project_slug,
            "organization_id": organization_id,
            "archived": False
        })

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        member_ids = project.get("members", [])
        members = await db["users"].find({"_id": {"$in": member_ids}}).to_list(length=None)

        result = []
        for m in members:
            # Cari info project user
            user_proj_info = next(
                (proj for proj in m.get("joined_projects", [])
                 if proj.get("project_id") == project["_id"]),
                {}
            )
            result.append({
                "id": str(m["_id"]),
                "name": m.get("name"),
                "email": m.get("email"),
                "avatar": m.get("avatar_url") if m.get("avatar_url") else ProjectService.get_initials(m.get("name", "")),
                "role": user_proj_info.get("role"),
                "status": user_proj_info.get("status"),
                "joined_at": user_proj_info.get("joined_at"),
            })
        return result

    @staticmethod
    async def _get_project_stats(project_id: ObjectId) -> Dict[str, Any]:
        """Get project statistics"""
        try:
            # Task counts by status
            pipeline = [
                {"$match": {"project_id": project_id, "archived": False}},
                {"$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }}
            ]

            status_counts = await db["tasks"].aggregate(pipeline).to_list(length=None)

            stats = {
                "total_tasks": 0,
                "completed_tasks": 0,
                "in_progress_tasks": 0,
                "todo_tasks": 0,
                "overdue_tasks": 0,
                "completion_rate": 0.0
            }

            for item in status_counts:
                status = item["_id"]
                count = item["count"]
                stats["total_tasks"] += count

                if status == "done" or status == "completed":
                    stats["completed_tasks"] = count
                elif status == "in_progress" or status == "in-progress":
                    stats["in_progress_tasks"] = count
                elif status == "todo":
                    stats["todo_tasks"] = count

            # Calculate overdue tasks
            overdue_count = await db["tasks"].count_documents({
                "project_id": project_id,
                "due_date": {"$lt": datetime.utcnow()},
                "status": {"$nin": ["done", "completed"]},
                "archived": False
            })
            stats["overdue_tasks"] = overdue_count

            # Calculate completion rate
            if stats["total_tasks"] > 0:
                stats["completion_rate"] = round(
                    (stats["completed_tasks"] / stats["total_tasks"]) * 100, 1
                )

            return stats

        except Exception as e:
            logger.error(f"Failed to get project stats: {str(e)}")
            return {
                "total_tasks": 0,
                "completed_tasks": 0,
                "in_progress_tasks": 0,
                "todo_tasks": 0,
                "overdue_tasks": 0,
                "completion_rate": 0.0
            }

    @staticmethod
    async def get_sidebar_projects(
        user_id: ObjectId,
        organization_id: ObjectId
    ) -> List[Dict[str, Any]]:
        """Get up to 4 active projects for sidebar display, including task count"""
        try:
            query = {
                "organization_id": organization_id,
                "members": user_id,
                "status": ProjectStatus.ACTIVE,
                "archived": False
            }
            projects = await db["projects"].find(query).sort("updated_at", -1).limit(4).to_list(length=4)
            sidebar_projects = []
            for p in projects:
                task_count = await db["tasks"].count_documents({"project_id": p["_id"], "archived": False})
                sidebar_projects.append({
                    "id": str(p["_id"]),
                    "name": p["name"],
                    "slug": p["slug"],
                    "color": p.get("color"),
                    "organization_id": str(p["organization_id"]),
                    "task_count": task_count
                })
            return sidebar_projects
        except Exception as e:
            logger.error(f"Failed to get sidebar projects: {str(e)}")
            return []

    @staticmethod
    async def _log_activity(
        user_id: ObjectId,
        project_id: ObjectId,
        activity_type: ActivityType,
        description: str,
        target_user_id: Optional[ObjectId] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log project activity"""
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
