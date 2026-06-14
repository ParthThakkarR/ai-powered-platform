# AIFlow

A production-grade, AI-powered project and engineering workflow management platform.

## Architecture

- **Frontend:** React, TypeScript, TailwindCSS, Zustand
- **Backend:** FastAPI, SQLAlchemy, SQLite (dev) / PostgreSQL (prod)
- **AI:** OpenAI GPT-4 integration (with smart mock fallback)
- **Queue:** Celery + Redis for async task processing

## Features

- Project & task management with Kanban board
- Sprint planning with burndown charts
- AI-powered task generation and bug analysis
- Team management with RBAC (Admin / Member / Viewer)
- Google OAuth2 authentication
- Real-time notifications
- File attachments
- Rich text editor
- Dark/Light theme
- Activity audit log

## Quick Start (Docker)

Ensure Docker and Docker Compose are installed.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Edit .env files to set SECRET_KEY and GOOGLE_CLIENT_ID

docker-compose up --build
```

Services exposed:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Redis: localhost:6379

## Quick Start (Local)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Environment Variables

### Backend (.env)
| Variable | Required | Description |
|---|---|---|
| SECRET_KEY | Yes | JWT signing key (min 32 chars) |
| DATABASE_URL | No | SQLite default, set for PostgreSQL |
| GOOGLE_CLIENT_ID | No | Google OAuth client ID |
| OPENAI_API_KEY | No | OpenAI API key (falls back to mocks) |
| REDIS_URL | No | Redis URL for Celery queue |

### Frontend (.env.local)
| Variable | Required | Description |
|---|---|---|
| VITE_API_URL | No | Backend API URL (default: http://localhost:8000/api/v1) |
| VITE_GOOGLE_CLIENT_ID | No | Google OAuth client ID |

## Testing

```bash
# Backend
cd backend && pytest -v

# Frontend
cd frontend && npm test
```

## Deployment

Supported platforms:
- **Docker Compose** — `docker-compose up --build`
- **Render** — Uses `render.yaml`
- **Railway** — Uses `railway.toml`
- **Vercel** — Frontend only, uses `vercel.json`

