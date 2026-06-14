import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from core.config import settings
import logging

logger = logging.getLogger("aiflow")


def send_email(to_email: str, subject: str, body: str) -> bool:
    """Send an email via SMTP. Returns True on success."""
    smtp_host = getattr(settings, 'SMTP_HOST', None)
    smtp_port = getattr(settings, 'SMTP_PORT', 587)
    smtp_user = getattr(settings, 'SMTP_USER', None)
    smtp_pass = getattr(settings, 'SMTP_PASSWORD', None)

    if not smtp_host or not smtp_user:
        logger.warning("SMTP not configured — email not sent")
        return False

    msg = MIMEMultipart()
    msg['From'] = smtp_user
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'html'))

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False


def send_password_reset_email(to_email: str, reset_url: str) -> bool:
    subject = "AIFlow — Reset Your Password"
    body = f"""
    <html>
    <body style="font-family: sans-serif; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="{reset_url}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">
            Reset Password
        </a>
        <p style="color:#888;margin-top:20px;font-size:12px;">If you didn't request this, ignore this email.</p>
    </body>
    </html>
    """
    return send_email(to_email, subject, body)
