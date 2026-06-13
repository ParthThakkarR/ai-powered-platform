from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class NotificationOut(BaseModel):
    id: int
    user_id: int
    content: str
    link: Optional[str] = None
    is_read: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
