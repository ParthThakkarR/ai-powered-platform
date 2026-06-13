from fastapi import APIRouter, Depends, HTTPException
from typing import Any
from pydantic import BaseModel
from api import deps
from workers.tasks import generate_project_tasks, analyze_bug
from models.user import User
import uuid

router = APIRouter()

class GenerateTaskRequest(BaseModel):
    project_id: int
    description: str

class BugAnalysisRequest(BaseModel):
    error_log: str

# In-memory store to fake Celery async polling
fake_celery_results = {}

@router.post("/generate-tasks")
def trigger_generate_tasks(
    request: GenerateTaskRequest,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Run generation synchronously and fake async status."""
    task_id = str(uuid.uuid4())
    result = generate_project_tasks(request.project_id, request.description)
    # The frontend expects status SUCCESS and the inner result
    fake_celery_results[task_id] = {"status": "SUCCESS", "result": result}
    return {"task_id": task_id, "status": "processing"}

@router.post("/analyze-bug")
def trigger_analyze_bug(
    request: BugAnalysisRequest,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Run bug analysis synchronously and fake async status."""
    task_id = str(uuid.uuid4())
    result = analyze_bug(request.error_log)
    fake_celery_results[task_id] = {"status": "SUCCESS", "result": result}
    return {"task_id": task_id, "status": "processing"}

@router.get("/status/{task_id}")
def get_task_status(task_id: str, current_user: User = Depends(deps.get_current_active_user)) -> Any:
    """Return faked task status."""
    if task_id in fake_celery_results:
        return fake_celery_results[task_id]
    return {"status": "FAILURE", "error": "Task not found"}
