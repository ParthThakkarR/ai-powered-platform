from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from core.config import settings
from core.rate_limit import limiter
from api.api import api_router
from models import User, Organization, Project, Task, ActivityLog
import logging
import time

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("aiflow")

# Rate limiter

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Request timing + error handling
@app.middleware("http")
async def middleware(request: Request, call_next):
    start = time.time()
    try:
        response = await call_next(request)
        duration = time.time() - start
        if duration > 5:
            logger.warning(f"Slow request: {request.method} {request.url.path} took {duration:.2f}s")
        return response
    except Exception as exc:
        logger.error(f"Unhandled error: {request.method} {request.url.path} - {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal error occurred. Please try again."},
        )

# Validation error handler
from fastapi.exceptions import RequestValidationError
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": "Invalid request data. Please check your input."},
    )

# Security headers
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
def health_check():
    return {"status": "ok"}
