from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
import secrets
from app.config.config import FRONTEND_URL, EMAIL_USER, EMAIL_PASS
from app.db.database import get_db

db = get_db()

conf = ConnectionConfig(
    MAIL_USERNAME=EMAIL_USER,
    MAIL_PASSWORD=EMAIL_PASS,
    MAIL_FROM=f"TaskForge <{EMAIL_USER}>",
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_FROM_NAME="TaskForge",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True
)

fast_mail = FastMail(conf)

def generate_verification_token() -> str:
    return secrets.token_hex(32)

async def send_verification_email(email: str, token: str):
    verification_link = f"{FRONTEND_URL}/user/verify-email?token={token}"
    html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email - TaskForge</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center;">
                    <div style="background: rgba(255,255,255,0.1); width: 80px; height: 80px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
                            <rect x="6" y="7" width="4" height="14" rx="2" fill="white" />
                            <rect x="12" y="7" width="4" height="10" rx="2" fill="white" />
                            <rect x="18" y="7" width="4" height="6" rx="2" fill="white" />
                        </svg>
                    </div>
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">TaskForge</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Project Management Platform</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Welcome to TaskForge!</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Thank you for creating your TaskForge account. To get started with managing your projects and collaborating with your team, please verify your email address.
                    </p>
                    
                    <!-- Verification Button -->
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="{verification_link}" 
                           style="background: #2563EB; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                            Verify Email Address
                        </a>
                    </div>
                    
                    <!-- Features Preview -->
                    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 30px 0;">
                        <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">What's next?</h3>
                        <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                            <div style="background: #10b981; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; font-size: 12px;">✓</div>
                            <p style="color: #4b5563; margin: 0; font-size: 14px;">Create your first project and organize tasks</p>
                        </div>
                        <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                            <div style="background: #10b981; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; font-size: 12px;">✓</div>
                            <p style="color: #4b5563; margin: 0; font-size: 14px;">Invite team members to collaborate</p>
                        </div>
                        <div style="display: flex; align-items: flex-start;">
                            <div style="background: #10b981; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; font-size: 12px;">✓</div>
                            <p style="color: #4b5563; margin: 0; font-size: 14px;">Track progress with boards and analytics</p>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="background: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                        If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    <p style="color: #3b82f6; font-size: 14px; word-break: break-all; margin: 0 0 20px 0;">
                        <a href="{verification_link}" style="color: #3b82f6; text-decoration: none;">{verification_link}</a>
                    </p>
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                            This verification link will expire in 24 hours.<br>
                            If you didn't create a TaskForge account, you can safely ignore this email.
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    """

    message = MessageSchema(
        subject="Verify Your TaskForge Account",
        recipients=[email],
        body=html,
        subtype="html"
    )
    await fast_mail.send_message(message)
    
async def send_invitation_email(
    email: str, 
    organization_name: str, 
    inviter_name: str, 
    token: str, 
    role: str = "member",
    message: str = None
):
    """Send invitation email with smart routing based on user existence"""
    
    # Check if user already exists
    existing_user = await db["users"].find_one({"email": email})
    
    if existing_user:
        # Existing user - direct accept invitation
        invitation_link = f"{FRONTEND_URL}/user/login?token={token}"
        action_text = "Accept Invitation"
        instruction = "Click the button below to join the organization:"
        header_title = f"Join {organization_name}"
        header_subtitle = "You've been invited to collaborate"
    else:
        # New user - signup with invitation
        invitation_link = f"{FRONTEND_URL}/user/signup?token={token}"
        action_text = "Join & Create Account"
        instruction = "Click the button below to create your account and join the organization:"
        header_title = f"Welcome to {organization_name}"
        header_subtitle = "Create your account to get started"
    
    # Personal message section
    personal_message_html = ""
    if message:
        personal_message_html = f"""
            <div style="background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <div style="display: flex; align-items: flex-start;">
                    <div style="background: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; font-size: 14px;">💬</div>
                    <div>
                        <p style="color: #065f46; margin: 0 0 8px 0; font-weight: 600; font-size: 14px;">Personal message from {inviter_name}:</p>
                        <p style="color: #047857; margin: 0; font-size: 14px; font-style: italic;">"{message}"</p>
                    </div>
                </div>
            </div>
        """
    
    html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitation to {organization_name} - TaskForge</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                    <div style="background: rgba(255,255,255,0.1); width: 80px; height: 80px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
                            <rect x="6" y="7" width="4" height="14" rx="2" fill="white" />
                            <rect x="12" y="7" width="4" height="10" rx="2" fill="white" />
                            <rect x="18" y="7" width="4" height="6" rx="2" fill="white" />
                        </svg>
                    </div>
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">TaskForge</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Project Management Platform</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">{header_title}</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        {header_subtitle}
                    </p>
                    
                    <!-- Invitation Details -->
                    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 20px 0;">
                        <div style="display: flex; align-items: center; margin-bottom: 16px;">
                            <div style="background: #3b82f6; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 16px;">👥</div>
                            <div>
                                <p style="color: #1f2937; margin: 0; font-weight: 600; font-size: 16px;">{organization_name}</p>
                                <p style="color: #6b7280; margin: 0; font-size: 14px;">Organization</p>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; margin-bottom: 16px;">
                            <div style="background: #8b5cf6; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 16px;">👤</div>
                            <div>
                                <p style="color: #1f2937; margin: 0; font-weight: 600; font-size: 16px;">{inviter_name}</p>
                                <p style="color: #6b7280; margin: 0; font-size: 14px;">Invited by</p>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <div style="background: #f59e0b; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 16px;">🎯</div>
                            <div>
                                <p style="color: #1f2937; margin: 0; font-weight: 600; font-size: 16px;">{role.title()}</p>
                                <p style="color: #6b7280; margin: 0; font-size: 14px;">Role</p>
                            </div>
                        </div>
                    </div>
                    
                    {personal_message_html}
                    
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                        {instruction}
                    </p>
                    
                    <!-- Invitation Button -->
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="{invitation_link}" 
                           style="background: #10b981; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                            {action_text}
                        </a>
                    </div>
                    
                    <!-- Organization Benefits -->
                    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 30px 0;">
                        <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">What you'll get access to:</h3>
                        <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                            <div style="background: #10b981; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; font-size: 12px;">✓</div>
                            <p style="color: #4b5563; margin: 0; font-size: 14px;">Collaborate on projects and manage tasks together</p>
                        </div>
                        <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                            <div style="background: #10b981; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; font-size: 12px;">✓</div>
                            <p style="color: #4b5563; margin: 0; font-size: 14px;">Real-time communication and updates</p>
                        </div>
                        <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                            <div style="background: #10b981; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; font-size: 12px;">✓</div>
                            <p style="color: #4b5563; margin: 0; font-size: 14px;">Access to shared resources and documentation</p>
                        </div>
                        <div style="display: flex; align-items: flex-start;">
                            <div style="background: #10b981; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; font-size: 12px;">✓</div>
                            <p style="color: #4b5563; margin: 0; font-size: 14px;">Analytics and progress tracking</p>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="background: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                        If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    <p style="color: #3b82f6; font-size: 14px; word-break: break-all; margin: 0 0 20px 0;">
                        <a href="{invitation_link}" style="color: #3b82f6; text-decoration: none;">{invitation_link}</a>
                    </p>
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                            This invitation link will expire in 7 days.<br>
                            If you didn't expect this invitation, you can safely ignore this email.
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    """

    message = MessageSchema(
        subject=f"Invitation to join {organization_name} - TaskForge",
        recipients=[email],
        body=html,
        subtype="html"
    )
    await fast_mail.send_message(message)

