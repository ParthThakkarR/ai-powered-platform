from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api import deps
from models.sprint import Sprint
from models.task import Task
from models.project import Project
from models.user import User
from schemas.sprint import SprintCreate, SprintUpdate, SprintOut
from services.activity import log_activity

router = APIRouter()


@router.get("/project/{project_id}", response_model=List[SprintOut])
def list_sprints(
    project_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    org_id = deps.get_project_org_id(db, project_id)
    deps.verify_org_role(db, current_user.id, org_id, "VIEWER", current_user.is_superuser)

    sprints = db.query(Sprint).filter(Sprint.project_id == project_id).order_by(Sprint.start_date.desc()).all()
    return sprints


@router.post("/project/{project_id}", response_model=SprintOut)
def create_sprint(
    project_id: int,
    sprint_in: SprintCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    org_id = deps.get_project_org_id(db, project_id)
    deps.verify_org_role(db, current_user.id, org_id, "MEMBER", current_user.is_superuser)

    sprint = Sprint(project_id=project_id, **sprint_in.model_dump())
    db.add(sprint)
    db.commit()
    db.refresh(sprint)
    log_activity(db, user_id=current_user.id, action="SPRINT_CREATED", entity_type="Sprint", entity_id=sprint.id, details=f"Created sprint: {sprint.name}")
    return sprint


@router.put("/{sprint_id}", response_model=SprintOut)
def update_sprint(
    sprint_id: int,
    sprint_in: SprintUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")

    org_id = deps.get_project_org_id(db, sprint.project_id)
    deps.verify_org_role(db, current_user.id, org_id, "MEMBER", current_user.is_superuser)

    update_data = sprint_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sprint, field, value)
    db.add(sprint)
    db.commit()
    db.refresh(sprint)
    return sprint


@router.delete("/{sprint_id}")
def delete_sprint(
    sprint_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")

    org_id = deps.get_project_org_id(db, sprint.project_id)
    deps.verify_org_role(db, current_user.id, org_id, "ADMIN", current_user.is_superuser)

    db.delete(sprint)
    db.commit()
    return {"status": "deleted", "id": sprint_id}


@router.post("/{sprint_id}/tasks/{task_id}")
def add_task_to_sprint(
    sprint_id: int,
    task_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")

    org_id = deps.get_project_org_id(db, sprint.project_id)
    deps.verify_org_role(db, current_user.id, org_id, "MEMBER", current_user.is_superuser)

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.sprint_id = sprint_id
    db.add(task)
    db.commit()
    return {"status": "added", "task_id": task_id, "sprint_id": sprint_id}


@router.delete("/{sprint_id}/tasks/{task_id}")
def remove_task_from_sprint(
    sprint_id: int,
    task_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")

    org_id = deps.get_project_org_id(db, sprint.project_id)
    deps.verify_org_role(db, current_user.id, org_id, "MEMBER", current_user.is_superuser)

    task = db.query(Task).filter(Task.id == task_id, Task.sprint_id == sprint_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found in this sprint")
    task.sprint_id = None
    db.add(task)
    db.commit()
    return {"status": "removed", "task_id": task_id}
