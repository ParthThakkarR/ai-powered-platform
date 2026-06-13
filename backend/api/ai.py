from fastapi import APIRouter, Depends, HTTPException
from typing import Any
from pydantic import BaseModel
from api import deps
from workers.tasks import generate_project_tasks, analyze_bug
from models.user import User
import uuid
import time
import threading

router = APIRouter()


class GenerateTaskRequest(BaseModel):
    project_id: int
    description: str


class BugAnalysisRequest(BaseModel):
    error_log: str


# Thread-safe in-memory store with TTL eviction
class TTLCache:
    def __init__(self, ttl_seconds=3600, max_size=1000):
        self._store: dict[str, tuple[Any, float]] = {}
        self._lock = threading.Lock()
        self._ttl = ttl_seconds
        self._max_size = max_size

    def set(self, key: str, value: Any):
        with self._lock:
            self._evict_expired()
            if len(self._store) >= self._max_size:
                self._evict_oldest()
            self._store[key] = (value, time.time())

    def get(self, key: str) -> Any | None:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, ts = entry
            if time.time() - ts > self._ttl:
                del self._store[key]
                return None
            return value

    def _evict_expired(self):
        now = time.time()
        expired = [k for k, (_, ts) in self._store.items() if now - ts > self._ttl]
        for k in expired:
            del self._store[k]

    def _evict_oldest(self):
        if self._store:
            oldest_key = min(self._store, key=lambda k: self._store[k][1])
            del self._store[oldest_key]


ai_results_cache = TTLCache(ttl_seconds=3600, max_size=500)


@router.post("/generate-tasks")
def trigger_generate_tasks(
    request: GenerateTaskRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    task_id = str(uuid.uuid4())
    result = generate_project_tasks(request.project_id, request.description)
    ai_results_cache.set(task_id, {"status": "SUCCESS", "result": result})
    return {"task_id": task_id, "status": "processing"}


@router.post("/analyze-bug")
def trigger_analyze_bug(
    request: BugAnalysisRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    task_id = str(uuid.uuid4())
    result = analyze_bug(request.error_log)
    ai_results_cache.set(task_id, {"status": "SUCCESS", "result": result})
    return {"task_id": task_id, "status": "processing"}


@router.get("/status/{task_id}")
def get_task_status(
    task_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    result = ai_results_cache.get(task_id)
    if result:
        return result
    return {"status": "FAILURE", "error": "Task not found or expired"}
