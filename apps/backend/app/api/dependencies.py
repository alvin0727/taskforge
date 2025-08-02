from fastapi import  Cookie, HTTPException, Response
from app.utils.token_manager import verify_token

async def get_current_user(auth_token: str = Cookie(None)):
    if not auth_token:
        raise HTTPException(status_code=401, detail={"message": "Missing auth token"})
    payload = verify_token(auth_token)
    if not payload:
        raise HTTPException(status_code=401, detail={"message": "Invalid or expired token"})
    return payload

async def get_current_user_from_refresh_token(refresh_token: str = Cookie(None)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail={"message": "Missing refresh token"})
    payload = verify_token(refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail={"message": "Invalid or expired refresh token"})
    return payload

async def clear_auth_cookie(response: Response):
    response.delete_cookie("auth_token", path="/")
    response.delete_cookie("refresh_token", path="/")

async def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        secure=False,
        max_age= 24 * 60 * 60,  # 1 day
        samesite="lax",
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=token,
        httponly=True,
        secure=False,
        max_age=7 * 24 * 60 * 60,  # 7 days 
        samesite="lax",
        path="/"
    )