from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api import deps
from schemas.organization import OrganizationCreate, OrganizationUpdate, OrganizationResponse
from models.organization import Organization as OrganizationModel
from models.user import User
from services.activity import log_activity

router = APIRouter()


@router.get("/", response_model=List[OrganizationResponse])
def list_organizations(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """List all organizations."""
    orgs = (
        db.query(OrganizationModel)
        .order_by(OrganizationModel.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return orgs


@router.get("/{org_id}", response_model=OrganizationResponse)
def get_organization(
    org_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get a single organization by ID."""
    org = db.query(OrganizationModel).filter(OrganizationModel.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.post("/", response_model=OrganizationResponse)
def create_organization(
    *,
    db: Session = Depends(deps.get_db),
    org_in: OrganizationCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Create a new organization."""
    org = OrganizationModel(**org_in.model_dump())
    db.add(org)
    db.commit()
    db.refresh(org)

    log_activity(
        db,
        user_id=current_user.id,
        action="ORG_CREATED",
        entity_type="Organization",
        entity_id=org.id,
        details=f"Created organization: {org.name}",
    )

    return org


@router.put("/{org_id}", response_model=OrganizationResponse)
def update_organization(
    *,
    db: Session = Depends(deps.get_db),
    org_id: int,
    org_in: OrganizationUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update an organization."""
    org = db.query(OrganizationModel).filter(OrganizationModel.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    update_data = org_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(org, field, value)

    db.add(org)
    db.commit()
    db.refresh(org)

    log_activity(
        db,
        user_id=current_user.id,
        action="ORG_UPDATED",
        entity_type="Organization",
        entity_id=org.id,
        details=f"Updated organization: {org.name}",
    )

    return org


@router.delete("/{org_id}")
def delete_organization(
    org_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Delete an organization and its associated projects."""
    org = db.query(OrganizationModel).filter(OrganizationModel.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    log_activity(
        db,
        user_id=current_user.id,
        action="ORG_DELETED",
        entity_type="Organization",
        entity_id=org.id,
        details=f"Deleted organization: {org.name}",
    )

    db.delete(org)
    db.commit()
    return {"status": "deleted", "id": org_id}
