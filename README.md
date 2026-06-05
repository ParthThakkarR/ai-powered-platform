# AIFlow

A production-grade, AI-powered project and engineering workflow management platform.

## Architecture

- **Frontend:** React, TailwindCSS, Zustand
- **Backend:** FastAPI, MSSQL, Redis, Celery
- **Database:** Microsoft SQL Server (MSSQL)

## Quick Start (Docker)

Ensure Docker and Docker Compose are installed.

```bash
docker-compose up --build
```

Services exposed:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- MSSQL: localhost:1433
- Redis: localhost:6379
