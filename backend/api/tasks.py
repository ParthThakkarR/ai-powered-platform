from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api import deps
from schemas.task import Task, TaskCreate, TaskUpdate
from models.task import Task as TaskModel
from models.user import User
from models.notification import Notification
from services.activity import log_activity

router = APIRouter()


@router.get("/project/{project_id}", response_model=List[Task])
def read_tasks_by_project(
    project_id: int,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve tasks for a specific project.
    """
    tasks = (
        db.query(TaskModel)
        .filter(TaskModel.project_id == project_id)
        .order_by(TaskModel.id.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return tasks


@router.get("/{task_id}", response_model=Task)
def get_task(
    task_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get a single task by ID.
    """
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/", response_model=Task)
def create_task(
    *,
    db: Session = Depends(deps.get_db),
    task_in: TaskCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new task.
    """
    task = TaskModel(**task_in.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)

    log_activity(
        db,
        user_id=current_user.id,
        action="TASK_CREATED",
        entity_type="Task",
        entity_id=task.id,
        details=f"Created task: {task.title}",
    )

    if task_in.assignee_id and task_in.assignee_id != current_user.id:
        notif = Notification(
            user_id=task_in.assignee_id,
            content=f"You have been assigned to task: {task.title}",
            link=f"/projects/{task.project_id}/board",
        )
        db.add(notif)
        db.commit()

    return task


@router.put("/{task_id}", response_model=Task)
def update_task(
    *,
    db: Session = Depends(deps.get_db),
    task_id: int,
    task_in: TaskUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a task status or details.
    """
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task_in.model_dump(exclude_unset=True)
    old_status = task.status
    old_assignee_id = task.assignee_id

    for field, value in update_data.items():
        setattr(task, field, value)

    db.add(task)
    db.commit()
    db.refresh(task)

    # Notification when assignee changes
    if "assignee_id" in update_data and update_data["assignee_id"] and update_data["assignee_id"] != current_user.id:
        notif = Notification(
            user_id=update_data["assignee_id"],
            content=f"You have been assigned to task: {task.title}",
            link=f"/projects/{task.project_id}/board",
        )
        db.add(notif)
        db.commit()

    # Log status transition specifically if it changed
    if "status" in update_data and update_data["status"] != old_status:
        log_activity(
            db,
            user_id=current_user.id,
            action="TASK_STATUS_CHANGED",
            entity_type="Task",
            entity_id=task.id,
            details=f"Status changed: {old_status} → {task.status}",
        )
        if task.assignee_id and task.assignee_id != current_user.id:
            notif = Notification(
                user_id=task.assignee_id,
                content=f"Task '{task.title}' status changed: {old_status} → {task.status}",
                link=f"/projects/{task.project_id}/board",
            )
            db.add(notif)
            db.commit()
    else:
        log_activity(
            db,
            user_id=current_user.id,
            action="TASK_UPDATED",
            entity_type="Task",
            entity_id=task.id,
            details=f"Updated task: {task.title}",
        )

    return task


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a task.
    """
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    log_activity(
        db,
        user_id=current_user.id,
        action="TASK_DELETED",
        entity_type="Task",
        entity_id=task.id,
        details=f"Deleted task: {task.title}",
    )

    db.delete(task)
    db.commit()
    return {"status": "deleted", "id": task_id}
