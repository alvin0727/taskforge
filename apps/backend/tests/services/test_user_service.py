import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from bson import ObjectId
from passlib.context import CryptContext
from fastapi import HTTPException
import app.services.user_service as user_service

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)

@pytest.mark.asyncio
async def test_register_user_and_verification_token_success():
    email = "test@example.com"
    name = "Test User"
    password = "securepassword"

    with patch("app.services.user_service.db") as mock_db, \
        patch("app.services.user_service.generate_verification_token", return_value="dummy_token"), \
        patch("app.services.user_service.send_verification_email", new_callable=AsyncMock):

        users_collection = MagicMock()
        users_collection.find_one = AsyncMock(return_value=None)
        users_collection.insert_one = AsyncMock(return_value=MagicMock(inserted_id=ObjectId()))

        verification_tokens_collection = AsyncMock()
        verification_tokens_collection.insert_one = AsyncMock(return_value=MagicMock(inserted_id=ObjectId()))

        mock_db.__getitem__.side_effect = lambda name: {
            "users": users_collection,
            "verification_tokens": verification_tokens_collection
        }[name]

        # Patch Verification_Token to accept 'expiresAt' as 'expires_at'
        with patch("app.services.user_service.Verification_Token") as MockVerificationToken:
            def verification_token_side_effect(**kwargs):
                # Accept both 'expiresAt' and 'expires_at'
                if "expiresAt" in kwargs:
                    kwargs["expires_at"] = kwargs.pop("expiresAt")
                # Provide defaults for required fields if missing
                if "created_at" not in kwargs:
                    kwargs["created_at"] = datetime.now(ZoneInfo("Asia/Jakarta"))
                if "updated_at" not in kwargs:
                    kwargs["updated_at"] = datetime.now(ZoneInfo("Asia/Jakarta"))
                # Simulate a Pydantic model with .model_dump()
                mock_obj = MagicMock()
                mock_obj.model_dump.return_value = kwargs
                return mock_obj
            MockVerificationToken.side_effect = verification_token_side_effect

            user_id = await user_service.register_user(email, name, password)

        assert user_id is not None
        users_collection.insert_one.assert_awaited_once()
        verification_tokens_collection.insert_one.assert_awaited_once()

@pytest.mark.asyncio
async def test_verify_email_success():
    token = "valid_token"
    
    with patch("app.services.user_service.db") as mock_db:
        verification_tokens_collection = MagicMock()
        verification_tokens_collection.find_one = AsyncMock(return_value={
            "_id": ObjectId(),
            "user_id": str(ObjectId()),
            "token": token,
            "expiresAt": datetime.now(ZoneInfo("Asia/Jakarta")) + timedelta(hours=1)
        })
        verification_tokens_collection.delete_one = AsyncMock(return_value=None)

        users_collection = MagicMock()
        users_collection.update_one = AsyncMock(return_value=None)

        mock_db.__getitem__.side_effect = lambda name: {
            "users": users_collection,
            "verification_tokens": verification_tokens_collection
        }[name]

        result = await user_service.verify_email(token)

        assert result is True
        verification_tokens_collection.find_one.assert_awaited_once_with({"token": token})
        
@pytest.mark.asyncio
async def test_verify_email_token_not_found():
    token = "invalid_token"
    
    with patch("app.services.user_service.db") as mock_db:
        verification_tokens_collection = MagicMock()
        verification_tokens_collection.find_one = AsyncMock(return_value=None)

        mock_db.__getitem__.return_value = verification_tokens_collection

        with pytest.raises(ValueError, match="Invalid or expired verification token"):
            await user_service.verify_email(token)

@pytest.mark.asyncio
async def test_resend_verification_email_success():
    email = "test@example.com"
    
    with patch("app.services.user_service.db") as mock_db, \
        patch("app.services.user_service.send_verification_email", new_callable=AsyncMock), \
        patch("app.services.user_service.Verification_Token") as MockVerificationToken:

        users_collection = AsyncMock()
        users_collection.find_one = AsyncMock(side_effect=[None, {"_id": ObjectId(), "email": email}])

        verification_tokens_collection = AsyncMock()
        verification_tokens_collection.insert_one = AsyncMock(return_value=MagicMock(inserted_id=ObjectId()))

        mock_db.__getitem__.side_effect = lambda name: {
            "users": users_collection,
            "verification_tokens": verification_tokens_collection
        }[name]

        def verification_token_side_effect(**kwargs):
            if "expiresAt" in kwargs:
                kwargs["expires_at"] = kwargs.pop("expiresAt")
            if "created_at" not in kwargs:
                kwargs["created_at"] = datetime.now(ZoneInfo("Asia/Jakarta"))
            if "updated_at" not in kwargs:
                kwargs["updated_at"] = datetime.now(ZoneInfo("Asia/Jakarta"))
            mock_obj = MagicMock()
            mock_obj.model_dump.return_value = kwargs
            return mock_obj
        MockVerificationToken.side_effect = verification_token_side_effect

        await user_service.register_user(email, "Test User", "securepassword")
        await user_service.resend_verification_email(email)

        users_collection.find_one.assert_any_await({"email": email})
        verification_tokens_collection.insert_one.assert_awaited()


