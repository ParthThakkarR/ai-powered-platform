from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Body, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from core import security
from core.config import settings
from api import deps
from schemas.token import Token
from schemas.user import User, UserCreate
from services import user_service
from core.rate_limit import limiter

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
