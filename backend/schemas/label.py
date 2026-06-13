from pydantic import BaseModel
from typing import Optional


class LabelCreate(BaseModel):
    name: str
    color: str = "#6366f1"


class LabelOut(BaseModel):
    id: int
    name: str
    color: str
    organization_id: Optional[int] = None

    class Config:
        from_attributes = True
