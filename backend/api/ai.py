from fastapi import APIRouter, Depends, HTTPException
from typing import Any
from pydantic import BaseModel
from api import deps
from workers.tasks import generate_project_tasks, analyze_bug
from celery.result import AsyncResult
from models.user import User

router = APIRouter()

class GenerateTaskRequest(BaseModel):
    project_id: int
    description: str

class BugAnalysisRequest(BaseModel):
    error_log: str

@router.post("/generate-tasks")
def trigger_generate_tasks(
    request: GenerateTaskRequest,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Trigger background job to generate tasks from description."""
    task = generate_project_tasks.delay(request.project_id, request.description)
    return {"task_id": task.id, "status": "processing"}

@router.post("/analyze-bug")
def trigger_analyze_bug(
    request: BugAnalysisRequest,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Trigger background job to analyze a stack trace."""
    task = analyze_bug.delay(request.error_log)
    return {"task_id": task.id, "status": "processing"}

@router.get("/status/{task_id}")
def get_task_status(task_id: str, current_user: User = Depends(deps.get_current_active_user)) -> Any:
    """Check the status of a celery background task."""
    task_result = AsyncResult(task_id)
    if task_result.state == 'PENDING':
        return {"status": "PENDING"}
    elif task_result.state != 'FAILURE':
        return {"status": task_result.state, "result": task_result.result}
    else:
        return {"status": "FAILURE", "error": str(task_result.info)}
