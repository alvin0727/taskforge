from fastapi import APIRouter, Depends, Response
import app.services.user_service as user_service
import app.utils.validators.user_validators as validators
from app.api.dependencies import get_current_user, get_current_user_from_refresh_token
from app.models.user import UserWithMessage

router = APIRouter()

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/signup")
async def signup_user(user: validators.register_user):
        await user_service.signup(
            email=user.email,
            name=user.name,
            password=user.password
        )
        return { "message" : "User registered successfully. Please check your email to verify your account." }
    
@router.get("/verify-email")
async def verify_email(token: str):
        await user_service.verify_email(token)
        return { "message": "Email verified successfully" }

@router.post("/resend-verification-email")
async def resend_verification_email(email: str):
        await user_service.resend_verification_email(email)
        return { "message": "Verification email resent successfully" }

@router.post("/login")
async def login_user(user: validators.LoginUser):
    await user_service.login(
        email=user.email,
        password=user.password
    )
    return {"message": "Login successful", "email": user.email}

@router.post("/verify-otp", response_model=UserWithMessage)
async def verify_otp(verify_otp: validators.verify_otp, response: Response):
    return await user_service.verify_otp(verify_otp.email, verify_otp.otp, response)
    
@router.post("/resend-otp")
async def resend_otp(email: str):
        await user_service.resend_otp(email)
        return {"message": "OTP resent successfully"}
    
@router.get("/me", response_model=UserWithMessage)
async def get_me(current_user=Depends(get_current_user)):
    return await user_service.get_user_by_id(current_user["id"])

@router.post("/refresh-token")
async def refresh_token(response: Response, current_user=Depends(get_current_user_from_refresh_token)):
    await user_service.refresh_user_session(current_user["id"], response)
    return {"message": "Session refreshed successfully"}