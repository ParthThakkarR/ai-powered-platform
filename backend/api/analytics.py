from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from api import deps
from models.task import Task
from models.project import Project
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
