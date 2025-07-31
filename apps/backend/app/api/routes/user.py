from fastapi import APIRouter, HTTPException, Response
from app.utils.logger import logger
import app.services.user_service as user_service
import app.utils.validators.user_validators as validators

router = APIRouter()

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/register")
async def register_user(user: validators.register_user):
        await user_service.register_user(
            email=user.email,
            name=user.name,
            password=user.password
        )
        return {f"User registered successfully. Please check your email to verify your account."}
    
@router.get("/verify-email")
async def verify_email(token: str):
        await user_service.verify_email(token)
        return {"message": "Email verified successfully"}

@router.post("/resend-verification-email")
async def resend_verification_email(email: str):
        await user_service.resend_verification_email(email)
        return {"message": "Verification email resent successfully"}

@router.post("/login")
async def login_user(user: validators.LoginUser):
    user_id = await user_service.login(
        email=user.email,
        password=user.password
    )
    return {"message": "Login successful", "email": user.email}

@router.post("/verify-otp")
async def verify_otp(verify_otp: validators.verify_otp, response: Response):
    await user_service.verify_otp(verify_otp.email, verify_otp.otp, response)
    return {"message": "Login successful", "email": verify_otp.email}
    
@router.post("/resend-otp")
async def resend_otp(email: str):
        await user_service.resend_otp(email)
        return {"message": "OTP resent successfully"}