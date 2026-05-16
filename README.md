# TaskFlow — Team Task Manager

A full-stack collaborative task management application with role-based access control.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Zustand + Framer Motion
- **Backend**: Node.js + Express + Prisma ORM + PostgreSQL
- **Auth**: JWT-based authentication
- **Deployment**: Railway

## Roles

| Role | Permissions |
|------|-------------|
| Admin | Full control + assign roles |
| Project Lead | Create/manage projects & tasks, assign to users |
| Quality Reviewer | Review tasks, add remarks, change status |
| Tasker | Update status of assigned tasks |

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL

### Backend
```bash
cd server
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

### Frontend
```bash
# From root
npm install
npm run dev
```

## Deployment on Railway

### 1. Create a Railway project

Go to [railway.app](https://railway.app) and create a new project.

### 2. Add PostgreSQL

- Click "New" → "Database" → "PostgreSQL"
- Railway auto-provisions the database and sets `DATABASE_URL`

### 3. Deploy Backend

- Click "New" → "GitHub Repo" (or "Empty Service")
- Set root directory to `server`
- Add environment variables:
  - `DATABASE_URL` → (auto-set by Railway if linked to PG)
  - `JWT_SECRET` → a long random string
  - `FRONTEND_URL` → your frontend Railway URL (set after deploying frontend)
  - `PORT` → Railway sets this automatically
- Build command: `npm run build`
- Start command: `npm run start`

### 4. Deploy Frontend

- Click "New" → "GitHub Repo" (or "Empty Service")
- Set root directory to `.` (root)
- Add environment variable:
  - `VITE_API_URL` → your backend Railway URL (e.g., `https://taskflow-server-production.up.railway.app`)
- Build command: `npm install && npm run build`
- Start command: `npx serve dist -s -l $PORT`

### 5. Seed the database

After backend deploys, open the Railway shell and run:
```bash
npx ts-node src/seed.ts
```

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | alex@taskflow.io | password |
| Project Lead | sarah@taskflow.io | password |
| Quality Reviewer | james@taskflow.io | password |
| Tasker | emily@taskflow.io | password |

## Environment Variables

### Backend (`server/.env`)
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-secret-key
PORT=4000
FRONTEND_URL=https://your-frontend.railway.app
```

### Frontend (`.env`)
```
VITE_API_URL=https://your-backend.railway.app
```
