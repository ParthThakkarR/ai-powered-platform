from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from api import deps
from models.attachment import Attachment
from models.task import Task
from models.user import User
from schemas.attachment import AttachmentOut
import os
import uuid

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/task/{task_id}", response_model=List[AttachmentOut])
def list_attachments(
    task_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return db.query(Attachment).filter(Attachment.task_id == task_id).order_by(Attachment.created_at.desc()).all()


@router.get("/download/{attachment_id}")
def download_attachment(
    attachment_id: int,
    db: Session = Depends(deps.get_db),
    token: Optional[str] = Query(None),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Download an attachment file. Accepts Bearer token or ?token= query param."""
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    file_path = os.path.join(UPLOAD_DIR, attachment.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(
        path=file_path,
        filename=attachment.original_filename,
        media_type=attachment.content_type or "application/octet-stream",
    )


@router.post("/task/{task_id}", response_model=AttachmentOut)
async def upload_attachment(
    task_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    ext = os.path.splitext(file.filename or '')[1]
    safe_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    attachment = Attachment(
        task_id=task_id,
        filename=safe_filename,
        original_filename=file.filename or 'upload',
        content_type=file.content_type,
        size=len(content),
        uploaded_by=current_user.id,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment


@router.delete("/{attachment_id}")
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    file_path = os.path.join(UPLOAD_DIR, attachment.filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    db.delete(attachment)
    db.commit()
    return {"status": "deleted", "id": attachment_id}
