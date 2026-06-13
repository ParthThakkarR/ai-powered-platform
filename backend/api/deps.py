from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session
from core import security, database
from core.config import settings
from models.user import User
from schemas.token import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


def get_db() -> Generator:
    try:
        db = database.SessionLocal()
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"],
            issuer=settings.JWT_ISSUER,
            audience=settings.JWT_AUDIENCE,
        )
        token_data = TokenPayload(**payload)
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    except ValidationError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    user = db.query(User).filter(User.id == token_data.sub).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    return current_user
