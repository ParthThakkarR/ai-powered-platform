from core.celery_app import celery_app
from services.ai_service import generate_tasks_from_description, analyze_bug_trace
from core.database import SessionLocal
from models.task import Task
from models.project import Project

@celery_app.task(name="generate_project_tasks")
def generate_project_tasks(project_id: int, description: str):
    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return {"status": "error", "message": "Project not found"}
            
        generated_tasks = generate_tasks_from_description(description)
        
        created_count = 0
        for t in generated_tasks:
            new_task = Task(
                title=t.get("title"),
                description=t.get("description"),
                priority=t.get("priority", "MEDIUM"),
                project_id=project_id,
                status="TODO"
            )
            db.add(new_task)
            created_count += 1
            
        db.commit()
        return {"status": "success", "tasks_created": created_count}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@celery_app.task(name="analyze_bug")
def analyze_bug(error_log: str):
    try:
        analysis = analyze_bug_trace(error_log)
        return {"status": "success", "analysis": analysis}
    except Exception as e:
        return {"status": "error", "message": str(e)}
