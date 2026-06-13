from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "TODO"
    priority: Optional[str] = "MEDIUM"
    project_id: int
    assignee_id: Optional[int] = None
    due_date: Optional[datetime] = None

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
    due_date: Optional[datetime] = None

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
    due_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
