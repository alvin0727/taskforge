from fastapi import APIRouter, Depends, Response
from app.services.user_service import UserService
import app.lib.request.user_request as user_request
from app.api.dependencies import get_current_user, get_current_user_from_refresh_token
from app.models.user import UserWithMessage

router = APIRouter()
router = APIRouter(prefix="/users", tags=["users"])
user_service = UserService()


@router.post("/register/personal")
async def register_personal(request: user_request.PersonalSignupRequest):
    """Register user with personal workspace"""
    result = await user_service.signup_hybrid(
        email=request.email,
        name=request.name,
        password=request.password,
        signup_type="personal"
    )

    return {
        "message": "Personal workspace created successfully"
    }


@router.post("/register/team")
async def register_team(request: user_request.TeamSignupRequest):
    """Register user and create team organization"""
    result = await user_service.signup_hybrid(
        email=request.email,
        name=request.name,
        password=request.password,
        signup_type="team",
        organization_data={
            "name": request.organization_name,
            "description": request.organization_description
        }
    )

    return {
        "message": "Team organization created successfully"
    }


@router.post("/register/join")
async def register_with_invitation(request: user_request.InvitationSignupRequest):
    """Register user and join organization via invitation"""
    result = await user_service.signup_hybrid(
        email=request.email,
        name=request.name,
        password=request.password,
        signup_type="invitation",
        invitation_token=request.invitation_token
    )

    return {
        "message": f"Successfully joined organization {result['organization']['name']}"
    }


@router.get("/verify-email")
async def verify_email(token: str):
    await user_service.verify_email(token)
    return {"message": "Email verified successfully"}


@router.post("/resend-verification-email")
async def resend_verification_email(email: str):
    await user_service.resend_verification_email(email)
    return {"message": "Verification email resent successfully"}


@router.post("/login")
async def login_user(user: user_request.LoginUser):
    await user_service.login(
        email=user.email,
        password=user.password
    )
    return {"message": "Login successful", "email": user.email}


@router.post("/verify-otp", response_model=UserWithMessage)
async def verify_otp(verify_otp: user_request.VerifyOTP, response: Response):
    return await user_service.verify_otp(verify_otp.email, verify_otp.otp, response)

# @router.post("/resend-otp")
# async def resend_otp(email: str):
#         await user_service.resend_otp(email)
#         return {"message": "OTP resent successfully"}


@router.get("/me", response_model=UserWithMessage)
async def get_me(current_user=Depends(get_current_user)):
    return await user_service.get_user_by_id(current_user["id"])

@router.post("/refresh-token")
async def refresh_token(response: Response, current_user=Depends(get_current_user_from_refresh_token)):
    await user_service.refresh_user_session(current_user["id"], response)
    return {"message": "Session refreshed successfully"}
