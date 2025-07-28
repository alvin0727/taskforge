from fastapi import APIRouter, HTTPException
from app.utils.logger import logger
import app.services.user_service as user_service
import app.utils.validators.user_validators as validators

router = APIRouter()

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/register")
async def register_user(user: validators.RegisterUser):
    try:
        await user_service.registerUser(
            email=user.email,
            name=user.name,
            password=user.password
        )
        return {f"User registered successfully. Please check your email to verify your account."}
    except ValueError as e:
        logger.warning(f"Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
@router.get("/verify-email")
async def verify_email(token: str):
    try:
        await user_service.verifyEmail(token)
        return {"message": "Email verified successfully"}
    except ValueError as e:
        logger.warning(f"Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error verifying email: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

