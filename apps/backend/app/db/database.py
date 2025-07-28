from motor.motor_asyncio import AsyncIOMotorClient
from app.config.config import MONGO_URI, MONGO_DB_NAME

client = AsyncIOMotorClient(MONGO_URI)
db = client[MONGO_DB_NAME]

async def ensure_indexes():
    await db["tasks"].create_index(
        [("workflow_id", 1), ("status", 1), ("order", 1)],
        unique=True
    )
    await db["users"].create_index(
        [("email", 1)],
        unique=True
    )
    await db["verification_tokens"].create_index(
        [("userId", 1), ("type", 1)]
    )
    await db["verification_tokens"].create_index(
        [("token", 1)],
        unique=True
    )
    await db["verification_tokens"].create_index(
        [("expiresAt", 1)],
        expireAfterSeconds=0
    )

def get_db():
    return db