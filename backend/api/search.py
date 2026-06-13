from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from api import deps
from models.task import Task
from models.label import Label, TaskLabel
from models.user import User
from schemas.label import LabelOut

router = APIRouter()


@router.get("/")
def search(
    q: str = "",
    status: str = None,
    priority: str = None,
    project_id: int = None,
    limit: int = 20,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Global search across tasks."""
    query = db.query(Task)

    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                Task.title.ilike(search_term),
                Task.description.ilike(search_term),
            )
        )

    if status:
        query = query.filter(Task.status == status)

    if priority:
        query = query.filter(Task.priority == priority)

    if project_id:
        query = query.filter(Task.project_id == project_id)

    total = query.count()
    tasks = query.order_by(Task.created_at.desc()).limit(limit).all()

    results = []
    for task in tasks:
        # Get labels for each task
        labels = []
        for label in task.labels:
            labels.append(LabelOut(
                id=label.id,
                name=label.name,
                color=label.color,
                organization_id=label.organization_id,
            ))

        results.append({
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "project_id": task.project_id,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "created_at": task.created_at.isoformat() if task.created_at else None,
            "labels": labels,
        })

    return {"results": results, "total": total}