@pytest.mark.asyncio
async def test_login_user_success():
    email = "test@example.com"
    password = "securepassword"

    with patch("app.services.user_service.db") as mock_db:
        users_collection = MagicMock()
        users_collection.find_one = AsyncMock(return_value={
            "_id": ObjectId(),
            "email": email,
            "password": hash_password(password),
        })

        verification_tokens_collection = AsyncMock()
        verification_tokens_collection.find_one = AsyncMock(side_effect=[None, None])

        mock_db.__getitem__.side_effect = lambda name: {
            "users": users_collection,
            "verification_tokens": verification_tokens_collection
        }[name]

        user_id = await user_service.login(email, password)

        assert user_id is not None
        users_collection.find_one.assert_awaited_once_with({"email": email})

@pytest.mark.asyncio
async def test_login_user_invalid_credentials():
    email = "test@example.com"
    password = "wrongpassword"

    with patch("app.services.user_service.db") as mock_db:
        users_collection = MagicMock()
        users_collection.find_one = AsyncMock(return_value={
            "_id": ObjectId(),
            "email": email,
            "password": hash_password("securepassword"),
        })

        verification_tokens_collection = AsyncMock()
        verification_tokens_collection.find_one = AsyncMock(side_effect=[None, None])

        mock_db.__getitem__.side_effect = lambda name: {
            "users": users_collection,
            "verification_tokens": verification_tokens_collection
        }[name]

        with pytest.raises(HTTPException) as exc_info:
            await user_service.login(email, password)
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Invalid email or password"
        

@pytest.mark.asyncio
async def test_verify_otp_success():
    email = "test@example.com"
    otp = "123456"

    with patch("app.services.user_service.db") as mock_db, \
         patch("app.services.user_service.Verification_Token") as MockVerificationToken:

        users_collection = MagicMock()
        users_collection.find_one = AsyncMock(return_value={
            "_id": ObjectId(),
            "email": email,
        })

        verification_tokens_collection = AsyncMock()
        verification_tokens_collection.find_one = AsyncMock(return_value={
            "user_id": str(users_collection.find_one.return_value["_id"]),
            "token": otp,
            "type": "otp",
            "expires_at": datetime.now(ZoneInfo("Asia/Jakarta")) + timedelta(minutes=5),
            "created_at": datetime.now(ZoneInfo("Asia/Jakarta")),
            "updated_at": datetime.now(ZoneInfo("Asia/Jakarta")),
            "otpMetadata": {  
                "attempts": 0,
                "maxAttempts": 3,
                "lastAttempt": None,
                "isBlocked": False,
                "blockUntil": None,
                "lastGenerated": None,
            },
            "_id": ObjectId(), 
        })

        mock_db.__getitem__.side_effect = lambda name: {
            "users": users_collection,
            "verification_tokens": verification_tokens_collection
        }[name]

        def verification_token_side_effect(**kwargs):
            if "expiresAt" in kwargs:
                kwargs["expires_at"] = kwargs.pop("expiresAt")
            if "created_at" not in kwargs:
                kwargs["created_at"] = datetime.now(ZoneInfo("Asia/Jakarta"))
            if "updated_at" not in kwargs:
                kwargs["updated_at"] = datetime.now(ZoneInfo("Asia/Jakarta"))
            mock_obj = MagicMock()
            mock_obj.model_dump.return_value = kwargs
            for k, v in kwargs.items():
                setattr(mock_obj, k, v)
            return mock_obj
        MockVerificationToken.side_effect = verification_token_side_effect

        response = MagicMock()
        result = await user_service.verify_otp(email, otp, response)

        assert result is True
        verification_tokens_collection.find_one.assert_awaited_once_with({
            "user_id": str(users_collection.find_one.return_value["_id"]),
            "type": "otp"
        })

