from typing import Optional, Literal
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = True
    full_name: Optional[str] = None


class UserCreate(UserBase):
    email: EmailStr
    password: str
    # is_superuser REMOVED - cannot be set via registration


class UserUpdate(UserBase):
    password: Optional[str] = None


class UserInDBBase(UserBase):
    id: Optional[int] = None
    is_superuser: bool = False

    class Config:
        from_attributes = True


class User(UserInDBBase):
    organization_id: Optional[int] = None
    role: Optional[Literal["ADMIN", "MEMBER", "VIEWER"]] = None


class UserInDB(UserInDBBase):
    hashed_password: str
