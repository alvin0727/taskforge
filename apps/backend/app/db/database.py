from motor.motor_asyncio import AsyncIOMotorClient
from app.config.config import MONGO_URI, MONGO_DB_NAME

client = AsyncIOMotorClient(MONGO_URI)
db = client[MONGO_DB_NAME]


async def ensure_indexes():
    """Create all database indexes"""
    # Existing indexes
    await db["users"].create_index([("email", 1)], unique=True)
    await db["verification_tokens"].create_index([("user_id", 1), ("type", 1)])
    await db["verification_tokens"].create_index([("expires_at", 1)], expireAfterSeconds=0)

    # New indexes for TaskForge
    # User indexes
    await db["users"].create_index("organization_id")
    await db["users"].create_index("role")

    # Organization indexes
    await db["organizations"].create_index("slug", unique=True)
    await db["organizations"].create_index("owner_id")

    # Project indexes
    await db["projects"].create_index("organization_id")
    await db["projects"].create_index("owner_id")
    await db["projects"].create_index([("organization_id", 1), ("slug", 1)], unique=True)
    await db["projects"].create_index("status")
    await db["projects"].create_index("updated_at")

    # Task indexes
    await db["tasks"].create_index("project_id")
    await db["tasks"].create_index("assignee_id")
    await db["tasks"].create_index("creator_id")
    await db["tasks"].create_index("status")
    await db["tasks"].create_index("priority")
    await db["tasks"].create_index("due_date")
    await db["tasks"].create_index([("project_id", 1), ("status", 1)])
    await db["tasks"].create_index([("assignee_id", 1), ("status", 1)])
    await db["tasks"].create_index([("board_id", 1), ("column_id", 1), ("position", 1)])

    # Board indexes
    await db["boards"].create_index("project_id")
    await db["boards"].create_index([("project_id", 1), ("is_default", 1)])

    # Activity indexes
    await db["activities"].create_index("user_id")
    await db["activities"].create_index("project_id")
    await db["activities"].create_index("created_at")
    await db["activities"].create_index([("project_id", 1), ("created_at", -1)])
    await db["activities"].create_index([("user_id", 1), ("created_at", -1)])

    # Notification indexes
    await db["notifications"].create_index("recipient_id")
    await db["notifications"].create_index([("recipient_id", 1), ("read", 1)])
    await db["notifications"].create_index("created_at")

    # Calendar event indexes
    await db["calendar_events"].create_index("start_time")
    await db["calendar_events"].create_index("project_id")
    await db["calendar_events"].create_index("creator_id")
    await db["calendar_events"].create_index("attendees")

    # Stats indexes
    await db["project_stats"].create_index([("project_id", 1), ("date", 1)], unique=True)
    await db["user_stats"].create_index([("user_id", 1), ("date", 1)], unique=True)

    # Favorites indexes
    await db["user_favorites"].create_index([("user_id", 1), ("item_type", 1), ("item_id", 1)], unique=True)

    # Organization Invitation indexes
    await db["organization_invitations"].create_index([("token", 1)], unique=True)
    await db["organization_invitations"].create_index([("email", 1)])
    await db["organization_invitations"].create_index([("organization_id", 1)])


def get_db():
    return db
