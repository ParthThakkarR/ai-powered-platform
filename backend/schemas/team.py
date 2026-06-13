from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TeamMemberInvite(BaseModel):
    email: str
    role: str = "MEMBER"  # ADMIN, MEMBER, VIEWER


class TeamMemberUpdate(BaseModel):
    role: str


class TeamMemberOut(BaseModel):
    id: int
    organization_id: int
    user_id: int
    role: str
    joined_at: Optional[datetime] = None
    user_email: Optional[str] = None
    user_name: Optional[str] = None

    class Config:
        from_attributes = True
