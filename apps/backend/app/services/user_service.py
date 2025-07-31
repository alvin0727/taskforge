from bson import ObjectId
from app.db.database import db
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from app.utils.logger import logger
from passlib.context import CryptContext
from app.services.email_service import generate_verification_token, send_verification_email
from app.services.otp_service import generate_otp, send_otp_email
from app.models.user import User
from app.models.verification_token import Verification_Token, OTPMetadata
from fastapi import HTTPException, Response
import app.utils.token_manager as token_manager
import app.api.dependencies as dependencies

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)

async def register_user(email: str, name: str, password: str) -> str:
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
            raise HTTPException(status_code=400, detail="Email already registered")

        user = User(
            email=email,
            name=name,
            password=hash_password(password),
        )
        result = await db["users"].insert_one(user.model_dump(by_alias=True))

        token = generate_verification_token()
        verification_token = Verification_Token(
            user_id=str(result.inserted_id),
            token=token,
            type="email_verification",
            expiresAt=datetime.now(ZoneInfo("Asia/Jakarta")) + timedelta(hours=24),  # Token valid for 24 hours
        )
        result = await db["verification_tokens"].insert_one(verification_token.model_dump(by_alias=True))
        await send_verification_email(email, token)
        logger.info(f"User registered successfully with ID: {result.inserted_id}")
        return str(result.inserted_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise

async def verify_email(token: str) -> bool:
    """
    Verify the email address of a user using the verification token.
    Args:
        token (str): The verification token.
    Returns:
        bool: True if the email is verified, False otherwise.
    """
    try:
        Verification_Token = await db["verification_tokens"].find_one({"token": token})
        if not Verification_Token:
            logger.warning(f"Invalid verification token: {token}")
            raise HTTPException(status_code=400, detail="Invalid or expired token")

        await db["users"].update_one({"_id": ObjectId(Verification_Token["user_id"])}, {"$set": {"is_verified": True}})
        await db["verification_tokens"].delete_one({"_id": ObjectId(Verification_Token["_id"])})
        logger.info(f"Email verified successfully for user ID: {Verification_Token['user_id']}")
        return True
    except HTTPException:
        raise 
    except Exception as e:
        logger.error(f"Error verifying email: {e}")
        return False

async def resend_verification_email(email: str) -> bool:
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
            raise HTTPException(status_code=404, detail="User not found")

        # Delete any existing verification tokens for this user
        await db["verification_tokens"].delete_many({"user_id": str(user["_id"])})
        
        token = generate_verification_token()
        verification_token = Verification_Token(
            user_id=str(user["_id"]),
            token=token,
            type="email_verification",
            expiresAt=datetime.now(ZoneInfo("Asia/Jakarta")) + timedelta(hours=24),  # Token valid for 24 hours
        )
        await db["verification_tokens"].insert_one(verification_token.model_dump(by_alias=True))
        await send_verification_email(email, token)
        logger.info(f"Verification email resent to: {email}")
        return True
    except HTTPException:
        raise 
    except Exception as e:
        logger.error(f"Error resend verification email: {e}")
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
            otp_token = Verification_Token(
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
        return True
    except HTTPException:
        raise 
    except Exception as e:
        logger.error(f"Error logging in user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def verify_otp(email: str, otp: str, response: Response) -> bool:
    try:
        user = await db["users"].find_one({"email": email})
        if not user:
            logger.warning(f"User not found for email: {email}")
            raise HTTPException(status_code=404, detail="User not found")
        
        
        verification_token = await db["verification_tokens"].find_one({
            "user_id": str(user["_id"]),
            "type": "otp"
        })
        
        if not verification_token:
            logger.warning(f"Invalid OTP for email: {email}")
            raise HTTPException(status_code=400, detail="Invalid OTP, not found or expired")

        if verification_token["otpMetadata"]["isBlocked"] and verification_token["otpMetadata"]["blockUntil"] > datetime.utcnow():
            block_until = verification_token["otpMetadata"]["blockUntil"]
            now = datetime.utcnow()
            block_time_left = -(-int((block_until - now).total_seconds()) // 60)  # ceil division
            if block_time_left > 0:
                raise HTTPException(
                    status_code=429,
                    detail={
                        "message": f"Too many failed attempts. Please try again in {block_time_left} minutes.",
                        "blockTimeLeft": block_time_left
                    }
                )
        
        # Check if OTP is valid
        if verification_token["token"] != otp:
            logger.info(f"OTP for email: {otp}")
            verification_token["otpMetadata"]["attempts"] += 1
            verification_token["otpMetadata"]["lastAttempt"] = datetime.utcnow()
            
            # Check if attempts exceed max allowed
            if verification_token["otpMetadata"]["attempts"] >= verification_token["otpMetadata"]["maxAttempts"]:
                verification_token["otpMetadata"]["isBlocked"] = True
                verification_token["otpMetadata"]["blockUntil"] = datetime.utcnow() + timedelta(minutes=15)
                verification_token["expires_at"] = datetime.utcnow() + timedelta(minutes=15)
            
            remaining_attempts = verification_token["otpMetadata"]["maxAttempts"] - verification_token["otpMetadata"]["attempts"]
            await db["verification_tokens"].update_one(
                {"_id": verification_token["_id"]},
                {
                    "$set": {
                        "otpMetadata": verification_token["otpMetadata"],
                        "expires_at": verification_token["expires_at"]
                    }
                }
            )
            
            if verification_token["otpMetadata"]["isBlocked"]:
                logger.warning(f"User {email} blocked due to too many failed OTP attempts")
                raise HTTPException(
                    status_code=429, 
                    detail={
                        "message": "Too many failed attempts. You have been blocked for 15 minutes.",
                    })
            else:
                logger.warning(f"Invalid OTP for email: {email}")
                raise HTTPException(
                    status_code=400,
                    detail={
                        "message": "Invalid OTP",
                        "remaining_attempts": remaining_attempts
                    }
                )

        # If OTP is valid, reset attempts and remove the token
        await db["verification_tokens"].delete_one({"_id": verification_token["_id"]})
        
        # Clear old cookies
        await dependencies.clear_auth_cookie(response)
        
        # Create a new token for the user
        token = token_manager.create_token(
            str(user["_id"]),
            email,
            user.get("is_verified", False)
        )        
        # Set new cookies
        await dependencies.set_auth_cookie(response, token)
        return user
    except HTTPException:
        raise 
    except Exception as e:
        logger.error(f"Error logging in user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
async def resend_otp(email: str) -> bool:
    """
    Resend the OTP to the user's email.
    Args:
        email (str): The email of the user.
    Returns:
        bool: True if the OTP was resent successfully, False otherwise.
    """
    try:
        user = await db["users"].find_one({"email": email})
        if not user:
            logger.warning(f"User not found for email: {email}")
            raise HTTPException(status_code=404, detail="User not found")
        
        
        existing_token = await db["verification_tokens"].find_one({
            "user_id": str(user["_id"]),
            "type": "otp"
        })

        if not existing_token:
            logger.warning(f"Invalid OTP for email: {email}")
            raise HTTPException(status_code=400, detail="Invalid OTP, not found or expired")

        if existing_token["otpMetadata"]["isBlocked"] and existing_token["otpMetadata"]["blockUntil"] > datetime.utcnow():
            block_until = existing_token["otpMetadata"]["blockUntil"]
            now = datetime.utcnow()
            block_time_left = -(-int((block_until - now).total_seconds()) // 60)  # ceil division
            if block_time_left > 0:
                raise HTTPException(
                    status_code=429,
                    detail={
                        "message": f"Too many failed attempts. Please try again in {block_time_left} minutes.",
                        "blockTimeLeft": block_time_left
                    }
                )
        
        if existing_token and "otpMetadata" in existing_token and existing_token["otpMetadata"].get("lastGenerated"):
            last_generated = existing_token["otpMetadata"]["lastGenerated"]
            now_utc = datetime.utcnow()
            if last_generated.tzinfo is not None:
                last_generated = last_generated.replace(tzinfo=None)
            time_since_last_otp = (now_utc - last_generated).total_seconds()
            one_minute_in_seconds = 60

            if time_since_last_otp < one_minute_in_seconds:
                wait_time = int(one_minute_in_seconds - time_since_last_otp)
                logger.warning(f"User {email} exceeded resend rate limit")
                raise HTTPException(
                    status_code=429,
                    detail={
                        "message": f"Please wait {wait_time} seconds before requesting a new OTP.",
                        "waitTime": wait_time
                    }
                )
        
        otp = generate_otp()
        
        if existing_token:
            # Update existing token with new OTP and expiry, preserve metadata but update lastGenerated
            update_fields = {
                "token": otp,
                "otpMetadata.lastGenerated": datetime.now(ZoneInfo("Asia/Jakarta")),
            }
            await db["verification_tokens"].update_one(
                {"_id": existing_token["_id"]},
                {"$set": update_fields}
            )
        return True
    except HTTPException:
        raise 
    except Exception as e:
        logger.error(f"Error resending OTP: {e}")
        return False
