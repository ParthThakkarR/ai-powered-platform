import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from main import app
from core.database import Base
from api.deps import get_db
from core.rate_limit import limiter
from models.user import User
from models.organization import Organization
from models.project import Project
from models.task import Task
from models.label import Label, TaskLabel
from models.comment import Comment
from models.team_member import TeamMember
from models.notification import Notification
from core.security import get_password_hash, create_access_token

# In-memory SQLite for tests
TEST_DATABASE_URL = "sqlite://"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    # Reset the rate limiter state between tests
    try:
        limiter._storage.reset()
    except (AttributeError, TypeError):
        pass


@pytest.fixture
def db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client():
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def test_user(db):
    user = User(
        email="test@aiflow.dev",
        hashed_password=get_password_hash("TestPass123!"),
        full_name="Test User",
        is_active=True,
        is_superuser=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user):
    token = create_access_token(test_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_org(db, test_user):
    org = Organization(name="Test Org", description="Test")
    db.add(org)
    db.commit()
    db.refresh(org)
    # Add user as team member
    member = TeamMember(organization_id=org.id, user_id=test_user.id, role="ADMIN")
    db.add(member)
    db.commit()
    return org


@pytest.fixture
def test_project(db, test_org):
    project = Project(
        name="Test Project",
        description="A test project",
        organization_id=test_org.id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@pytest.fixture
def test_task(db, test_project):
    task = Task(
        title="Test Task",
        description="A test task",
        status="TODO",
        priority="MEDIUM",
        project_id=test_project.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task
