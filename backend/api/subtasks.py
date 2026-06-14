from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api import deps
from models.subtask import Subtask
from models.task import Task
from models.user import User
from schemas.subtask import SubtaskCreate, SubtaskUpdate, SubtaskOut

router = APIRouter()


@router.get("/task/{task_id}", response_model=List[SubtaskOut])
def list_subtasks(
    task_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """List all subtasks for a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    subtasks = (
        db.query(Subtask)
        .filter(Subtask.task_id == task_id)
        .order_by(Subtask.position, Subtask.id)
        .all()
    )
    return subtasks


@router.post("/task/{task_id}", response_model=SubtaskOut)
def create_subtask(
    task_id: int,
    subtask_in: SubtaskCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Create a subtask for a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    subtask = Subtask(
        task_id=task_id,
        title=subtask_in.title,
        position=subtask_in.position or 0,
    )
    db.add(subtask)
    db.commit()
    db.refresh(subtask)
    return subtask


@router.put("/{subtask_id}", response_model=SubtaskOut)
def update_subtask(
    subtask_id: int,
    subtask_in: SubtaskUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update a subtask."""
    subtask = db.query(Subtask).filter(Subtask.id == subtask_id).first()
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")
    update_data = subtask_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(subtask, field, value)
    db.add(subtask)
    db.commit()
    db.refresh(subtask)
    return subtask


@router.delete("/{subtask_id}")
def delete_subtask(
    subtask_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Delete a subtask."""
    subtask = db.query(Subtask).filter(Subtask.id == subtask_id).first()
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")
    db.delete(subtask)
    db.commit()
    return {"status": "deleted", "id": subtask_id}