async def send_password_reset_email(email: str, token: str, user_name: str = None):
    """Send password reset email"""
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    
    html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password - TaskForge</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 30px; text-align: center;">
                    <div style="background: rgba(255,255,255,0.1); width: 80px; height: 80px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
                            <path d="M14 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">TaskForge</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                        Reset Your Password{f", {user_name}" if user_name else ""}
                    </h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        We received a request to reset your password for your TaskForge account. If you made this request, click the button below to set a new password.
                    </p>
                    
                    <!-- Reset Button -->
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="{reset_link}" 
                           style="background: #dc2626; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
                            Reset Password
                        </a>
                    </div>
                    
                    <!-- Security Notice -->
                    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
                        <div style="display: flex; align-items: flex-start;">
                            <div style="background: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; font-size: 14px;">⚠️</div>
                            <div>
                                <p style="color: #92400e; margin: 0 0 8px 0; font-weight: 600; font-size: 14px;">Security Notice:</p>
                                <p style="color: #b45309; margin: 0; font-size: 14px;">
                                    If you didn't request this password reset, please ignore this email. Your password will not be changed unless you click the button above and create a new password.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="background: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                        If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    <p style="color: #3b82f6; font-size: 14px; word-break: break-all; margin: 0 0 20px 0;">
                        <a href="{reset_link}" style="color: #3b82f6; text-decoration: none;">{reset_link}</a>
                    </p>
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                            This password reset link will expire in 1 hour.<br>
                            For security reasons, please reset your password as soon as possible.
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    """

    message = MessageSchema(
        subject="Reset Your TaskForge Password",
        recipients=[email],
        body=html,
        subtype="html"
    )
    await fast_mail.send_message(message)

async def send_notification_email(
    email: str,
    subject: str,
    title: str,
    content: str,
    action_text: str = None,
    action_link: str = None,
    notification_type: str = "info"  # "info", "success", "warning", "error"
):
    """Send general notification email"""
    
    # Color scheme based on notification type
    color_schemes = {
        "info": {
            "gradient": "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            "button_color": "#3b82f6",
            "icon": "ℹ️"
        },
        "success": {
            "gradient": "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            "button_color": "#10b981",
            "icon": "✅"
        },
        "warning": {
            "gradient": "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            "button_color": "#f59e0b",
            "icon": "⚠️"
        },
        "error": {
            "gradient": "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
            "button_color": "#dc2626",
            "icon": "❌"
        }
    }
    
    scheme = color_schemes.get(notification_type, color_schemes["info"])
    
    # Action button section
    action_button_html = ""
    if action_text and action_link:
        action_button_html = f"""
            <div style="text-align: center; margin: 40px 0;">
                <a href="{action_link}" 
                   style="background: {scheme['button_color']}; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba({scheme['button_color'][1:]}, 0.3);">
                    {action_text}
                </a>
            </div>
        """
    
    html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{subject} - TaskForge</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <!-- Header -->
                <div style="background: {scheme['gradient']}; padding: 40px 30px; text-align: center;">
                    <div style="background: rgba(255,255,255,0.1); width: 80px; height: 80px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; font-size: 32px;">
                        {scheme['icon']}
                    </div>
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">TaskForge</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Notification</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">{title}</h2>
                    <div style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        {content}
                    </div>
                    
                    {action_button_html}
                </div>
                
                <!-- Footer -->
                <div style="background: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                        This is an automated notification from TaskForge.<br>
                        If you have any questions, please contact our support team.
                    </p>
                </div>
            </div>
        </body>
        </html>
    """

    message = MessageSchema(
        subject=f"{subject} - TaskForge",
        recipients=[email],
        body=html,
        subtype="html"
    )
    await fast_mail.send_message(message)