from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
import secrets
from app.config.config import FRONTEND_URL, EMAIL_USER, EMAIL_PASS

conf = ConnectionConfig(
    MAIL_USERNAME=EMAIL_USER,
    MAIL_PASSWORD=EMAIL_PASS,
    MAIL_FROM=f"TaskForge <{EMAIL_USER}>",
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_FROM_NAME="Test Forge",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True
)

fast_mail = FastMail(conf)

def generate_verification_token() -> str:
    return secrets.token_hex(32)

async def send_verification_email(email: str, token: str):
    verification_link = f"{FRONTEND_URL}/verify-email?token={token}"
    html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome! Please verify your email</h2>
            <p>Thank you for signing up. Please click the button below to verify your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verification_link}" 
                   style="background-color: #007bff; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                    Verify Email Address
                </a>
            </div>
            <p style="color: #666; font-size: 14px;">
                If the button doesn't work, copy and paste this link in your browser:<br>
                <a href="{verification_link}">{verification_link}</a>
            </p>
            <p style="color: #666; font-size: 12px;">
                This link will expire in 24 hours.
            </p>
        </div>
    """

    message = MessageSchema(
        subject="Verify Your Email Address",
        recipients=[email],
        body=html,
        subtype="html"
    )
    await fast_mail.send_message(message)