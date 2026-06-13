from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CommentCreate(BaseModel):
    content: str


class CommentOut(BaseModel):
    id: int
    task_id: int
    user_id: int
    content: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None

    class Config:
        from_attributes = True
