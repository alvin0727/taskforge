from motor.motor_asyncio import AsyncIOMotorClient
from app.config.config import MONGO_URI, MONGO_DB_NAME

client = AsyncIOMotorClient(MONGO_URI)
db = client[MONGO_DB_NAME]

def get_db():
    return db