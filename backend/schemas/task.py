from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional, List, Literal
from schemas.label import LabelOut

VALID_STATUSES = Literal["TODO", "IN_PROGRESS", "REVIEW", "DONE"]
VALID_PRIORITIES = Literal["LOW", "MEDIUM", "HIGH", "URGENT"]


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "TODO"
    priority: Optional[str] = "MEDIUM"
    project_id: int
    assignee_id: Optional[int] = None
    sprint_id: Optional[int] = None
    due_date: Optional[datetime] = None

    @field_validator('status', mode='before')
    @classmethod
    def validate_status(cls, v):
        allowed = {"TODO", "IN_PROGRESS", "REVIEW", "DONE"}
        if v and v not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v

    @field_validator('priority', mode='before')
    @classmethod
    def validate_priority(cls, v):
        allowed = {"LOW", "MEDIUM", "HIGH", "URGENT"}
        if v and v not in allowed:
            raise ValueError(f"Priority must be one of: {', '.join(allowed)}")
        return v

    @field_validator('title', mode='before')
    @classmethod
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError("Title cannot be empty")
        if len(v) > 255:
            raise ValueError("Title must be 255 characters or less")
        return v.strip()

    @field_validator('due_date', mode='before')
    @classmethod
    def fix_due_date(cls, v):
        if v == "" or v == "undefined":
            return None
        return v

    @field_validator('description', mode='before')
    @classmethod
    def fix_description(cls, v):
        if v == "":
            return None
        return v


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[int] = None
    sprint_id: Optional[int] = None
    due_date: Optional[datetime] = None

    @field_validator('status', mode='before')
    @classmethod
    def validate_status(cls, v):
        if v is None:
            return v
        allowed = {"TODO", "IN_PROGRESS", "REVIEW", "DONE"}
        if v not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v

    @field_validator('priority', mode='before')
    @classmethod
    def validate_priority(cls, v):
        if v is None:
            return v
        allowed = {"LOW", "MEDIUM", "HIGH", "URGENT"}
        if v not in allowed:
            raise ValueError(f"Priority must be one of: {', '.join(allowed)}")
        return v

    @field_validator('title', mode='before')
    @classmethod
    def validate_title(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError("Title cannot be empty")
            if len(v) > 255:
                raise ValueError("Title must be 255 characters or less")
            return v.strip()
        return v

    @field_validator('due_date', mode='before')
    @classmethod
    def fix_due_date(cls, v):
        if v == "" or v == "undefined":
            return None
        return v


class Task(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: Optional[str] = "TODO"
    priority: Optional[str] = "MEDIUM"
    project_id: int
    assignee_id: Optional[int] = None
    sprint_id: Optional[int] = None
    due_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    labels: List[LabelOut] = []

    class Config:
        from_attributes = True
