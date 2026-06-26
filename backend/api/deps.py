from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session
from core import security, database
from core.config import settings
from models.user import User
from models.team_member import TeamMember
from models.project import Project
from schemas.token import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


def get_db() -> Generator:
    try:
        db = database.SessionLocal()
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"],
            issuer=settings.JWT_ISSUER,
            audience=settings.JWT_AUDIENCE,
        )
        token_data = TokenPayload(**payload)
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    except ValidationError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    user = db.query(User).filter(User.id == token_data.sub).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    return current_user


# ===== RBAC Helpers =====

ROLE_HIERARCHY = {"VIEWER": 0, "MEMBER": 1, "ADMIN": 2}


def get_user_org_role(db: Session, user_id: int, org_id: int) -> Optional[str]:
    """Get the user's role in an organization, or None if not a member."""
    member = (
        db.query(TeamMember)
        .filter(TeamMember.user_id == user_id, TeamMember.organization_id == org_id)
        .first()
    )
    return member.role if member else None


def verify_org_role(
    db: Session,
    user_id: int,
    org_id: int,
    min_role: str = "VIEWER",
    is_superuser: bool = False,
) -> TeamMember:
    """Verify user has at least min_role in the org. Raises 403 if not."""
    if is_superuser:
        return None

    member = (
        db.query(TeamMember)
        .filter(TeamMember.user_id == user_id, TeamMember.organization_id == org_id)
        .first()
    )
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this organization",
        )

    user_level = ROLE_HIERARCHY.get(member.role, -1)
    min_level = ROLE_HIERARCHY.get(min_role, 0)
    if user_level < min_level:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Requires {min_role} role or higher",
        )

    return member


def require_org_role(min_role: str = "VIEWER"):
    """Dependency factory: verify current user has at least min_role in the org.
    Use this when org_id is a path parameter.
    """
    role_hierarchy = ROLE_HIERARCHY
    min_level = role_hierarchy.get(min_role, 0)

    def dependency(
        org_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
    ) -> None:
        verify_org_role(db, current_user.id, org_id, min_role, current_user.is_superuser)

    return dependency


def get_project_org_id(db: Session, project_id: int) -> int:
    """Look up the organization_id for a project. Raises 404 if not found."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project.organization_id
