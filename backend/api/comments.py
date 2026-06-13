from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api import deps
from models.comment import Comment
from models.task import Task
from models.user import User
from models.notification import Notification
from schemas.comment import CommentCreate, CommentOut
from services.activity import log_activity

router = APIRouter()


@router.get("/{task_id}/comments", response_model=List[CommentOut])
def get_task_comments(
    task_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get all comments for a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    comments = (
        db.query(Comment)
        .filter(Comment.task_id == task_id)
        .order_by(Comment.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []
    for c in comments:
        result.append(CommentOut(
            id=c.id,
            task_id=c.task_id,
            user_id=c.user_id,
            content=c.content,
            created_at=c.created_at,
            updated_at=c.updated_at,
            user_name=c.user.full_name if c.user else None,
            user_email=c.user.email if c.user else None,
        ))
    return result


@router.post("/{task_id}/comments", response_model=CommentOut)
def create_comment(
    task_id: int,
    comment_in: CommentCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Add a comment to a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    comment = Comment(
        task_id=task_id,
        user_id=current_user.id,
        content=comment_in.content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    log_activity(
        db,
        user_id=current_user.id,
        action="COMMENT_ADDED",
        entity_type="Task",
        entity_id=task_id,
        details=f"Commented on task: {task.title}",
    )

    # Create notification for task assignee (if different from commenter)
    if task.assignee_id and task.assignee_id != current_user.id:
        notif = Notification(
            user_id=task.assignee_id,
            content=f"{current_user.full_name} commented on '{task.title}'",
            link=f"/projects/{task.project_id}/board",
        )
        db.add(notif)
        db.commit()

    return CommentOut(
        id=comment.id,
        task_id=comment.task_id,
        user_id=comment.user_id,
        content=comment.content,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        user_name=current_user.full_name,
        user_email=current_user.email,
    )


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Delete a comment (only author can delete)."""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    db.delete(comment)
    db.commit()
    return {"status": "deleted", "id": comment_id}
