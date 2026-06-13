from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api import deps
from models.label import Label, TaskLabel
from models.task import Task
from models.user import User
from schemas.label import LabelCreate, LabelOut

router = APIRouter()


@router.get("/", response_model=List[LabelOut])
def list_labels(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get all labels."""
    labels = db.query(Label).order_by(Label.name.asc()).all()
    return labels


@router.post("/", response_model=LabelOut)
def create_label(
    label_in: LabelCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Create a new label."""
    existing = db.query(Label).filter(Label.name == label_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Label with this name already exists")

    label = Label(name=label_in.name, color=label_in.color)
    db.add(label)
    db.commit()
    db.refresh(label)
    return label


@router.delete("/{label_id}")
def delete_label(
    label_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Delete a label."""
    label = db.query(Label).filter(Label.id == label_id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    # Remove all task-label associations first
    db.query(TaskLabel).filter(TaskLabel.label_id == label_id).delete()
    db.delete(label)
    db.commit()
    return {"status": "deleted", "id": label_id}


@router.post("/tasks/{task_id}/labels/{label_id}")
def add_label_to_task(
    task_id: int,
    label_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Add a label to a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    label = db.query(Label).filter(Label.id == label_id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")

    existing = db.query(TaskLabel).filter(
        TaskLabel.task_id == task_id, TaskLabel.label_id == label_id
    ).first()
    if existing:
        return {"status": "already_exists"}

    task_label = TaskLabel(task_id=task_id, label_id=label_id)
    db.add(task_label)
    db.commit()
    return {"status": "added"}


@router.delete("/tasks/{task_id}/labels/{label_id}")
def remove_label_from_task(
    task_id: int,
    label_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Remove a label from a task."""
    task_label = db.query(TaskLabel).filter(
        TaskLabel.task_id == task_id, TaskLabel.label_id == label_id
    ).first()
    if not task_label:
        raise HTTPException(status_code=404, detail="Label not assigned to this task")

    db.delete(task_label)
    db.commit()
    return {"status": "removed"}
