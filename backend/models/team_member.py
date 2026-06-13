from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database import Base


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(20), nullable=False, default="MEMBER")  # ADMIN, MEMBER, VIEWER
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", lazy="joined")
    organization = relationship("Organization")

    __table_args__ = (
        UniqueConstraint("organization_id", "user_id", name="uq_team_org_user"),
    )
