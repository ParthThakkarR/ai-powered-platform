from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from core.config import settings
from api.api import api_router
from models import User, Organization, Project, Task, ActivityLog
import traceback

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Robust CORS Configuration
origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]
if "*" in origins:
    allow_credentials = False
else:
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler to catch 500s and log them to terminal
@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    print(f"--- INCOMING REQUEST: {request.method} {request.url.path} ---")
    try:
        response = await call_next(request)
        print(f"--- RESPONSE STATUS: {response.status_code} ---")
        return response
    except Exception as exc:
        print("--- CRITICAL BACKEND ERROR ---")
        print(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error", "error": str(exc)},
            headers={"Access-Control-Allow-Origin": "*"}
        )

from fastapi.exceptions import RequestValidationError
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"--- 422 VALIDATION ERROR ---")
    print(exc.errors())
    print(exc.body)
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {"status": "ok"}
