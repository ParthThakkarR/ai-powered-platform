from datetime import timedelta, datetime, timezone
from typing import Any
from fastapi import APIRouter, Body, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from core import security
from core.config import settings
from api import deps
from schemas.token import Token
from schemas.user import User, UserCreate, UserUpdate
from schemas.password_reset import ForgotPasswordRequest, ResetPasswordRequest
from services import user_service
from services.email_service import send_password_reset_email
from core.rate_limit import limiter
import secrets
from models.password_reset import PasswordReset

router = APIRouter()


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login_access_token(
    request: Request,
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    user = user_service.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }


@router.post("/register", response_model=User)
@limiter.limit("5/minute")
def register_user(
    request: Request,
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
) -> Any:
    user = user_service.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists.",
        )
    user = user_service.create_user(db, user=user_in)
    return user


@router.get("/me", response_model=User)
def read_user_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    return current_user


@router.put("/me", response_model=User)
def update_user_me(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update current user's profile (name, email, password)."""
    update_data = user_in.model_dump(exclude_unset=True)

    if "email" in update_data and update_data["email"] != current_user.email:
        existing = user_service.get_user_by_email(db, email=update_data["email"])
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")

    if "password" in update_data and update_data["password"]:
        current_user.hashed_password = security.get_password_hash(update_data["password"])
        del update_data["password"]

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(
    request: Request,
    *,
    db: Session = Depends(deps.get_db),
    body: ForgotPasswordRequest,
) -> Any:
    """Request a password reset email."""
    user = user_service.get_user_by_email(db, email=body.email)
    if not user:
        return {"message": "If an account exists, a reset email has been sent."}

    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=1)

    reset = PasswordReset(user_id=user.id, token=token, expires_at=expires)
    db.add(reset)
    db.commit()

    reset_url = f"{request.base_url.origin}/reset-password?token={token}"
    email_sent = send_password_reset_email(user.email, reset_url)

    response: dict[str, Any] = {"message": "If an account exists, a reset email has been sent."}
    if not email_sent:
        # Dev fallback: include reset link in response when SMTP is not configured
        response["reset_url"] = reset_url
        response["note"] = "SMTP not configured. Use this link to reset your password."
    return response


@router.post("/reset-password")
def reset_password(
    *,
    db: Session = Depends(deps.get_db),
    body: ResetPasswordRequest,
) -> Any:
    """Reset password using a valid token."""
    reset = db.query(PasswordReset).filter(
        PasswordReset.token == body.token,
        PasswordReset.used == False,
    ).first()
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if reset.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired")

    user = user_service.get_user(db, user_id=reset.user_id)
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    user.hashed_password = security.get_password_hash(body.new_password)
    db.add(user)
    reset.used = True
    db.add(reset)
    db.commit()

    return {"message": "Password has been reset successfully"}


@router.post("/google-login", response_model=Token)
@limiter.limit("10/minute")
def google_login(
    request: Request,
    *,
    db: Session = Depends(deps.get_db),
    id_token: str = Body(..., alias="id_token"),
) -> Any:
    """Login or register with Google account using a verified ID token."""
    from google.oauth2 import id_token as google_id_token
    from google.auth.transport import requests as google_requests

    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth is not configured on the server")

    try:
        payload = google_id_token.verify_oauth2_token(
            id_token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired Google token")

    email = payload.get("email")
    name = payload.get("name", "")
    google_sub = payload.get("sub")

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    user = user_service.get_user_by_email(db, email=email)
    if not user:
        user = user_service.create_user(db, user=UserCreate(
            email=email,
            password=secrets.token_urlsafe(32),
            full_name=name,
        ))

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }
