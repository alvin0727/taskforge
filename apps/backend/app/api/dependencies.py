from fastapi import Depends, Cookie, HTTPException, Response
from app.utils.token_manager import verify_token

async def get_current_user(token: str = Cookie(None)):
    if not token:
        raise HTTPException(status_code=401, detail="Missing auth token")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
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
        max_age=60 * 60,  # 1 jam dalam detik
        samesite="lax",
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=token,
        httponly=True,
        secure=False,
        max_age=7 * 24 * 60 * 60,  # 7 hari dalam detik
        samesite="lax",
        path="/"
    )