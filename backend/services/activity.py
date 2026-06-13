from sqlalchemy.orm import Session
from models.activity_log import ActivityLog


def log_activity(
    db: Session,
    user_id: int,
    action: str,
    entity_type: str = None,
    entity_id: int = None,
    details: str = None,
):
    """
    Record an activity log entry. Called after any significant user action:
    - Task created/updated/deleted
    - Status transitions
    - Priority changes
    - Project created/deleted
    - AI features used
    """
    entry = ActivityLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_recent_activity(db: Session, limit: int = 50):
    """Get the most recent activity log entries."""
    return (
        db.query(ActivityLog)
        .order_by(ActivityLog.created_at.desc())
        .limit(limit)
        .all()
    )


def get_activity_for_entity(db: Session, entity_type: str, entity_id: int, limit: int = 20):
    """Get activity logs for a specific entity (e.g., a project or task)."""
    return (
        db.query(ActivityLog)
        .filter(
            ActivityLog.entity_type == entity_type,
            ActivityLog.entity_id == entity_id,
        )
        .order_by(ActivityLog.created_at.desc())
        .limit(limit)
        .all()
    )
