from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AttachmentOut(BaseModel):
    id: int
    task_id: int
    filename: str
    original_filename: str
    content_type: Optional[str] = None
    size: Optional[int] = None
    uploaded_by: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
