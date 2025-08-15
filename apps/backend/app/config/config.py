from dotenv import load_dotenv
import os
from pathlib import Path

# Load .env di root backend
env_path = Path(__file__).resolve().parents[2] / '.env'
load_dotenv(dotenv_path=env_path)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "taskforge_db")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
SECRET_KEY = os.getenv("SECRET_KEY")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

# OpenAI API Settings
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_ORG_ID = os.getenv("OPENAI_ORGANIZATION_ID")

# OpenAI Model Settings (optional, has defaults)
OPENAI_DEFAULT_MODEL="gpt-4"
OPENAI_FALLBACK_MODEL="gpt-3.5-turbo"
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7

# Rate Limiting
AI_REQUESTS_PER_MINUTE=10
AI_REQUESTS_PER_HOUR=20

