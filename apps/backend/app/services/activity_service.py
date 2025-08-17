from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from fastapi import HTTPException
from app.db.database import get_db
from app.db.enums import ActivityType
from app.utils.logger import logger

db = get_db()


class ActivityService:
    @staticmethod
    async def get_organization_activities(
        user_id: ObjectId,
        organization_id: ObjectId,
        limit: int = 20,
        offset: int = 0,
        search: str = None,
        project_id: Optional[ObjectId] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        user_filter_id: Optional[ObjectId] = None
    ) -> Dict[str, Any]:
        """Get all activities in organization with pagination and filtering"""
        try:
            # Verify user has access to organization
            user = await db["users"].find_one({"_id": user_id})
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            user_orgs = user.get("organizations", [])
            is_org_member = any(
                org["organization_id"] == organization_id
                and org.get("status") == "active"
                for org in user_orgs
            )

            if not is_org_member:
                raise HTTPException(
                    status_code=403,
                    detail="User not member of organization or access denied"
                )

            # Get all projects in organization that user has access to
            user_project_ids = []
            user_projects = user.get("joined_projects", [])
            for proj in user_projects:
                if proj.get("status") == "active":
                    # Verify project belongs to organization
                    project = await db["projects"].find_one({
                        "_id": proj["project_id"],
                        "organization_id": organization_id
                    })
                    if project:
                        user_project_ids.append(proj["project_id"])

            if not user_project_ids:
                return {
                    "activities": [],
                    "total": 0,
                    "limit": limit,
                    "offset": offset,
                    "has_more": False
                }

            # Build aggregation pipeline
            pipeline = []

            # Match stage - base filter
            match_filter = {}

            # Filter by projects user has access to
            if project_id:
                # Verify user has access to this specific project
                if project_id not in user_project_ids:
                    raise HTTPException(
                        status_code=403,
                        detail="Access denied to this project"
                    )
                match_filter["project_id"] = project_id
            else:
                match_filter["project_id"] = {"$in": user_project_ids}

            if user_filter_id:
                match_filter["user_id"] = user_filter_id
                
            if search:
                match_filter["description"] = {"$regex": search, "$options": "i"}

            if date_from or date_to:
                date_filter = {}
                if date_from:
                    date_filter["$gte"] = date_from
                if date_to:
                    date_filter["$lte"] = date_to
                match_filter["created_at"] = date_filter

            pipeline.append({"$match": match_filter})

            # Lookup user details
            pipeline.append({
                "$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "_id",
                    "as": "user_info"
                }
            })

            # Add user name field
            pipeline.append({
                "$addFields": {
                    "user_name": {"$arrayElemAt": ["$user_info.name", 0]},
                    "user_avatar": {"$arrayElemAt": ["$user_info.avatar_url", 0]}
                }
            })

            # Sort by created_at descending (newest first)
            pipeline.append({"$sort": {"created_at": -1}})

            # Get total count for pagination (before skip/limit)
            count_pipeline = pipeline.copy()
            count_pipeline.append({"$count": "total"})
            count_result = await db["activities"].aggregate(count_pipeline).to_list(length=None)
            total = count_result[0]["total"] if count_result else 0

            # Add pagination
            pipeline.extend([
                {"$skip": offset},
                {"$limit": limit}
            ])

            # Project only needed fields
            pipeline.append({
                "$project": {
                    "_id": 1,
                    "type": 1,
                    "description": 1,
                    "user_name": 1,
                    "user_avatar": 1,
                    "created_at": 1
                }
            })

            # Execute aggregation
            activities = await db["activities"].aggregate(pipeline).to_list(length=None)

            # Format response according to specified format
            formatted_activities = []
            for activity in activities:
                # Generate user initials if no avatar
                user_name = activity.get("user_name", "")
                avatar = activity.get(
                    "user_avatar") or ActivityService._get_initials(user_name)

                formatted_activities.append({
                    "id": str(activity["_id"]),
                    "user": user_name,
                    "avatar": avatar,
                    "item": activity.get("description", ""),
                    "created_at": activity["created_at"]
                })

            return {
                "activities": formatted_activities,
                "total": total,
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get organization activities: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to get organization activities: {str(e)}"
            )

    @staticmethod
    def _get_initials(name: str) -> str:
        """Generate initials from name"""
        if not name:
            return ""
        parts = name.strip().split()
        initials = "".join([p[0].upper() for p in parts if p])
        return initials[:2]
