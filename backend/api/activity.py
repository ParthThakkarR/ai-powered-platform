from typing import Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from api import deps
from models.activity_log import ActivityLog
from models.user import User
from schemas.activity import ActivityLogOut

router = APIRouter()

@router.get("/", response_model=List[ActivityLogOut])
def list_activity(
    project_id: int = None,
    task_id: int = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """List activity logs, optionally filtered by project or task."""
    query = db.query(ActivityLog)
    if task_id:
        query = query.filter(ActivityLog.entity_type == "Task", ActivityLog.entity_id == task_id)
    elif project_id:
        query = query.filter(ActivityLog.entity_id == project_id)
    logs = query.order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    result = []
    for log in logs:
        result.append(ActivityLogOut(
            id=log.id,
            user_id=log.user_id,
            action=log.action,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            details=log.details,
            created_at=log.created_at,
            user_name=log.user.full_name if log.user else None,
        ))
    return result