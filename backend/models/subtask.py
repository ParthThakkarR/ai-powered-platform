from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from core.database import Base


class Subtask(Base):
    __tablename__ = "subtasks"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    is_completed = Column(Boolean, default=False)
    position = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
