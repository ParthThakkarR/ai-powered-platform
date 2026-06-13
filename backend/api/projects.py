from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api import deps
from schemas.project import Project, ProjectCreate, ProjectUpdate
from models.project import Project as ProjectModel
from models.user import User
from services.activity import log_activity

router = APIRouter()


@router.get("/", response_model=List[Project])
def read_projects(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve projects.
    """
    projects = db.query(ProjectModel).order_by(ProjectModel.id.desc()).offset(skip).limit(limit).all()
    return projects


@router.get("/{project_id}", response_model=Project)
def get_project(
    project_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get a single project by ID.
    """
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/", response_model=Project)
def create_project(
    *,
    db: Session = Depends(deps.get_db),
    project_in: ProjectCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new project.
    """
    project = ProjectModel(**project_in.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)

    log_activity(
        db,
        user_id=current_user.id,
        action="PROJECT_CREATED",
        entity_type="Project",
        entity_id=project.id,
        details=f"Created project: {project.name}",
    )

    return project


@router.put("/{project_id}", response_model=Project)
def update_project(
    *,
    db: Session = Depends(deps.get_db),
    project_id: int,
    project_in: ProjectUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a project.
    """
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = project_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    db.add(project)
    db.commit()
    db.refresh(project)

    log_activity(
        db,
        user_id=current_user.id,
        action="PROJECT_UPDATED",
        entity_type="Project",
        entity_id=project.id,
        details=f"Updated project: {project.name}",
    )

    return project


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a project and all its tasks.
    """
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Delete associated tasks first (cascade)
    from models.task import Task
    db.query(Task).filter(Task.project_id == project_id).delete()

    log_activity(
        db,
        user_id=current_user.id,
        action="PROJECT_DELETED",
        entity_type="Project",
        entity_id=project.id,
        details=f"Deleted project: {project.name}",
    )

    db.delete(project)
    db.commit()
    return {"status": "deleted", "id": project_id}
