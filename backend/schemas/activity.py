from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ActivityLogOut(BaseModel):
    id: int
    user_id: int
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    details: Optional[str] = None
    created_at: Optional[datetime] = None
    user_name: Optional[str] = None

    class Config:
        from_attributes = True