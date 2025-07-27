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

def get_db():
    return db