@pytest.mark.asyncio
async def test_verify_otp_invalid():
    email = "test@example.com"
    otp = "wrong_otp"

    with patch("app.services.user_service.db") as mock_db, \
         patch("app.services.user_service.Verification_Token") as MockVerificationToken:

        users_collection = MagicMock()
        users_collection.find_one = AsyncMock(return_value={
            "_id": ObjectId(),
            "email": email,
        })

        verification_tokens_collection = AsyncMock()
        verification_tokens_collection.find_one = AsyncMock(return_value={
            "user_id": str(users_collection.find_one.return_value["_id"]),
            "token": "123456",  # OTP yang benar, tapi input test salah
            "type": "otp",
            "expires_at": datetime.now(ZoneInfo("Asia/Jakarta")) + timedelta(minutes=5),
            "created_at": datetime.now(ZoneInfo("Asia/Jakarta")),
            "updated_at": datetime.now(ZoneInfo("Asia/Jakarta")),
            "otpMetadata": {
                "attempts": 0,
                "maxAttempts": 3,
                "lastAttempt": None,
                "isBlocked": False,
                "blockUntil": None,
                "lastGenerated": None,
            },
            "_id": ObjectId(),
        })

        mock_db.__getitem__.side_effect = lambda name: {
            "users": users_collection,
            "verification_tokens": verification_tokens_collection
        }[name]

        def verification_token_side_effect(**kwargs):
            if "expiresAt" in kwargs:
                kwargs["expires_at"] = kwargs.pop("expiresAt")
            if "created_at" not in kwargs:
                kwargs["created_at"] = datetime.now(ZoneInfo("Asia/Jakarta"))
            if "updated_at" not in kwargs:
                kwargs["updated_at"] = datetime.now(ZoneInfo("Asia/Jakarta"))
            mock_obj = MagicMock()
            mock_obj.model_dump.return_value = kwargs
            for k, v in kwargs.items():
                setattr(mock_obj, k, v)
            return mock_obj
        MockVerificationToken.side_effect = verification_token_side_effect

        response = MagicMock()
        with pytest.raises(HTTPException) as exc_info:
            await user_service.verify_otp(email, otp, response)

        assert exc_info.value.status_code == 400
        assert "Invalid OTP" in str(exc_info.value.detail)
        
@pytest.mark.asyncio
async def test_resend_otp_success():
    email = "test@example.com"
    otp = "123456"

    with patch("app.services.user_service.db") as mock_db, \
         patch("app.services.user_service.generate_otp", return_value=otp):

        users_collection = MagicMock()
        users_collection.find_one = AsyncMock(return_value={
            "_id": ObjectId(),
            "email": email,
        })

        verification_tokens_collection = AsyncMock()
        verification_tokens_collection.find_one = AsyncMock(return_value={
            "_id": ObjectId(),
            "user_id": str(users_collection.find_one.return_value["_id"]),
            "token": "old_otp",
            "type": "otp",
            "expires_at": datetime.now(ZoneInfo("Asia/Jakarta")) + timedelta(minutes=5),
            "otpMetadata": {
                "attempts": 0,
                "maxAttempts": 3,
                "lastAttempt": None,
                "isBlocked": False,
                "blockUntil": None,
                "lastGenerated": datetime.now(ZoneInfo("Asia/Jakarta")) - timedelta(minutes=2),
            },
        })
        verification_tokens_collection.update_one = AsyncMock(return_value=None)

        mock_db.__getitem__.side_effect = lambda name: {
            "users": users_collection,
            "verification_tokens": verification_tokens_collection
        }[name]

        result = await user_service.resend_otp(email)

        assert result is True
        users_collection.find_one.assert_awaited_once_with({"email": email})
        verification_tokens_collection.find_one.assert_awaited_once_with({
            "user_id": str(users_collection.find_one.return_value["_id"]),
            "type": "otp"
        })
        verification_tokens_collection.update_one.assert_awaited_once()
        
@pytest.mark.asyncio
async def test_resend_otp_rate_limited():
    email = "test@example.com"
    otp = "123456"
    with patch("app.services.user_service.db") as mock_db, \
         patch("app.services.user_service.generate_otp", return_value=otp):

        users_collection = MagicMock()
        users_collection.find_one = AsyncMock(return_value={
            "_id": ObjectId(),
            "email": email,
        })
        verification_tokens_collection = AsyncMock()
        verification_tokens_collection.find_one = AsyncMock(return_value={
            "_id": ObjectId(),
            "user_id": str(ObjectId()),
            "token": "old_otp",
            "type": "otp",
            "expires_at": datetime.now(ZoneInfo("Asia/Jakarta")) + timedelta(minutes=5),
            "otpMetadata": {
                "attempts": 0,
                "maxAttempts": 3,
                "lastAttempt": None,
                "isBlocked": False,
                "blockUntil": None,
                "lastGenerated": datetime.now(ZoneInfo("Asia/Jakarta")), 
            },
        })

        mock_db.__getitem__.side_effect = lambda name: {
            "users": users_collection,
            "verification_tokens": verification_tokens_collection
        }[name]

        with pytest.raises(HTTPException) as exc_info:
            await user_service.resend_otp(email)
        assert exc_info.value.status_code == 429
        assert "waitTime" in str(exc_info.value.detail)