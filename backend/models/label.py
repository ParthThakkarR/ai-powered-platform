from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from core.database import Base


class Label(Base):
    __tablename__ = "labels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    color = Column(String(7), nullable=False, default="#6366f1")  # hex color
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    __table_args__ = (
        UniqueConstraint("organization_id", "name", name="uq_label_org_name"),
    )


class TaskLabel(Base):
    __tablename__ = "task_labels"

    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)
    label_id = Column(Integer, ForeignKey("labels.id", ondelete="CASCADE"), primary_key=True)
