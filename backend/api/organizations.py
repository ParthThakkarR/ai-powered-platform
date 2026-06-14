from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api import deps
from schemas.organization import OrganizationCreate, OrganizationUpdate, OrganizationResponse
from models.organization import Organization as OrganizationModel
from models.team_member import TeamMember
from models.user import User
from services.activity import log_activity

router = APIRouter()


def _get_user_org_ids(db: Session, user_id: int) -> list[int]:
    """Return organization IDs the user belongs to."""
    return [
        tm.organization_id
        for tm in db.query(TeamMember.organization_id).filter(TeamMember.user_id == user_id).all()
    ]


@router.get("/", response_model=List[OrganizationResponse])
def list_organizations(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """List organizations the current user belongs to."""
    org_ids = _get_user_org_ids(db, current_user.id)
    if not org_ids:
        return []
    orgs = (
        db.query(OrganizationModel)
        .filter(OrganizationModel.id.in_(org_ids))
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
    """Get a single organization by ID (must be a member)."""
    org_ids = _get_user_org_ids(db, current_user.id)
    if org_id not in org_ids and not current_user.is_superuser:
        raise HTTPException(status_code=404, detail="Organization not found")
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
    """Create a new organization and add the creator as ADMIN."""
    org = OrganizationModel(**org_in.model_dump())
    db.add(org)
    db.flush()

    member = TeamMember(
        organization_id=org.id,
        user_id=current_user.id,
        role="ADMIN",
    )
    db.add(member)
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
    """Update an organization (must be ADMIN)."""
    org_ids = _get_user_org_ids(db, current_user.id)
    if org_id not in org_ids:
        raise HTTPException(status_code=404, detail="Organization not found")

    from models.team_member import TeamMember as TM
    is_admin = db.query(TM).filter(
        TM.organization_id == org_id,
        TM.user_id == current_user.id,
        TM.role == "ADMIN",
    ).first()
    if not is_admin and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Only admins can update organizations")

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
    """Delete an organization (must be ADMIN)."""
    org_ids = _get_user_org_ids(db, current_user.id)
    if org_id not in org_ids:
        raise HTTPException(status_code=404, detail="Organization not found")

    from models.team_member import TeamMember as TM
    is_admin = db.query(TM).filter(
        TM.organization_id == org_id,
        TM.user_id == current_user.id,
        TM.role == "ADMIN",
    ).first()
    if not is_admin and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Only admins can delete organizations")

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
