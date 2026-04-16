# Smart AI Event Assistant

A full-stack event planning platform with AI-assisted workflows for event design, organizer matching, and invitation/image generation.

This repository contains:
- Go backend API (`:8080`)
- React + Vite frontend (`:5173`)
- Python AI service (`:8081`)

## 1. Features

- Event lifecycle management (create, update, delete, list)
- Organizer, venue, portfolio, and review modules
- Favorites, notifications, comments, and reports
- Authentication (login + password reset flows)
- AI assistant chat for event planning
- AI image generation (theme / invitation)
- AI organizer matching by semantic similarity

## 2. Tech Stack

### Backend
- Go (Gin)
- GORM + MySQL
- CORS middleware
- SendGrid / SMTP email integrations

### Frontend
- React 19
- Vite
- React Router

### AI Service
- Python + Flask
- Hugging Face Inference
- sentence-transformers + scikit-learn
- MySQL connector

## 3. Repository Structure

```text
backend/
  cmd/
    api/           # Main Go API entrypoint
    migrate/       # Migration utility
  internal/
    config/
    domain/
    infrastructure/
    interfaces/
    usecase/
frontend/
  src/
  public/
go.mod             # Go module (root)
README.md
```

## 4. Prerequisites

Install the following first:
- Go 1.23+
- Node.js 18+ and npm
- Python 3.10+
- MySQL 8+

Recommended ports:
- `8080` backend
- `8081` AI service
- `5173` frontend

## 5. Environment Variables

### 5.1 Backend (`backend/.env`)

Create `backend/.env` (or update existing one):

```env
GATHER_BRIDGE_SECRET=your-strong-secret
GATHER_CLONE_URL=http://localhost:3000
SINGLE_REALM_ID=demo

SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=your@email.com

EMAIL_TRANSPORT=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
EMAIL_DEV_MODE=false
EMAIL_TEMPLATE=formal

FRONTEND_BASE_URL=http://localhost:5173
```

### 5.2 Frontend (`frontend/.env`)

```env
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

## 6. Database Setup

The project expects database name:
- `AI_Smart_Event_Assistant`

Create it:

```powershell
mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS AI_Smart_Event_Assistant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

If your root password is different, replace `-proot`.

## 7. Run the Project (Local Development)

Use 3 terminals.

### 7.1 Start Backend API (Go)

Important: run from `backend/cmd/api` so local env loading works consistently.

```powershell
cd backend/cmd/api
go run .
```

Expected log:
- `Starting server on :8080`

Health check:

```powershell
Invoke-WebRequest -Uri "http://localhost:8080/test" -UseBasicParsing
```

### 7.2 Start AI Service (Python)

In a new terminal:

```powershell
cd backend/internal/config/Api_Ai
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install flask flask-cors requests deep-translator pillow huggingface_hub numpy sentence-transformers scikit-learn mysql-connector-python
python ai_service.py
```

Expected:
- running on `http://localhost:8081`

Main AI endpoints:
- `POST /ai-chat`
- `POST /ai-generate-image`
- `POST /ai-generate-image-with-reference`
- `POST /ai-generate-invitation`
- `POST /ai-generate-invitation-detailed`
- `POST /ai-generate-invitation-album`
- `POST /ai-match-organizers`

### 7.3 Start Frontend (Vite)

In a third terminal, from repository root:

```powershell
npm --prefix frontend install
npm --prefix frontend run dev -- --host
```

Open:
- `http://localhost:5173`

## 8. Production Build Checks

### Frontend build

```powershell
npm --prefix frontend run build
```

### Backend compile/tests

```powershell
go test ./...
```

## 9. Common Issues and Fixes

### 9.1 Access denied for user `root`@`localhost`
- Verify MySQL credentials used by backend/AI service
- Ensure user/password is correct and has DB access

### 9.2 Unknown database `AI_Smart_Event_Assistant`
- Create database first (see Section 6)

### 9.3 Frontend cannot call API
- Check backend is running on `:8080`
- Verify CORS origins include `http://localhost:5173`

### 9.4 AI features not working
- Confirm AI service is running on `:8081`
- Install all Python dependencies
- Check API keys and network access

### 9.5 Port already in use
- Stop previous process using port 8080/8081/5173
- Or change port configuration and frontend API targets

## 10. Security Notes

- Do not commit real API keys, SMTP passwords, or production secrets.
- Rotate any keys that were previously exposed.
- Prefer secret managers in production.

## 11. Git Workflow (README-only commit/push)

If your working tree has many unrelated changes and you only want to push this README:

```powershell
git add README.md
git commit -m "docs: add detailed project README"
git push origin main
```

This keeps your commit focused on documentation only.

## 12. API and Frontend Integration Notes

- Most frontend pages call backend directly at `http://localhost:8080`
- AI-related frontend pages call AI service at `http://localhost:8081`
- Keep both services running during local development

## 13. Maintainer Checklist

Before sharing or deploying:
- Confirm backend starts without DB/auth errors
- Confirm frontend loads at `:5173`
- Confirm AI service endpoints respond at `:8081`
- Remove or mask secrets from tracked files
- Run `go test ./...` and `npm --prefix frontend run build`
