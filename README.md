# Team Task Manager

A full-stack web app for managing team projects and tasks with role-based access control (Admin/Member).

## Live Demo
- **Live URL:** (add after Railway deployment)
- **GitHub:** (add your repo URL)

## Tech Stack
- **Frontend:** Next.js 15 App Router, Tailwind CSS, shadcn/ui, Recharts
- **Backend:** Express.js, Prisma ORM
- **Database:** PostgreSQL
- **Auth:** JWT (Access + Refresh tokens in httpOnly cookies)
- **Deploy:** Railway

## Features
- Signup / Login with JWT auth (httpOnly cookies, token rotation)
- Role-based access: Admin creates/manages, Member views/updates status
- Admin: create projects, assign tasks, manage members, delete tasks
- Member: view assigned tasks, update task status
- Dashboard with stats cards and bar chart (tasks by project)
- Overdue task detection computed from due dates
- Paginated, filterable task list
- Responsive mobile layout with loading skeletons

## Project Structure
```
apps/
  backend/   → Express + Prisma + PostgreSQL (port 4000)
  frontend/  → Next.js 15 App Router (port 3000)
packages/
  types/     → Shared TypeScript interfaces
```

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL database running locally

### Setup

1. Clone and install
```bash
git clone <repo-url>
cd team-task-manager
npm install
```

2. Backend environment
```bash
cp apps/backend/.env.example apps/backend/.env
# Edit .env and fill in: DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
```

3. Run Prisma migrations
```bash
cd apps/backend
npx prisma migrate dev
cd ../..
```

4. Frontend environment
```bash
echo 'NEXT_PUBLIC_API_URL=http://localhost:4000' > apps/frontend/.env.local
```

5. Start both servers (in two terminals)
```bash
# Terminal 1 — Backend
npm run dev:backend

# Terminal 2 — Frontend
npm run dev:frontend
```

Open http://localhost:3000

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/signup | Public | Register |
| POST | /api/auth/login | Public | Login |
| POST | /api/auth/logout | Auth | Logout |
| POST | /api/auth/refresh | Cookie | Refresh tokens |
| GET | /api/users/me | Auth | Current user |
| GET | /api/users | Admin | All users |
| GET | /api/projects | Auth | List projects |
| POST | /api/projects | Admin | Create project |
| GET | /api/projects/:id | Auth | Project detail |
| POST | /api/projects/:id/members | Admin | Add member |
| GET | /api/tasks | Auth | List tasks |
| POST | /api/tasks | Admin | Create task |
| PUT | /api/tasks/:id | Auth | Update task |
| DELETE | /api/tasks/:id | Admin | Delete task |
| GET | /api/dashboard/stats | Auth | Dashboard stats |

## Deployment (Railway)

1. Push to GitHub
2. Go to railway.app → New Project → Deploy from GitHub repo
3. Add PostgreSQL plugin (auto-sets DATABASE_URL)
4. Create Service for `apps/backend`:
   - Build: `cd apps/backend && npm install && npx prisma generate && npm run build`
   - Start: `npx prisma migrate deploy && node dist/index.js`
   - Env vars: JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, FRONTEND_URL
5. Create Service for `apps/frontend`:
   - Build: `cd apps/frontend && npm install && npm run build`
   - Start: `node apps/frontend/.next/standalone/server.js`
   - Env vars: NEXT_PUBLIC_API_URL (backend Railway URL)
