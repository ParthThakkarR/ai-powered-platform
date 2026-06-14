from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional


class SubtaskCreate(BaseModel):
    title: str
    position: Optional[int] = 0

    @field_validator('title', mode='before')
    @classmethod
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()


class SubtaskUpdate(BaseModel):
    title: Optional[str] = None
    is_completed: Optional[bool] = None
    position: Optional[int] = None


class SubtaskOut(BaseModel):
    id: int
    task_id: int
    title: str
    is_completed: bool
    position: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
