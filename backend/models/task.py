from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="TODO")  # TODO, IN_PROGRESS, REVIEW, DONE
    priority = Column(String(50), default="MEDIUM") # LOW, MEDIUM, HIGH, URGENT
    
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User")
    comments = relationship("Comment", back_populates="task", cascade="all, delete-orphan", order_by="Comment.created_at.desc()")
    labels = relationship("Label", secondary="task_labels", lazy="joined")
