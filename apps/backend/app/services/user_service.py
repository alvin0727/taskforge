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
from fastapi import HTTPException, Response
import app.utils.token_manager as token_manager
import app.api.dependencies as dependencies
from app.models.user import UserResponse, UserProfile, UserRole


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)

async def signup(email: str, name: str, password: str) -> str:
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
        existing_user = await db["users"].find_one({"email": email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        now = datetime.utcnow()

        user = User(
            email=email,
            name=name,
            password_hash=hash_password(password),
            created_at=now,
        )
        user_result = await db["users"].insert_one(user.model_dump(by_alias=True))

        token = generate_verification_token()
        verification_token = VerificationToken(
            user_id=user_result.inserted_id,  # PyObjectId
            token=token,
            type="email_verification",
            expires_at=now + timedelta(hours=24),
            created_at=now,
        )
        await db["verification_tokens"].insert_one(verification_token.model_dump(by_alias=True))
        await send_verification_email(email, token)
        logger.info(f"User registered successfully with ID: {user_result.inserted_id}")
        return str(user_result.inserted_id)
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
        verification_token = await db["verification_tokens"].find_one({"token": token})
        if not verification_token:
            logger.warning(f"Invalid verification token: {token}")
            raise HTTPException(status_code=400, detail="Invalid or expired token")

        await db["users"].update_one(
            {"_id": verification_token["user_id"]},
            {"$set": {"is_verified": True, "updated_at": datetime.utcnow()}}
        )
        await db["verification_tokens"].delete_one({"_id": verification_token["_id"]})
        logger.info(f"Email verified successfully for user ID: {verification_token['user_id']}")
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
        await db["verification_tokens"].delete_many({"user_id": user["_id"]})

        now = datetime.utcnow()
        token = generate_verification_token()
        verification_token = VerificationToken(
            user_id=user["_id"],
            token=token,
            type="email_verification",
            expires_at=now + timedelta(hours=24),
            created_at=now,
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
        if not user or not pwd_context.verify(password, user["password_hash"]):
            logger.warning(f"Login failed for email: {email}")
            raise HTTPException(status_code=401, detail={"message": "Invalid email or password"})

        # Check if user is currently blocked from OTP requests
        existing_otp_token = await db["verification_tokens"].find_one({
            "user_id": user["_id"],
            "type": "otp",
            "otp_metadata.is_blocked": True,
            "otp_metadata.block_until": {"$gt": datetime.utcnow()}
        })

        if existing_otp_token:
            block_until = existing_otp_token["otp_metadata"]["block_until"]
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
            "user_id": user["_id"],
            "type": "otp"
        })

        otp = generate_otp()
        expires_at = datetime.utcnow() + timedelta(minutes=5)  # OTP valid for 5 minutes

        if existing_otp_token:
            await db["verification_tokens"].update_one(
                {"_id": existing_otp_token["_id"]},
                {"$set": {"token": otp, "expires_at": expires_at}}
            )
        else:
            otp_token = VerificationToken(
                user_id=user["_id"],
                token=otp,
                type="otp",
                otp_metadata=OTPMetadata(
                    attempts=0,
                    max_attempts=3,
                    last_attempt=None,
                    is_blocked=False,
                    block_until=None,
                ),
                expires_at=expires_at,
                created_at=datetime.utcnow(),
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
            "user_id": user["_id"],
            "type": "otp"
        })

        if not verification_token:
            logger.warning(f"Invalid OTP for email: {email}")
            raise HTTPException(status_code=400, detail="Invalid OTP, not found or expired")

        otp_meta = verification_token.get("otp_metadata", {})
        if otp_meta.get("is_blocked") and otp_meta.get("block_until") and otp_meta["block_until"] > datetime.utcnow():
            block_until = otp_meta["block_until"]
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
            otp_meta["attempts"] = otp_meta.get("attempts", 0) + 1
            otp_meta["last_attempt"] = datetime.utcnow()

            # Check if attempts exceed max allowed
            if otp_meta["attempts"] >= otp_meta.get("max_attempts", 3):
                otp_meta["is_blocked"] = True
                otp_meta["block_until"] = datetime.utcnow() + timedelta(minutes=15)
                verification_token["expires_at"] = datetime.utcnow() + timedelta(minutes=15)

            remaining_attempts = otp_meta.get("max_attempts", 3) - otp_meta["attempts"]
            await db["verification_tokens"].update_one(
                {"_id": verification_token["_id"]},
                {
                    "$set": {
                        "otp_metadata": otp_meta,
                        "expires_at": verification_token["expires_at"]
                    }
                }
            )

            if otp_meta["is_blocked"]:
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

        # Ensure profile is a UserProfile instance
        profile = user.get("profile")
        if profile and not isinstance(profile, UserProfile):
            profile = UserProfile(**profile)

        response = UserResponse(
            id=str(user["_id"]),
            name=user["name"],
            email=user["email"],
            role=user.get("role", UserRole.MEMBER),
            profile=profile,
            is_active=user.get("is_active", True),
            created_at=user.get("created_at"),
            last_login=user.get("last_login"),
        )
        return {
            "message": "Login successful",
            "user": response.dict()
        }
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
            "user_id": user["_id"],
            "type": "otp"
        })

        if not existing_token:
            logger.warning(f"Invalid OTP for email: {email}")
            raise HTTPException(status_code=400, detail="Invalid OTP, not found or expired")

        otp_meta = existing_token.get("otp_metadata", {})
        if otp_meta.get("is_blocked") and otp_meta.get("block_until") and otp_meta["block_until"] > datetime.utcnow():
            block_until = otp_meta["block_until"]
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

        if otp_meta and otp_meta.get("last_generated"):
            last_generated = otp_meta["last_generated"]
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
            # Update existing token with new OTP and expiry, preserve metadata but update last_generated
            otp_meta["last_generated"] = datetime.utcnow()
            update_fields = {
                "token": otp,
                "otp_metadata": otp_meta,
                "updated_at": datetime.utcnow(),
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

async def get_user_by_id(user_id: str) -> User:
    """
    Get user details by user ID.
    Args:
        user_id (str): The ID of the user.
    Returns:
        User: The user object.
    """
    try:
        user = await db["users"].find_one({"_id": ObjectId(user_id)})
        if not user:
            logger.warning(f"User not found for ID: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")

        # Ensure profile is a UserProfile instance
        profile = user.get("profile")
        if profile and not isinstance(profile, UserProfile):
            profile = UserProfile(**profile)

        response = UserResponse(
            id=str(user["_id"]),
            name=user["name"],
            email=user["email"],
            role=user.get("role", UserRole.MEMBER),
            profile=profile,
            is_active=user.get("is_active", True),
            created_at=user.get("created_at"),
            last_login=user.get("last_login"),
        )
        return {
            "message": "Get user successful",
            "user": response.dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user by ID: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
    

async def refresh_user_session(user_id: str, response: Response) -> None:
    """
    Refresh the user session by updating the last login time and setting new cookies.
    Used in interceptor/middleware, does not return a response to the client.
    Args:
        user_id (str): The ID of the user whose session should be refreshed.
        response (Response): FastAPI response object to set new cookies.
    Returns:
        None. Raises exception if failed.
    Note:
        This function only refreshes the access token. If you want to rotate or update the refresh token,
        you should also generate and set a new refresh token here (see dependencies.set_auth_cookie implementation).
    """
    try:
        # Fetch user from database
        user = await db["users"].find_one({"_id": ObjectId(user_id)})
        if not user:
            logger.warning(f"User not found for ID: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")

        # Update user's last_login
        now = datetime.utcnow()
        await db["users"].update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"last_login": now}}
        )

        # Clear old cookies
        await dependencies.clear_auth_cookie(response)

        # Generate new access token with user data
        token = token_manager.create_token(
            str(user["_id"]),
            user["email"],
            user.get("is_verified", True)
        )

        # Set new cookies (access and refresh token if implemented in set_auth_cookie)
        await dependencies.set_auth_cookie(response, token)

        # No return value needed (None)
        return
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error refreshing user session: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")