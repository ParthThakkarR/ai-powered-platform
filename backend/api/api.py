from fastapi import APIRouter
from api import auth, projects, tasks, ai, analytics, organizations, comments, labels, search, teams, notifications, activity, subtasks, sprints, attachments

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(organizations.router, prefix="/orgs", tags=["organizations"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(comments.router, prefix="/tasks", tags=["comments"])
api_router.include_router(labels.router, prefix="/labels", tags=["labels"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(teams.router, prefix="/teams", tags=["teams"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(activity.router, prefix="/activity", tags=["activity"])
api_router.include_router(subtasks.router, prefix="/subtasks", tags=["subtasks"])
api_router.include_router(sprints.router, prefix="/sprints", tags=["sprints"])
api_router.include_router(attachments.router, prefix="/attachments", tags=["attachments"])
