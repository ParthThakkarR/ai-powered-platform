from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api import deps
from schemas.project import Project, ProjectCreate, ProjectUpdate
from models.project import Project as ProjectModel
from models.team_member import TeamMember
from models.user import User
from services.activity import log_activity

router = APIRouter()


def _get_user_org_ids(db: Session, user_id: int) -> list[int]:
    return [
        tm.organization_id
        for tm in db.query(TeamMember.organization_id).filter(TeamMember.user_id == user_id).all()
    ]


@router.get("/", response_model=List[Project])
def read_projects(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Retrieve projects in organizations the user belongs to."""
    org_ids = _get_user_org_ids(db, current_user.id)
    if not org_ids:
        return []
    projects = (
        db.query(ProjectModel)
        .filter(ProjectModel.organization_id.in_(org_ids))
        .order_by(ProjectModel.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return projects


@router.get("/{project_id}", response_model=Project)
def get_project(
    project_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get a single project by ID (must be in user's org)."""
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    org_ids = _get_user_org_ids(db, current_user.id)
    if project.organization_id not in org_ids and not current_user.is_superuser:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/", response_model=Project)
def create_project(
    *,
    db: Session = Depends(deps.get_db),
    project_in: ProjectCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Create new project (must be MEMBER or ADMIN in the target organization)."""
    deps.verify_org_role(db, current_user.id, project_in.organization_id, "MEMBER", current_user.is_superuser)

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
    """Update a project (must be MEMBER or ADMIN in the project's org)."""
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    deps.verify_org_role(db, current_user.id, project.organization_id, "MEMBER", current_user.is_superuser)

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
    """Delete a project and all its tasks (must be ADMIN in the project's org)."""
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    deps.verify_org_role(db, current_user.id, project.organization_id, "ADMIN", current_user.is_superuser)

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
