from typing import List
from pydantic_settings import BaseSettings
import os
import secrets


class Settings(BaseSettings):
    PROJECT_NAME: str = "AIFlow API"
    API_V1_STR: str = "/api/v1"

    # CORS - restrict in production
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Database
    DATABASE_URL: str = f"sqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'aiflow.db'))}"

    # Redis & Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # Security - MUST be set in production
    SECRET_KEY: str = ""

    # JWT
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    JWT_ISSUER: str = "aiflow"
    JWT_AUDIENCE: str = "aiflow"

    # AI
    OPENAI_API_KEY: str = ""

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    def model_post_init(self, __context) -> None:
        if not self.SECRET_KEY:
            self.SECRET_KEY = secrets.token_hex(32)

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
