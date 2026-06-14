from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from api import deps
from models.task import Task
from models.project import Project
from models.sprint import Sprint
from models.user import User

router = APIRouter()

@router.get("/")
def get_analytics(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Retrieve global platform analytics.
    """
    total_projects = db.query(Project).count()
    
    task_stats = db.query(
        Task.status, 
        func.count(Task.id)
    ).group_by(Task.status).all()
    
    formatted_task_stats = {stat[0]: stat[1] for stat in task_stats}
    total_tasks = sum(formatted_task_stats.values())
    
    completion_rate = 0
    if total_tasks > 0:
        completed = formatted_task_stats.get('DONE', 0)
        completion_rate = round((completed / total_tasks) * 100, 1)

    return {
        "total_projects": total_projects,
        "total_tasks": total_tasks,
        "task_breakdown": formatted_task_stats,
        "completion_rate": completion_rate
    }

@router.get("/project/{project_id}")
def get_project_analytics(
    project_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Get analytics for a specific project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    task_stats = db.query(
        Task.status,
        func.count(Task.id)
    ).filter(Task.project_id == project_id).group_by(Task.status).all()

    formatted_task_stats = {stat[0]: stat[1] for stat in task_stats}
    total_tasks = sum(formatted_task_stats.values())

    completion_rate = 0
    if total_tasks > 0:
        completed = formatted_task_stats.get('DONE', 0)
        completion_rate = round((completed / total_tasks) * 100, 1)

    from datetime import datetime, timezone
    overdue = db.query(Task).filter(
        Task.project_id == project_id,
        Task.due_date < datetime.now(timezone.utc),
        Task.status != 'DONE'
    ).count()

    return {
        "project_id": project_id,
        "project_name": project.name,
        "total_tasks": total_tasks,
        "task_breakdown": formatted_task_stats,
        "completion_rate": completion_rate,
        "overdue_tasks": overdue,
    }


@router.get("/sprint/{sprint_id}/burndown")
def get_sprint_burndown(
    sprint_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get burndown data for a sprint."""
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")

    total_tasks = db.query(Task).filter(Task.sprint_id == sprint_id).count()
    done_tasks = db.query(Task).filter(Task.sprint_id == sprint_id, Task.status == "DONE").count()
    in_progress = db.query(Task).filter(Task.sprint_id == sprint_id, Task.status == "IN_PROGRESS").count()
    todo_tasks = db.query(Task).filter(Task.sprint_id == sprint_id, Task.status == "TODO").count()
    review_tasks = db.query(Task).filter(Task.sprint_id == sprint_id, Task.status == "REVIEW").count()

    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    start = sprint.start_date.replace(tzinfo=timezone.utc) if sprint.start_date.tzinfo is None else sprint.start_date
    end = sprint.end_date.replace(tzinfo=timezone.utc) if sprint.end_date.tzinfo is None else sprint.end_date
    total_days = max((end - start).days, 1)
    elapsed_days = max(min((now - start).days, total_days), 0)
    ideal_remaining = round(total_tasks * (1 - elapsed_days / total_days))

    return {
        "sprint_id": sprint_id,
        "sprint_name": sprint.name,
        "total_tasks": total_tasks,
        "done": done_tasks,
        "in_progress": in_progress,
        "todo": todo_tasks,
        "review": review_tasks,
        "remaining": total_tasks - done_tasks,
        "ideal_remaining": ideal_remaining,
        "progress_pct": round((done_tasks / total_tasks) * 100, 1) if total_tasks > 0 else 0,
        "velocity": done_tasks,
        "days_total": total_days,
        "days_elapsed": elapsed_days,
    }


@router.get("/sprint/{sprint_id}/velocity")
def get_sprint_velocity(
    sprint_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get velocity stats for a sprint."""
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")

    total = db.query(Task).filter(Task.sprint_id == sprint_id).count()
    done = db.query(Task).filter(Task.sprint_id == sprint_id, Task.status == "DONE").count()
    points_total = total * 1  # each task = 1 point for simplicity
    points_done = done * 1

    return {
        "sprint_id": sprint_id,
        "tasks_total": total,
        "tasks_done": done,
        "points_total": points_total,
        "points_done": points_done,
    }
