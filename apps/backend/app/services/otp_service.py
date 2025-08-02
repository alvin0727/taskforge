import secrets
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from app.config.config import EMAIL_USER, EMAIL_PASS
from app.services.email_service import conf, fast_mail

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


def generate_otp() -> str:
    # Create a 4-digit OTP
    return str(secrets.randbelow(9000) + 1000)


async def send_otp_email(email: str, otp: str) -> None:
    html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333; margin: 0;">🤖 Task Forge</h1>
            </div>
            
            <h2 style="color: #333;">🔐 Sign In Verification</h2>
            <p>Your verification code for signing in is:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; 
                            border: 2px dashed #007bff; display: inline-block;">
                    <span style="font-size: 32px; font-weight: bold; color: #007bff; 
                                 letter-spacing: 8px;">{otp}</span>
                </div>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                    ⚠️ <strong>Security Notice:</strong><br>
                    • This code expires in 5 minutes<br>
                    • You have 3 attempts to enter the correct code<br>
                    • After 3 failed attempts, you'll be blocked for 15 minutes
                </p>
            </div>
            
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #721c24; font-size: 13px;">
                    📧 <strong>This is an automated message - Please do not reply</strong><br>
                    For support, contact us at: <a href="mailto:support@taskforge.com" style="color: #007bff;">support@taskforge.com</a>
                </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #dc3545; font-size: 12px; text-align: center;">
                🚨 If you didn't request this code, please ignore this email and consider changing your password.
            </p>
        </div>
    """

    message = MessageSchema(
        subject="Your Sign In Verification Code",
        recipients=[email],
        body=html,
        subtype="html"
    )
    await fast_mail.send_message(message)
