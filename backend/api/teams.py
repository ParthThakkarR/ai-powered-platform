from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api import deps
from models.team_member import TeamMember
from models.user import User
from models.organization import Organization
from schemas.team import TeamMemberInvite, TeamMemberUpdate, TeamMemberOut
from services.activity import log_activity

router = APIRouter()


@router.get("/members", response_model=List[TeamMemberOut])
def list_team_members(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get all team members in user's organization."""
    org = db.query(Organization).first()
    if not org:
        return []

    members = (
        db.query(TeamMember)
        .filter(TeamMember.organization_id == org.id)
        .all()
    )

    result = []
    for m in members:
        result.append(TeamMemberOut(
            id=m.id,
            organization_id=m.organization_id,
            user_id=m.user_id,
            role=m.role,
            joined_at=m.joined_at,
            user_email=m.user.email if m.user else None,
            user_name=m.user.full_name if m.user else None,
        ))
    return result


@router.post("/invite")
def invite_member(
    invite_in: TeamMemberInvite,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Invite a team member by email."""
    org = db.query(Organization).first()
    if not org:
        raise HTTPException(status_code=400, detail="No organization found")

    # Check if user is admin
    admin_member = db.query(TeamMember).filter(
        TeamMember.organization_id == org.id,
        TeamMember.user_id == current_user.id,
        TeamMember.role == "ADMIN",
    ).first()
    if not admin_member and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Only admins can invite members")

    # Find user by email
    user = db.query(User).filter(User.email == invite_in.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found. They must register first.")

    # Check if already a member
    existing = db.query(TeamMember).filter(
        TeamMember.organization_id == org.id,
        TeamMember.user_id == user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a team member")

    member = TeamMember(
        organization_id=org.id,
        user_id=user.id,
        role=invite_in.role,
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    log_activity(
        db,
        user_id=current_user.id,
        action="MEMBER_INVITED",
        entity_type="Organization",
        entity_id=org.id,
        details=f"Invited {user.email} as {invite_in.role}",
    )

    return {"status": "success", "message": f"Invitation sent to {user.email}"}


@router.put("/members/{member_id}", response_model=TeamMemberOut)
def update_member_role(
    member_id: int,
    update_in: TeamMemberUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update a team member's role."""
    org = db.query(Organization).first()
    if not org:
        raise HTTPException(status_code=400, detail="No organization found")

    admin_member = db.query(TeamMember).filter(
        TeamMember.organization_id == org.id,
        TeamMember.user_id == current_user.id,
        TeamMember.role == "ADMIN",
    ).first()
    if not admin_member and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Only admins can change roles")

    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    member.role = update_in.role
    db.commit()
    db.refresh(member)

    return TeamMemberOut(
        id=member.id,
        organization_id=member.organization_id,
        user_id=member.user_id,
        role=member.role,
        joined_at=member.joined_at,
        user_email=member.user.email if member.user else None,
        user_name=member.user.full_name if member.user else None,
    )


@router.delete("/members/{member_id}")
def remove_member(
    member_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Remove a team member."""
    org = db.query(Organization).first()
    if not org:
        raise HTTPException(status_code=400, detail="No organization found")

    admin_member = db.query(TeamMember).filter(
        TeamMember.organization_id == org.id,
        TeamMember.user_id == current_user.id,
        TeamMember.role == "ADMIN",
    ).first()
    if not admin_member and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Only admins can remove members")

    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    db.delete(member)
    db.commit()
    return {"status": "deleted", "id": member_id}
