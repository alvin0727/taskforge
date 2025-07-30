from bson import ObjectId
from app.db.database import db
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from app.utils.logger import logger
from passlib.context import CryptContext
from app.services.email_service import generate_verification_token, send_verification_email
from app.services.otp_service import generate_otp, send_otp_email
from app.models.user import User
from app.models.verification_token import VerificationToken, OTPMetadata
from fastapi import HTTPException

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
        raise

async def resendVerificationEmail(email: str) -> bool:
    """
    Resend the verification email to the user.
    Args:
        email (str): The email of the user.
    Returns:
        bool: True if the email was resent successfully, False otherwise.
    """
    try:
        user = await db["users"].find_one({"email": email})
        if not user or user.get("is_verified", False):
            logger.warning(f"User not found or already verified: {email}")
            return False

        # Delete any existing verification tokens for this user
        await db["verification_tokens"].delete_many({"user_id": str(user["_id"])})
        
        token = generate_verification_token()
        verification_token = VerificationToken(
            user_id=str(user["_id"]),
            token=token,
            type="email_verification",
            expiresAt=datetime.now(ZoneInfo("Asia/Jakarta")) + timedelta(hours=24),  # Token valid for 24 hours
        )
        await db["verification_tokens"].insert_one(verification_token.model_dump(by_alias=True))
        await send_verification_email(email, token)
        logger.info(f"Verification email resent to: {email}")
        return True
    except Exception as e:
        logger.error(f"Error resending verification email: {e}")
        return False
    
async def login(email: str, password: str) -> str:
    """
    Log in a user with email and password.
    Args:
        email (str): The email of the user.
        password (str): The password of the user.
    Returns:
        _id: The ID of the logged-in user.
    """
    try:
        user = await db["users"].find_one({"email": email})
        if not user or not pwd_context.verify(password, user["password"]):
            logger.warning(f"Login failed for email: {email}")
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Check if user is currently blocked from OTP requests
        existing_otp_token = await db["verification_tokens"].find_one({
            "user_id": str(user["_id"]),
            "type": "otp",
            "otpMetadata.isBlocked": True,
            "otpMetadata.blockUntil": {"$gt": datetime.now(ZoneInfo("Asia/Jakarta"))}
        })

        if existing_otp_token:
            block_until = existing_otp_token["otpMetadata"]["blockUntil"]
            now = datetime.utcnow()
            if block_until.tzinfo is not None:
                block_until = block_until.replace(tzinfo=None)
            block_time_left = -(-int((block_until - now).total_seconds()) // 60)  # ceil division
            if block_time_left > 0:
                raise HTTPException(
                    status_code=429,
                    detail={
                        "message": f"Too many failed attempts. Please try again in {block_time_left} minutes.",
                        "blockTimeLeft": block_time_left
                    }
                )
        existing_otp_token = await db["verification_tokens"].find_one({
            "user_id": str(user["_id"]),
            "type": "otp"
        })

        otp = generate_otp()
        expires_at = datetime.now(ZoneInfo("Asia/Jakarta")) + timedelta(minutes=5)  # OTP valid for 5 minutes

        if existing_otp_token:
            await db["verification_tokens"].update_one(
                {"_id": existing_otp_token["_id"]},
                {"$set": {"token": otp}}
            )
        else:
            otp_token = VerificationToken(
                user_id=str(user["_id"]),
                token=otp,
                type="otp",
                otpMetadata=OTPMetadata(
                    attempts=0,
                    maxAttempts=3,
                    lastAttempt=None,
                    isBlocked=False,
                    blockUntil=None,
                ),
                expires_at=expires_at
            )
            await db["verification_tokens"].insert_one(otp_token.model_dump(by_alias=True))

        await send_otp_email(email, otp)
        logger.info(f"OTP sent to email: {email}")
        return str(user["_id"])
    except HTTPException:
        raise 
    except Exception as e:
        logger.error(f"Error logging in user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

