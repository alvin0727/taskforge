from bson import ObjectId
from app.db.database import get_db
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
from typing import Optional, Dict, Any
from app.services.organization_service import OrganizationService

db = get_db()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
org_service = OrganizationService()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


class UserService:

    @staticmethod
    async def signup_hybrid(
        email: str,
        name: str,
        password: str,
        signup_type: str = "personal",  # personal, team, invitation
        organization_data: Optional[Dict[str, Any]] = None,
        invitation_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Hybrid signup supporting multiple flows:
        1. personal - Create personal workspace
        2. team - Create team organization  
        3. invitation - Join via invitation
        """
        user_id = None
        organization_id = None
        verification_token_id = None
        try:
            # Check if the email is already registered
            existing_user = await db["users"].find_one({"email": email})
            if existing_user:
                raise HTTPException(status_code=400, detail={
                                    "message": "Email already registered"})

            now = datetime.utcnow()

            user = User(
                email=email,
                name=name,
                password_hash=hash_password(password),
                organizations=[],
                created_at=now,
            )
            user_result = await db["users"].insert_one(user.model_dump(by_alias=True))
            user_id = user_result.inserted_id  # type: ignore

            organization_info = {}

            try:
                # Handle different signup types
                if signup_type == "personal":
                    # Create personal workspace
                    organization_id = await org_service.create_personal_workspace(user_id, name)
                    await org_service.add_user_to_organization(
                        user_id=user_id,
                        organization_id=organization_id,
                        role=UserRole.ADMIN
                    )
                    org = await db["organizations"].find_one({"_id": organization_id})
                    organization_info = {
                        "id": str(organization_id),
                        "name": org["name"],
                        "slug": org["slug"],
                        "type": "personal",
                    }
                elif signup_type == "team" and organization_data:
                    # Create team organization
                    organization_id = await org_service.create_team_organization(
                        owner_id=user_id,
                        name=organization_data.get("name"),
                        description=organization_data.get("description")
                    )
                    await org_service.add_user_to_organization(
                        user_id=user_id,
                        organization_id=organization_id,
                        role=UserRole.ADMIN
                    )
                    org = await db["organizations"].find_one({"_id": organization_id})
                    organization_info = {
                        "id": str(organization_id),
                        "name": org["name"],
                        "slug": org["slug"],
                        "type": "team",
                    }
                elif signup_type == "invitation" and invitation_token:
                    # Accept invitation
                    invitation_result = await org_service.accept_invitation(
                        token=invitation_token,
                        user_id=user_id
                    )
                    organization_info = invitation_result

                token = generate_verification_token()
                verification_token = VerificationToken(
                    user_id=user_result.inserted_id,  # PyObjectId
                    token=token,
                    type="email_verification",
                    expires_at=now + timedelta(hours=24),
                    created_at=now,
                )
                vt_result = await db["verification_tokens"].insert_one(verification_token.model_dump(by_alias=True))
                verification_token_id = vt_result.inserted_id

                # Send verification email
                await send_verification_email(email, token)
                logger.info(
                    f"User registered successfully with ID: {user_result.inserted_id}")

                return {
                    "user_id": str(user_id),
                    **organization_info,
                    "signup_type": signup_type,
                    "verification_required": True
                }
            except Exception as e:
                # Rollback organization if created
                if organization_id:
                    await db["organizations"].delete_one({"_id": organization_id})
                # Rollback user if created
                if user_id:
                    await db["users"].delete_one({"_id": user_id})
                # Rollback verification token if created
                if verification_token_id:
                    await db["verification_tokens"].delete_one({"_id": verification_token_id})
                raise HTTPException(
                    status_code=500, detail=f"Signup failed: {str(e)}")
        except HTTPException:
            # Rollback user/org if HTTPException in outer try
            if organization_id:
                await db["organizations"].delete_one({"_id": organization_id})
            if user_id:
                await db["users"].delete_one({"_id": user_id})
            if verification_token_id:
                await db["verification_tokens"].delete_one({"_id": verification_token_id})
            raise

    @staticmethod
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
                raise HTTPException(status_code=400, detail={
                                    "message": "Invalid or expired token"})

            await db["users"].update_one(
                {"_id": verification_token["user_id"]},
                {"$set": {"is_verified": True, "updated_at": datetime.utcnow()}}
            )
            await db["verification_tokens"].delete_one({"_id": verification_token["_id"]})
            logger.info(
                f"Email verified successfully for user ID: {verification_token['user_id']}")
            return True
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error verifying email: {e}")
            return False

    @staticmethod
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
                raise HTTPException(status_code=404, detail={
                                    "message": "User not found or already verified"})

            # Delete only existing email verification tokens for this user
            await db["verification_tokens"].delete_many({
                "user_id": user["_id"],
                "type": "email_verification"
            })

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

    @staticmethod
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
                raise HTTPException(status_code=401, detail={
                                    "message": "Invalid email or password"})

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
                block_time_left = - \
                    (-int((block_until - now).total_seconds()) // 60)  # ceil division
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
                    {"$set": {"token": otp, "update_at": datetime.utcnow()}}
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
            raise HTTPException(
                status_code=500, detail="Internal server error")

    @staticmethod
    async def verify_otp(email: str, otp: str, response: Response) -> bool:
        try:
            user = await db["users"].find_one({"email": email})
            if not user:
                logger.warning(f"User not found for email: {email}")
                raise HTTPException(status_code=404, detail={
                                    "message": "User not found"})

            verification_token = await db["verification_tokens"].find_one({
                "user_id": user["_id"],
                "type": "otp"
            })

            if not verification_token:
                logger.warning(f"Invalid OTP for email: {email}")
                raise HTTPException(status_code=400, detail={
                                    "message": "Invalid OTP, not found or expired"})

            otp_meta = verification_token.get("otp_metadata", {})
            if otp_meta.get("is_blocked") and otp_meta.get("block_until") and otp_meta["block_until"] > datetime.utcnow():
                block_until = otp_meta["block_until"]
                now = datetime.utcnow()
                block_time_left = - \
                    (-int((block_until - now).total_seconds()) // 60)  # ceil division
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
                    otp_meta["block_until"] = datetime.utcnow() + \
                        timedelta(minutes=15)
                    verification_token["expires_at"] = datetime.utcnow(
                    ) + timedelta(minutes=15)

                remaining_attempts = otp_meta.get(
                    "max_attempts", 3) - otp_meta["attempts"]
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
                    logger.warning(
                        f"User {email} blocked due to too many failed OTP attempts")
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
            token_auth = token_manager.create_token(
                str(user["_id"]),
                email,
                user.get("is_verified", False)
            )

            token_refresh = token_manager.create_refresh_token(
                str(user["_id"]),
                email
            )
            # Set new cookies
            await dependencies.set_auth_cookie(response, token_auth, token_refresh)

            # Ensure profile is a UserProfile instance
            profile = user.get("profile")
            if profile and not isinstance(profile, UserProfile):
                profile = UserProfile(**profile)

            response = UserResponse(
                id=str(user["_id"]),
                name=user["name"],
                email=user["email"],
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
            raise HTTPException(
                status_code=500, detail="Internal server error")

    @staticmethod
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
                raise HTTPException(status_code=404, detail={
                                    "message": "User not found"})

            existing_token = await db["verification_tokens"].find_one({
                "user_id": user["_id"],
                "type": "otp"
            })

            if not existing_token:
                logger.warning(f"Invalid OTP for email: {email}")
                raise HTTPException(status_code=400, detail={
                                    "message": "Invalid OTP, not found or expired"})

            otp_meta = existing_token.get("otp_metadata", {})
            if otp_meta.get("is_blocked") and otp_meta.get("block_until") and otp_meta["block_until"] > datetime.utcnow():
                block_until = otp_meta["block_until"]
                now = datetime.utcnow()
                block_time_left = - \
                    (-int((block_until - now).total_seconds()) // 60)  # ceil division
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
                time_since_last_otp = (
                    now_utc - last_generated).total_seconds()
                one_minute_in_seconds = 60

                if time_since_last_otp < one_minute_in_seconds:
                    wait_time = int(one_minute_in_seconds -
                                    time_since_last_otp)
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

    @staticmethod
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
                raise HTTPException(status_code=404, detail={
                                    "message": "User not found"})

            # Ensure profile is a UserProfile instance
            profile = user.get("profile")
            if profile and not isinstance(profile, UserProfile):
                profile = UserProfile(**profile)

            response = UserResponse(
                id=str(user["_id"]),
                name=user["name"],
                email=user["email"],
                profile=profile,
                is_active=user.get("is_active", True),
                created_at=user.get("created_at"),
                last_login=user.get("last_login"),
                active_organization_id=str(user.get("active_organization_id")) if user.get(
                    "active_organization_id") else None
            )
            return {
                "message": "Get user successful",
                "user": response.dict()
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching user by ID: {e}")
            raise HTTPException(
                status_code=500, detail="Internal server error")

    @staticmethod
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
                raise HTTPException(status_code=404, detail={
                                    "message": "User not found"})

            # Update user's last_login
            now = datetime.utcnow()
            await db["users"].update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"last_login": now}}
            )

            # Clear old cookies
            await dependencies.clear_auth_cookie(response)

            # Generate new access token with user data
            token_auth = token_manager.create_token(
                str(user["_id"]),
                user["email"],
                user.get("is_verified", True)
            )
            token_refresh = token_manager.create_refresh_token(
                str(user["_id"]),
                user["email"]
            )

            # Set new cookies (access and refresh token if implemented in set_auth_cookie)
            await dependencies.set_auth_cookie(response, token_auth, token_refresh)

            # No return value needed (None)
            return
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error refreshing user session: {e}")
            raise HTTPException(
                status_code=500, detail="Internal server error")
