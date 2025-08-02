from jose import jwt, JWTError
from datetime import datetime, timedelta
from app.config.config import SECRET_KEY, REFRESH_SECRET_KEY, ALGORITHM

def create_token(user_id: str, email: str, is_verified: bool, expires_minutes: int = 60 * 24):
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode = {"id": user_id, "email": email, "isVerified": is_verified, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def create_refresh_token(user_id: str, email: str, expires_days: int = 7):
    expire = datetime.utcnow() + timedelta(days=expires_days)
    to_encode = {"id": user_id, "email": email, "exp": expire}
    return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)

def verify_refresh_token(token: str):
    try:
        payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def create_invitation_token(email: str, organization_id: str, role: str, expires_days: int = 7):
    expire = datetime.utcnow() + timedelta(days=expires_days)
    to_encode = {
        "email": email,
        "organization_id": organization_id,
        "role": role,
        "exp": expire
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)