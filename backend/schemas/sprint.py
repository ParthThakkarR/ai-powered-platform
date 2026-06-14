from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SprintCreate(BaseModel):
    name: str
    goal: Optional[str] = None
    start_date: datetime
    end_date: datetime
    is_active: Optional[bool] = False


class SprintUpdate(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None


class SprintOut(BaseModel):
    id: int
    project_id: int
    name: str
    goal: Optional[str] = None
    start_date: datetime
    end_date: datetime
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
