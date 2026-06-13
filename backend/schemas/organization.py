from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class OrganizationBase(BaseModel):
    name: str
    description: Optional[str] = None


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class OrganizationResponse(OrganizationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    member_count: Optional[int] = 0

    class Config:
        from_attributes = True


class OrgMemberAdd(BaseModel):
    user_id: int
    role: Optional[str] = "developer"  # owner, manager, developer, viewer
