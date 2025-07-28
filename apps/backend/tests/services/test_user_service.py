import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from bson import ObjectId

from app.services.user_service import registerUser, verifyEmail

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

        verification_tokens_collection = MagicMock()
        verification_tokens_collection.insert_one = AsyncMock(return_value=MagicMock(inserted_id=ObjectId()))

        mock_db.__getitem__.side_effect = lambda name: {
            "users": users_collection,
            "verification_tokens": verification_tokens_collection
        }[name]

        user_id = await registerUser(email, name, password)

        assert user_id is not None
        users_collection.insert_one.assert_awaited_once()
        verification_tokens_collection.insert_one.assert_awaited_once()
        
@pytest.mark.asyncio
async def test_register_user_email_already_exists():
    email = "test@example.com"
    name = "Test User"
    password = "securepassword"

    with patch("app.services.user_service.db") as mock_db:
        # Simulasikan user sudah ada
        mock_db.__getitem__.return_value.find_one = AsyncMock(return_value={"email": email})

        with pytest.raises(ValueError, match="Email already registered"):
            await registerUser(email, name, password)
            
            
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

        result = await verifyEmail(token)

        assert result is True
        verification_tokens_collection.find_one.assert_awaited_once_with({"token": token})