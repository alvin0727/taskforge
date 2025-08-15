from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from bson import ObjectId
from app.db.database import get_db
from app.utils.logger import logger

db = get_db()

class AIRateLimitService:
    """Service untuk handle rate limiting AI requests"""
    
    # Rate limit configurations
    DAILY_LIMITS = {
        "generate_description": 2,  # 2 generates per day
        "enhance_description": 2,   # 2 enhancements per day
    }
    
    @staticmethod
    def _get_current_date() -> str:
        """Get current date in YYYY-MM-DD format (UTC)"""
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    @staticmethod
    def _get_tomorrow_midnight() -> datetime:
        """Get tomorrow midnight UTC for TTL expiration"""
        now = datetime.now(timezone.utc)
        tomorrow = now + timedelta(days=1)
        return tomorrow.replace(hour=0, minute=0, second=0, microsecond=0)
    
    @staticmethod
    async def check_rate_limit(user_id: ObjectId, action_type: str) -> Dict[str, Any]:
        """
        Check if user has exceeded rate limit for specific action
        
        Returns:
            {
                "allowed": bool,
                "remaining": int,
                "limit": int,
                "reset_time": datetime,
                "message": str
            }
        """
        try:
            if action_type not in AIRateLimitService.DAILY_LIMITS:
                raise ValueError(f"Invalid action type: {action_type}")
            
            limit = AIRateLimitService.DAILY_LIMITS[action_type]
            current_date = AIRateLimitService._get_current_date()
            reset_time = AIRateLimitService._get_tomorrow_midnight()
            
            # Find existing rate limit record
            rate_limit_doc = await db["ai_rate_limits"].find_one({
                "user_id": user_id,
                "action_type": action_type,
                "date": current_date
            })
            
            if not rate_limit_doc:
                # No existing record, user is within limit
                return {
                    "allowed": True,
                    "remaining": limit - 1,  # Will be 1 after this request
                    "limit": limit,
                    "reset_time": reset_time,
                    "message": f"Rate limit check passed. {limit - 1} requests remaining today."
                }
            
            current_count = rate_limit_doc.get("count", 0)
            
            if current_count >= limit:
                # Rate limit exceeded
                return {
                    "allowed": False,
                    "remaining": 0,
                    "limit": limit,
                    "reset_time": reset_time,
                    "message": f"Daily rate limit exceeded. You can use {action_type.replace('_', ' ')} {limit} times per day. Resets at midnight UTC."
                }
            
            # Within limit
            remaining = limit - current_count - 1  # -1 because this request will count
            return {
                "allowed": True,
                "remaining": remaining,
                "limit": limit,
                "reset_time": reset_time,
                "message": f"Rate limit check passed. {remaining} requests remaining today."
            }
            
        except Exception as e:
            logger.error(f"Error checking rate limit for user {user_id}, action {action_type}: {str(e)}")
            # On error, allow the request (fail open)
            return {
                "allowed": True,
                "remaining": 1,
                "limit": AIRateLimitService.DAILY_LIMITS.get(action_type, 2),
                "reset_time": AIRateLimitService._get_tomorrow_midnight(),
                "message": "Rate limit check failed, allowing request"
            }
    
    @staticmethod
    async def increment_usage(user_id: ObjectId, action_type: str) -> Dict[str, Any]:
        """
        Increment usage count for user and action type
        
        Returns:
            {
                "success": bool,
                "new_count": int,
                "remaining": int,
                "message": str
            }
        """
        try:
            if action_type not in AIRateLimitService.DAILY_LIMITS:
                raise ValueError(f"Invalid action type: {action_type}")
            
            limit = AIRateLimitService.DAILY_LIMITS[action_type]
            current_date = AIRateLimitService._get_current_date()
            expires_at = AIRateLimitService._get_tomorrow_midnight()
            
            # Upsert the rate limit document
            result = await db["ai_rate_limits"].find_one_and_update(
                {
                    "user_id": user_id,
                    "action_type": action_type,
                    "date": current_date
                },
                {
                    "$inc": {"count": 1},
                    "$setOnInsert": {
                        "user_id": user_id,
                        "action_type": action_type,
                        "date": current_date,
                        "created_at": datetime.now(timezone.utc),
                        "expires_at": expires_at
                    },
                    "$set": {
                        "updated_at": datetime.now(timezone.utc)
                    }
                },
                upsert=True,
                return_document=True
            )
            
            new_count = result["count"]
            remaining = max(0, limit - new_count)
            
            logger.info(f"AI usage incremented for user {user_id}, action {action_type}: {new_count}/{limit}")
            
            return {
                "success": True,
                "new_count": new_count,
                "remaining": remaining,
                "message": f"Usage recorded. {remaining} requests remaining today."
            }
            
        except Exception as e:
            logger.error(f"Error incrementing usage for user {user_id}, action {action_type}: {str(e)}")
            return {
                "success": False,
                "new_count": 0,
                "remaining": 0,
                "message": f"Failed to record usage: {str(e)}"
            }
    
    @staticmethod
    async def get_user_usage(user_id: ObjectId, action_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Get current usage for user
        
        Args:
            user_id: User ObjectId
            action_type: Specific action type, or None for all actions
            
        Returns:
            {
                "usage": dict,
                "limits": dict,
                "reset_time": datetime
            }
        """
        try:
            current_date = AIRateLimitService._get_current_date()
            reset_time = AIRateLimitService._get_tomorrow_midnight()
            
            query = {
                "user_id": user_id,
                "date": current_date
            }
            
            if action_type:
                query["action_type"] = action_type
            
            # Get all usage records for today
            usage_docs = await db["ai_rate_limits"].find(query).to_list(length=None)
            
            usage = {}
            for doc in usage_docs:
                action = doc["action_type"]
                usage[action] = {
                    "count": doc.get("count", 0),
                    "limit": AIRateLimitService.DAILY_LIMITS.get(action, 0),
                    "remaining": max(0, AIRateLimitService.DAILY_LIMITS.get(action, 0) - doc.get("count", 0))
                }
            
            # Add missing actions with 0 count
            for action, limit in AIRateLimitService.DAILY_LIMITS.items():
                if action not in usage:
                    usage[action] = {
                        "count": 0,
                        "limit": limit,
                        "remaining": limit
                    }
            
            return {
                "usage": usage,
                "limits": AIRateLimitService.DAILY_LIMITS,
                "reset_time": reset_time
            }
            
        except Exception as e:
            logger.error(f"Error getting usage for user {user_id}: {str(e)}")
            return {
                "usage": {},
                "limits": AIRateLimitService.DAILY_LIMITS,
                "reset_time": AIRateLimitService._get_tomorrow_midnight()
            }

# Create service instance
ai_rate_limit_service = AIRateLimitService()