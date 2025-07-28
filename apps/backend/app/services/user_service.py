from bson import ObjectId
from app.db.database import db
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from app.utils.logger import logger
from passlib.context import CryptContext
from app.services.email_service import generate_verification_token, send_verification_email
from app.models.user import User
from app.models.verification_token import VerificationToken

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)

async def registerUser(email: str, name: str, password: str) -> str:
    """
    Register a new user with email, name, and password.
    Args:
        email (str): The email of the user.
        name (str): The name of the user.
        password (str): The password of the user.
    Returns:
        _id: The ID of the newly created user.
    """
    try:
        existingUser = await db["users"].find_one({"email": email})
        if existingUser:
            raise ValueError("Email already registered")

        user = User(
            email=email,
            name=name,
            password=hash_password(password),
        )
        result = await db["users"].insert_one(user.model_dump(by_alias=True))

        token = generate_verification_token()
        verification_token = VerificationToken(
            user_id=str(result.inserted_id),
            token=token,
            type="email_verification",
            expiresAt=datetime.now(ZoneInfo("Asia/Jakarta")) + timedelta(hours=24),  # Token valid for 24 hours
        )
        result = await db["verification_tokens"].insert_one(verification_token.model_dump(by_alias=True))
        await send_verification_email(email, token)
        logger.info(f"User registered successfully with ID: {result.inserted_id}")
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise

async def verifyEmail(token: str) -> bool:
    """
    Verify the email address of a user using the verification token.
    Args:
        token (str): The verification token.
    Returns:
        bool: True if the email is verified, False otherwise.
    """
    try:
        verificationToken = await db["verification_tokens"].find_one({"token": token})
        if not verificationToken:
            logger.warning(f"Invalid verification token: {token}")
            raise ValueError("Invalid or expired verification token")

        await db["users"].update_one({"_id": ObjectId(verificationToken["user_id"])}, {"$set": {"is_verified": True}})
        await db["verification_tokens"].delete_one({"_id": ObjectId(verificationToken["_id"])})
        logger.info(f"Email verified successfully for user ID: {verificationToken['user_id']}")
        return True
    except Exception as e:
        logger.error(f"Error verifying email: {e}")
        return False
