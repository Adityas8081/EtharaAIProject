# Team Task Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack Team Task Manager with role-based access (Admin/Member), deployed live on Railway.

**Architecture:** Monorepo with `apps/backend` (Express + Prisma + PostgreSQL) and `apps/frontend` (Next.js 15 App Router), sharing types via `packages/types`. JWT auth with httpOnly cookies (access 15min + refresh 7d). All inputs validated with Zod.

**Tech Stack:** Next.js 15, Tailwind CSS, shadcn/ui, Recharts, Express, Prisma, PostgreSQL, Zod, TypeScript, Railway

**Working Directory:** `D:\Aditya Website`

---

## File Map

```
D:\Aditya Website\
├── apps/
│   ├── backend/
│   │   ├── prisma/schema.prisma
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── lib/prisma.ts
│   │   │   ├── lib/jwt.ts
│   │   │   ├── middleware/auth.ts
│   │   │   ├── middleware/validate.ts
│   │   │   ├── schemas/auth.schema.ts
│   │   │   ├── schemas/project.schema.ts
│   │   │   ├── schemas/task.schema.ts
│   │   │   ├── routes/auth.ts
│   │   │   ├── routes/users.ts
│   │   │   ├── routes/projects.ts
│   │   │   ├── routes/tasks.ts
│   │   │   └── routes/dashboard.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env.example
│   └── frontend/
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   ├── (auth)/login/page.tsx
│       │   │   ├── (auth)/signup/page.tsx
│       │   │   └── (app)/
│       │   │       ├── layout.tsx
│       │   │       ├── dashboard/page.tsx
│       │   │       ├── projects/page.tsx
│       │   │       ├── projects/new/page.tsx
│       │   │       ├── projects/[id]/page.tsx
│       │   │       ├── projects/[id]/tasks/new/page.tsx
│       │   │       ├── tasks/page.tsx
│       │   │       └── tasks/[id]/page.tsx
│       │   ├── components/
│       │   │   ├── navbar.tsx
│       │   │   ├── stats-card.tsx
│       │   │   ├── task-table.tsx
│       │   │   ├── task-bar-chart.tsx
│       │   │   ├── overdue-list.tsx
│       │   │   └── role-guard.tsx
│       │   ├── lib/api.ts
│       │   ├── lib/utils.ts
│       │   ├── hooks/use-auth.tsx
│       │   └── middleware.ts
│       ├── package.json
│       ├── next.config.ts
│       └── tailwind.config.ts
├── packages/types/index.ts
├── packages/types/package.json
└── railway.toml
```

---

## Task 1: Monorepo Scaffold & Git Init

**Files:**
- Create: `package.json` (root)
- Create: `.gitignore`
- Create: `packages/types/package.json`
- Create: `packages/types/index.ts`
- Create: `railway.toml`

- [ ] **Step 1: Init root package.json**

Run in `D:\Aditya Website`:
```bash
cd "D:\Aditya Website"
git init
```

Create `package.json`:
```json
{
  "name": "team-task-manager",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev:backend": "npm run dev --workspace=apps/backend",
    "dev:frontend": "npm run dev --workspace=apps/frontend"
  }
}
```

- [ ] **Step 2: Create .gitignore**

```
node_modules/
.env
dist/
.next/
*.log
.DS_Store
```

- [ ] **Step 3: Create shared types package**

`packages/types/package.json`:
```json
{
  "name": "@repo/types",
  "version": "1.0.0",
  "main": "index.ts",
  "types": "index.ts"
}
```

`packages/types/index.ts`:
```typescript
export type Role = "ADMIN" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "OVERDUE";
export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdById: string;
  createdAt: string;
  members?: ProjectMember[];
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  joinedAt: string;
  user?: User;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  projectId: string;
  assignedToId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: User;
  project?: Project;
}

export interface DashboardStats {
  total: number;
  done: number;
  overdue: number;
  inProgress: number;
  todo: number;
  byProject: { projectName: string; total: number; done: number; overdue: number; inProgress: number }[];
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
```

- [ ] **Step 4: Create railway.toml**

```toml
[build]
builder = "nixpacks"

[[services]]
name = "backend"
source = "apps/backend"
startCommand = "npx prisma migrate deploy && node dist/index.js"

[services.envs]
PORT = "4000"

[[services]]
name = "frontend"
source = "apps/frontend"
startCommand = "node .next/standalone/server.js"

[services.envs]
PORT = "3000"
```

- [ ] **Step 5: Initial commit**

```bash
git add .
git commit -m "chore: monorepo scaffold with shared types"
```

---

## Task 2: Backend — Express + TypeScript Setup

**Files:**
- Create: `apps/backend/package.json`
- Create: `apps/backend/tsconfig.json`
- Create: `apps/backend/src/index.ts`
- Create: `apps/backend/.env.example`

- [ ] **Step 1: Create backend package.json**

`apps/backend/package.json`:
```json
{
  "name": "backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@prisma/client": "^5.14.0",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cookie-parser": "^1.4.7",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.14.0",
    "prisma": "^5.14.0",
    "tsx": "^4.15.0",
    "typescript": "^5.4.5"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

`apps/backend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create .env.example**

`apps/backend/.env.example`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/taskmanager"
JWT_ACCESS_SECRET="your-access-secret-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
FRONTEND_URL="http://localhost:3000"
PORT=4000
```

Copy to `.env` and fill in real values for local dev.

- [ ] **Step 4: Create Express entry point**

`apps/backend/src/index.ts`:
```typescript
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import projectRoutes from "./routes/projects";
import taskRoutes from "./routes/tasks";
import dashboardRoutes from "./routes/dashboard";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
```

- [ ] **Step 5: Install backend dependencies**

```bash
cd "D:\Aditya Website\apps\backend"
npm install
```

- [ ] **Step 6: Commit**

```bash
cd "D:\Aditya Website"
git add apps/backend
git commit -m "feat: backend express + typescript setup"
```

---

## Task 3: Prisma Schema + Database

**Files:**
- Create: `apps/backend/prisma/schema.prisma`
- Create: `apps/backend/src/lib/prisma.ts`

- [ ] **Step 1: Create Prisma schema**

`apps/backend/prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String          @id @default(cuid())
  name          String
  email         String          @unique
  passwordHash  String
  role          Role            @default(MEMBER)
  createdAt     DateTime        @default(now())
  projects      ProjectMember[]
  assignedTasks Task[]          @relation("AssignedTo")
  createdTasks  Task[]          @relation("CreatedBy")
  createdProjects Project[]
  refreshTokens RefreshToken[]
}

model Project {
  id          String          @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime        @default(now())
  createdBy   User            @relation(fields: [createdById], references: [id])
  createdById String
  members     ProjectMember[]
  tasks       Task[]
}

model ProjectMember {
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  joinedAt  DateTime @default(now())

  @@id([projectId, userId])
}

model Task {
  id           String     @id @default(cuid())
  title        String
  description  String?
  status       TaskStatus @default(TODO)
  priority     Priority   @default(MEDIUM)
  dueDate      DateTime?
  project      Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId    String
  assignedTo   User?      @relation("AssignedTo", fields: [assignedToId], references: [id])
  assignedToId String?
  createdBy    User       @relation("CreatedBy", fields: [createdById], references: [id])
  createdById  String
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
}

enum Role       { ADMIN MEMBER }
enum TaskStatus { TODO IN_PROGRESS DONE OVERDUE }
enum Priority   { LOW MEDIUM HIGH }
```

- [ ] **Step 2: Create Prisma client singleton**

`apps/backend/src/lib/prisma.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 3: Initialize Prisma and run migration**

```bash
cd "D:\Aditya Website\apps\backend"
npx prisma init --datasource-provider postgresql
npx prisma migrate dev --name init
npx prisma generate
```

Expected output: Migration created and applied, Prisma client generated.

- [ ] **Step 4: Commit**

```bash
cd "D:\Aditya Website"
git add apps/backend/prisma apps/backend/src/lib/prisma.ts
git commit -m "feat: prisma schema and db migration"
```

---

## Task 4: JWT Utilities + Zod Schemas

**Files:**
- Create: `apps/backend/src/lib/jwt.ts`
- Create: `apps/backend/src/schemas/auth.schema.ts`
- Create: `apps/backend/src/schemas/project.schema.ts`
- Create: `apps/backend/src/schemas/task.schema.ts`

- [ ] **Step 1: Create JWT utility**

`apps/backend/src/lib/jwt.ts`:
```typescript
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface TokenPayload {
  userId: string;
  role: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
}
```

- [ ] **Step 2: Create auth Zod schemas**

`apps/backend/src/schemas/auth.schema.ts`:
```typescript
import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
```

- [ ] **Step 3: Create project Zod schemas**

`apps/backend/src/schemas/project.schema.ts`:
```typescript
import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const addMemberSchema = z.object({
  userId: z.string().cuid("Invalid user ID"),
});
```

- [ ] **Step 4: Create task Zod schemas**

`apps/backend/src/schemas/task.schema.ts`:
```typescript
import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "OVERDUE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z.string().datetime().optional(),
  projectId: z.string().cuid("Invalid project ID"),
  assignedToId: z.string().cuid("Invalid user ID").optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "OVERDUE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assignedToId: z.string().cuid().optional().nullable(),
});

export const memberUpdateTaskSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
});
```

- [ ] **Step 5: Commit**

```bash
cd "D:\Aditya Website"
git add apps/backend/src/lib/jwt.ts apps/backend/src/schemas
git commit -m "feat: jwt utilities and zod validation schemas"
```

---

## Task 5: Auth Middleware + Validate Middleware

**Files:**
- Create: `apps/backend/src/middleware/auth.ts`
- Create: `apps/backend/src/middleware/validate.ts`

- [ ] **Step 1: Create auth middleware**

`apps/backend/src/middleware/auth.ts`:
```typescript
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../lib/jwt";

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.accessToken;
  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Token expired or invalid" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== "ADMIN") {
    res.status(403).json({ message: "Forbidden: Admins only" });
    return;
  }
  next();
}
```

- [ ] **Step 2: Create validate middleware**

`apps/backend/src/middleware/validate.ts`:
```typescript
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(422).json({
          message: "Validation failed",
          errors: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
        });
        return;
      }
      next(err);
    }
  };
}
```

- [ ] **Step 3: Commit**

```bash
cd "D:\Aditya Website"
git add apps/backend/src/middleware
git commit -m "feat: auth and validate middleware"
```

---

## Task 6: Auth Routes

**Files:**
- Create: `apps/backend/src/routes/auth.ts`

- [ ] **Step 1: Create auth routes**

`apps/backend/src/routes/auth.ts`:
```typescript
import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { validate } from "../middleware/validate";
import { signupSchema, loginSchema } from "../schemas/auth.schema";

const router = Router();

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

router.post("/signup", validate(signupSchema), async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    res.status(409).json({ message: "Email already in use" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role });
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });
  res.cookie("accessToken", accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.status(201).json({ data: user });
});

router.post("/login", validate(loginSchema), async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }
  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role });
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });
  res.cookie("accessToken", accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ data: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt } });
});

router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401).json({ message: "No refresh token" });
    return;
  }
  try {
    const payload = verifyRefreshToken(token);
    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      res.status(401).json({ message: "Refresh token invalid or expired" });
      return;
    }
    await prisma.refreshToken.delete({ where: { token } });
    const newAccessToken = signAccessToken({ userId: payload.userId, role: payload.role });
    const newRefreshToken = signRefreshToken({ userId: payload.userId, role: payload.role });
    await prisma.refreshToken.create({
      data: { token: newRefreshToken, userId: payload.userId, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
    res.cookie("accessToken", newAccessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", newRefreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ message: "Tokens refreshed" });
  } catch {
    res.status(401).json({ message: "Invalid refresh token" });
  }
});

router.post("/logout", async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
});

export default router;
```

- [ ] **Step 2: Commit**

```bash
cd "D:\Aditya Website"
git add apps/backend/src/routes/auth.ts
git commit -m "feat: auth routes - signup, login, refresh, logout"
```

---

## Task 7: Users + Projects + Tasks + Dashboard Routes

**Files:**
- Create: `apps/backend/src/routes/users.ts`
- Create: `apps/backend/src/routes/projects.ts`
- Create: `apps/backend/src/routes/tasks.ts`
- Create: `apps/backend/src/routes/dashboard.ts`

- [ ] **Step 1: Create users routes**

`apps/backend/src/routes/users.ts`:
```typescript
import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/me", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!user) { res.status(404).json({ message: "User not found" }); return; }
  res.json({ data: user });
});

router.get("/", authenticate, requireAdmin, async (_req, res: Response): Promise<void> => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ data: users });
});

export default router;
```

- [ ] **Step 2: Create projects routes**

`apps/backend/src/routes/projects.ts`:
```typescript
import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createProjectSchema, updateProjectSchema, addMemberSchema } from "../schemas/project.schema";

const router = Router();
router.use(authenticate);

router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const isAdmin = req.user!.role === "ADMIN";
  const projects = isAdmin
    ? await prisma.project.findMany({ include: { members: { include: { user: { select: { id: true, name: true, email: true, role: true, createdAt: true } } } }, _count: { select: { tasks: true } } }, orderBy: { createdAt: "desc" } })
    : await prisma.project.findMany({ where: { members: { some: { userId: req.user!.userId } } }, include: { members: { include: { user: { select: { id: true, name: true, email: true, role: true, createdAt: true } } } }, _count: { select: { tasks: true } } }, orderBy: { createdAt: "desc" } });
  res.json({ data: projects });
});

router.post("/", requireAdmin, validate(createProjectSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  const project = await prisma.project.create({
    data: { ...req.body, createdById: req.user!.userId, members: { create: { userId: req.user!.userId } } },
    include: { members: { include: { user: { select: { id: true, name: true, email: true, role: true, createdAt: true } } } } },
  });
  res.status(201).json({ data: project });
});

router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: { members: { include: { user: { select: { id: true, name: true, email: true, role: true, createdAt: true } } } }, tasks: { include: { assignedTo: { select: { id: true, name: true, email: true, role: true, createdAt: true } } }, orderBy: { createdAt: "desc" } } },
  });
  if (!project) { res.status(404).json({ message: "Project not found" }); return; }
  res.json({ data: project });
});

router.put("/:id", requireAdmin, validate(updateProjectSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  const project = await prisma.project.update({ where: { id: req.params.id }, data: req.body });
  res.json({ data: project });
});

router.delete("/:id", requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.project.delete({ where: { id: req.params.id } });
  res.json({ message: "Project deleted" });
});

router.post("/:id/members", requireAdmin, validate(addMemberSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.body;
  const existing = await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId: req.params.id, userId } } });
  if (existing) { res.status(409).json({ message: "User already a member" }); return; }
  const member = await prisma.projectMember.create({
    data: { projectId: req.params.id, userId },
    include: { user: { select: { id: true, name: true, email: true, role: true, createdAt: true } } },
  });
  res.status(201).json({ data: member });
});

router.delete("/:id/members/:userId", requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.projectMember.delete({ where: { projectId_userId: { projectId: req.params.id, userId: req.params.userId } } });
  res.json({ message: "Member removed" });
});

export default router;
```

- [ ] **Step 3: Create tasks routes**

`apps/backend/src/routes/tasks.ts`:
```typescript
import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createTaskSchema, updateTaskSchema, memberUpdateTaskSchema } from "../schemas/task.schema";

const router = Router();
router.use(authenticate);

function computeStatus(task: { status: string; dueDate: Date | null }): string {
  if (task.status === "DONE") return "DONE";
  if (task.dueDate && task.dueDate < new Date() && task.status !== "DONE") return "OVERDUE";
  return task.status;
}

router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId, status, assignedToId, page = "1", limit = "20" } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: Record<string, unknown> = {};
  if (projectId) where.projectId = projectId;
  if (status) where.status = status;
  if (assignedToId) where.assignedToId = assignedToId;
  if (req.user!.role === "MEMBER") where.assignedToId = req.user!.userId;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({ where, include: { assignedTo: { select: { id: true, name: true, email: true, role: true, createdAt: true } }, project: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, skip, take: parseInt(limit) }),
    prisma.task.count({ where }),
  ]);

  const tasksWithStatus = tasks.map((t) => ({ ...t, status: computeStatus(t) }));
  res.json({ data: tasksWithStatus, total, page: parseInt(page), limit: parseInt(limit) });
});

router.post("/", requireAdmin, validate(createTaskSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  const { dueDate, ...rest } = req.body;
  const task = await prisma.task.create({
    data: { ...rest, createdById: req.user!.userId, dueDate: dueDate ? new Date(dueDate) : undefined },
    include: { assignedTo: { select: { id: true, name: true, email: true, role: true, createdAt: true } } },
  });
  res.status(201).json({ data: { ...task, status: computeStatus(task) } });
});

router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: { assignedTo: { select: { id: true, name: true, email: true, role: true, createdAt: true } }, project: { select: { id: true, name: true } } },
  });
  if (!task) { res.status(404).json({ message: "Task not found" }); return; }
  res.json({ data: { ...task, status: computeStatus(task) } });
});

router.put("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const isAdmin = req.user!.role === "ADMIN";
  const schema = isAdmin ? updateTaskSchema : memberUpdateTaskSchema;
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ message: "Validation failed", errors: parsed.error.errors });
    return;
  }
  const { dueDate, ...rest } = parsed.data as Record<string, unknown>;
  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: { ...rest, ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate as string) : null } : {}) },
    include: { assignedTo: { select: { id: true, name: true, email: true, role: true, createdAt: true } } },
  });
  res.json({ data: { ...task, status: computeStatus(task) } });
});

router.delete("/:id", requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.task.delete({ where: { id: req.params.id } });
  res.json({ message: "Task deleted" });
});

export default router;
```

- [ ] **Step 4: Create dashboard route**

`apps/backend/src/routes/dashboard.ts`:
```typescript
import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/stats", async (req: AuthRequest, res: Response): Promise<void> => {
  const isAdmin = req.user!.role === "ADMIN";
  const now = new Date();

  const tasks = await prisma.task.findMany({
    where: isAdmin ? {} : { assignedToId: req.user!.userId },
    include: { project: { select: { id: true, name: true } } },
  });

  const withStatus = tasks.map((t) => ({
    ...t,
    computedStatus: t.status === "DONE" ? "DONE" : t.dueDate && t.dueDate < now ? "OVERDUE" : t.status,
  }));

  const total = withStatus.length;
  const done = withStatus.filter((t) => t.computedStatus === "DONE").length;
  const overdue = withStatus.filter((t) => t.computedStatus === "OVERDUE").length;
  const inProgress = withStatus.filter((t) => t.computedStatus === "IN_PROGRESS").length;
  const todo = withStatus.filter((t) => t.computedStatus === "TODO").length;

  const projectMap: Record<string, { projectName: string; total: number; done: number; overdue: number; inProgress: number }> = {};
  for (const task of withStatus) {
    const pid = task.project.id;
    if (!projectMap[pid]) projectMap[pid] = { projectName: task.project.name, total: 0, done: 0, overdue: 0, inProgress: 0 };
    projectMap[pid].total++;
    if (task.computedStatus === "DONE") projectMap[pid].done++;
    else if (task.computedStatus === "OVERDUE") projectMap[pid].overdue++;
    else if (task.computedStatus === "IN_PROGRESS") projectMap[pid].inProgress++;
  }

  res.json({ data: { total, done, overdue, inProgress, todo, byProject: Object.values(projectMap) } });
});

export default router;
```

- [ ] **Step 5: Test the backend locally**

```bash
cd "D:\Aditya Website\apps\backend"
npm run dev
```

Open `http://localhost:4000/api/health` — expected: `{"status":"ok"}`

- [ ] **Step 6: Commit**

```bash
cd "D:\Aditya Website"
git add apps/backend/src/routes
git commit -m "feat: users, projects, tasks, dashboard routes"
```

---

## Task 8: Frontend — Next.js Setup + shadcn/ui

**Files:**
- Create: `apps/frontend/` (Next.js project)
- Create: `apps/frontend/src/lib/api.ts`
- Create: `apps/frontend/src/lib/utils.ts`
- Create: `apps/frontend/src/middleware.ts`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd "D:\Aditya Website\apps"
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --no-turbopack --import-alias "@/*"
```

When prompted, accept all defaults.

- [ ] **Step 2: Install shadcn/ui + Recharts + Sonner**

```bash
cd "D:\Aditya Website\apps\frontend"
npx shadcn@latest init
```

Choose: Default style, Slate base color, CSS variables yes.

```bash
npx shadcn@latest add button card input label badge table dropdown-menu dialog select textarea skeleton toast
npm install recharts sonner
```

- [ ] **Step 3: Update next.config.ts**

`apps/frontend/next.config.ts`:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

- [ ] **Step 4: Create API client**

`apps/frontend/src/lib/api.ts`:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (res.status === 401) {
    // Try refresh
    const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, { method: "POST", credentials: "include" });
    if (refreshRes.ok) {
      const retry = await fetch(`${API_URL}${path}`, { ...options, credentials: "include", headers: { "Content-Type": "application/json", ...options.headers } });
      if (retry.ok) return retry.json();
    }
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
```

- [ ] **Step 5: Create utils**

`apps/frontend/src/lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TaskStatus, Priority } from "@repo/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function isOverdue(dueDate: string | undefined, status: TaskStatus): boolean {
  if (!dueDate || status === "DONE") return false;
  return new Date(dueDate) < new Date();
}

export const statusColors: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
};

export const priorityColors: Record<Priority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-red-100 text-red-700",
};
```

- [ ] **Step 6: Create Next.js middleware for auth protection**

`apps/frontend/src/middleware.ts`:
```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  const hasToken = request.cookies.has("accessToken");

  if (!isPublic && !hasToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isPublic && hasToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 7: Commit**

```bash
cd "D:\Aditya Website"
git add apps/frontend
git commit -m "feat: next.js frontend setup with shadcn, api client, middleware"
```

---

## Task 9: Auth Context + Auth Pages

**Files:**
- Create: `apps/frontend/src/hooks/use-auth.tsx`
- Create: `apps/frontend/src/app/layout.tsx`
- Create: `apps/frontend/src/app/page.tsx`
- Create: `apps/frontend/src/app/(auth)/login/page.tsx`
- Create: `apps/frontend/src/app/(auth)/signup/page.tsx`

- [ ] **Step 1: Create auth context/hook**

`apps/frontend/src/hooks/use-auth.tsx`:
```typescript
"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@repo/types";
import { api } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchUser() {
    try {
      const res = await api.get<{ data: User }>("/api/users/me");
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await api.post("/api/auth/logout", {});
    setUser(null);
    window.location.href = "/login";
  }

  useEffect(() => { fetchUser(); }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refetch: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

- [ ] **Step 2: Update root layout**

`apps/frontend/src/app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Team Task Manager",
  description: "Manage your team's projects and tasks",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create root page (redirect)**

`apps/frontend/src/app/page.tsx`:
```typescript
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
```

- [ ] **Step 4: Create login page**

`apps/frontend/src/app/(auth)/login/page.tsx`:
```typescript
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/auth/login", form);
      toast.success("Welcome back!");
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>Enter your credentials to access your workspace</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-sm text-slate-500 text-center">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-slate-900 font-medium underline underline-offset-2">Sign up</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Create signup page**

`apps/frontend/src/app/(auth)/signup/page.tsx`:
```typescript
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/auth/signup", form);
      toast.success("Account created! Welcome.");
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create account</CardTitle>
          <CardDescription>Start managing your team&apos;s tasks today</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Aditya Singh" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Min 8 characters" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={8} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
            <p className="text-sm text-slate-500 text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-slate-900 font-medium underline underline-offset-2">Sign in</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
cd "D:\Aditya Website"
git add apps/frontend/src
git commit -m "feat: auth context, login and signup pages"
```

---

## Task 10: Shared Components (Navbar, StatsCard, RoleGuard)

**Files:**
- Create: `apps/frontend/src/components/navbar.tsx`
- Create: `apps/frontend/src/components/stats-card.tsx`
- Create: `apps/frontend/src/components/role-guard.tsx`
- Create: `apps/frontend/src/app/(app)/layout.tsx`

- [ ] **Step 1: Create Navbar**

`apps/frontend/src/components/navbar.tsx`:
```typescript
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/tasks", label: "Tasks" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-bold text-lg text-slate-900">TaskFlow</Link>
          <nav className="hidden md:flex gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={cn("px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname.startsWith(link.href) ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <>
              <span className="hidden sm:block text-sm text-slate-600">{user.name}</span>
              <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
              <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create StatsCard**

`apps/frontend/src/components/stats-card.tsx`:
```typescript
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  description?: string;
  className?: string;
}

export function StatsCard({ title, value, description, className }: StatsCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
        {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create RoleGuard**

`apps/frontend/src/components/role-guard.tsx`:
```typescript
"use client";
import { useAuth } from "@/hooks/use-auth";
import { Role } from "@repo/types";
import { ReactNode } from "react";

interface RoleGuardProps {
  role: Role;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ role, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();
  if (!user || user.role !== role) return <>{fallback}</>;
  return <>{children}</>;
}
```

- [ ] **Step 4: Create app layout (with Navbar)**

`apps/frontend/src/app/(app)/layout.tsx`:
```typescript
import { Navbar } from "@/components/navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
cd "D:\Aditya Website"
git add apps/frontend/src/components apps/frontend/src/app/\(app\)
git commit -m "feat: navbar, stats-card, role-guard, app layout"
```

---

## Task 11: Dashboard Page

**Files:**
- Create: `apps/frontend/src/components/task-bar-chart.tsx`
- Create: `apps/frontend/src/components/overdue-list.tsx`
- Create: `apps/frontend/src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Create TaskBarChart**

`apps/frontend/src/components/task-bar-chart.tsx`:
```typescript
"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface BarChartData {
  projectName: string;
  total: number;
  done: number;
  overdue: number;
  inProgress: number;
}

export function TaskBarChart({ data }: { data: BarChartData[] }) {
  if (!data.length) return <p className="text-slate-400 text-sm text-center py-8">No project data yet</p>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="projectName" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="done" name="Done" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="inProgress" name="In Progress" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="overdue" name="Overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Create OverdueList**

`apps/frontend/src/components/overdue-list.tsx`:
```typescript
import Link from "next/link";
import { Task } from "@repo/types";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export function OverdueList({ tasks }: { tasks: Task[] }) {
  if (!tasks.length) return <p className="text-slate-400 text-sm">No overdue tasks</p>;
  return (
    <ul className="space-y-3">
      {tasks.slice(0, 5).map((task) => (
        <li key={task.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
          <div>
            <Link href={`/tasks/${task.id}`} className="font-medium text-sm text-slate-900 hover:underline">{task.title}</Link>
            {task.project && <p className="text-xs text-slate-500">{task.project.name}</p>}
          </div>
          <div className="text-right">
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Overdue</Badge>
            <p className="text-xs text-slate-400 mt-1">Due {formatDate(task.dueDate)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: Create Dashboard page**

`apps/frontend/src/app/(app)/dashboard/page.tsx`:
```typescript
"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DashboardStats, Task } from "@repo/types";
import { StatsCard } from "@/components/stats-card";
import { TaskBarChart } from "@/components/task-bar-chart";
import { OverdueList } from "@/components/overdue-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ data: DashboardStats }>("/api/dashboard/stats"),
      api.get<{ data: Task[] }>("/api/tasks?status=OVERDUE&limit=5"),
    ]).then(([statsRes, tasksRes]) => {
      setStats(statsRes.data);
      setOverdueTasks(tasksRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Your team&apos;s task overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Total Tasks" value={stats?.total ?? 0} />
        <StatsCard title="Done" value={stats?.done ?? 0} className="border-green-200" />
        <StatsCard title="In Progress" value={stats?.inProgress ?? 0} className="border-blue-200" />
        <StatsCard title="Overdue" value={stats?.overdue ?? 0} className="border-red-200" />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Tasks by Project</CardTitle></CardHeader>
          <CardContent>
            <TaskBarChart data={stats?.byProject ?? []} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base text-red-600">Overdue Tasks</CardTitle></CardHeader>
          <CardContent>
            <OverdueList tasks={overdueTasks} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd "D:\Aditya Website"
git add apps/frontend/src/components/task-bar-chart.tsx apps/frontend/src/components/overdue-list.tsx apps/frontend/src/app/\(app\)/dashboard
git commit -m "feat: dashboard page with charts and overdue list"
```

---

## Task 12: TaskTable Component + Tasks Pages

**Files:**
- Create: `apps/frontend/src/components/task-table.tsx`
- Create: `apps/frontend/src/app/(app)/tasks/page.tsx`
- Create: `apps/frontend/src/app/(app)/tasks/[id]/page.tsx`

- [ ] **Step 1: Create TaskTable**

`apps/frontend/src/components/task-table.tsx`:
```typescript
"use client";
import Link from "next/link";
import { Task } from "@repo/types";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, statusColors, priorityColors } from "@/lib/utils";

export function TaskTable({ tasks }: { tasks: Task[] }) {
  if (!tasks.length) return <p className="text-slate-400 text-sm text-center py-8">No tasks found</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Project</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id} className="hover:bg-slate-50">
            <TableCell>
              <Link href={`/tasks/${task.id}`} className="font-medium text-slate-900 hover:underline">{task.title}</Link>
            </TableCell>
            <TableCell>
              <Badge className={statusColors[task.status]}>{task.status.replace("_", " ")}</Badge>
            </TableCell>
            <TableCell>
              <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
            </TableCell>
            <TableCell className="text-slate-600 text-sm">{task.assignedTo?.name ?? "Unassigned"}</TableCell>
            <TableCell className="text-slate-600 text-sm">{formatDate(task.dueDate)}</TableCell>
            <TableCell className="text-slate-600 text-sm">{task.project?.name ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 2: Create Tasks list page**

`apps/frontend/src/app/(app)/tasks/page.tsx`:
```typescript
"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Task, TaskStatus } from "@repo/types";
import { TaskTable } from "@/components/task-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    setLoading(true);
    const query = statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
    api.get<{ data: Task[] }>(`/api/tasks${query}`)
      .then((res) => setTasks(res.data))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const statuses: (TaskStatus | "ALL")[] = ["ALL", "TODO", "IN_PROGRESS", "DONE", "OVERDUE"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">All Tasks</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Tasks ({tasks.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-64 w-full" /> : <TaskTable tasks={tasks} />}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Create Task detail page**

`apps/frontend/src/app/(app)/tasks/[id]/page.tsx`:
```typescript
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Task, TaskStatus } from "@repo/types";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, statusColors, priorityColors } from "@/lib/utils";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    api.get<{ data: Task }>(`/api/tasks/${id}`).then((res) => setTask(res.data)).finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(status: TaskStatus) {
    if (!task) return;
    setUpdating(true);
    try {
      const res = await api.put<{ data: Task }>(`/api/tasks/${id}`, { status });
      setTask(res.data);
      toast.success("Status updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setUpdating(false);
    }
  }

  async function deleteTask() {
    if (!confirm("Delete this task?")) return;
    try {
      await api.delete(`/api/tasks/${id}`);
      toast.success("Task deleted");
      router.push("/tasks");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!task) return <p className="text-slate-500">Task not found</p>;

  const memberStatuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{task.title}</h1>
        {user?.role === "ADMIN" && (
          <Button variant="destructive" size="sm" onClick={deleteTask}>Delete</Button>
        )}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {task.description && <p className="text-slate-600">{task.description}</p>}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 mb-1">Status</p>
              <Badge className={statusColors[task.status]}>{task.status.replace("_", " ")}</Badge>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Priority</p>
              <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Assigned To</p>
              <p className="font-medium">{task.assignedTo?.name ?? "Unassigned"}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Due Date</p>
              <p className="font-medium">{formatDate(task.dueDate)}</p>
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-2">Update Status</p>
            <Select value={task.status} onValueChange={(v) => updateStatus(v as TaskStatus)} disabled={updating}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(user?.role === "ADMIN" ? (["TODO", "IN_PROGRESS", "DONE", "OVERDUE"] as TaskStatus[]) : memberStatuses).map((s) => (
                  <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd "D:\Aditya Website"
git add apps/frontend/src/components/task-table.tsx apps/frontend/src/app/\(app\)/tasks
git commit -m "feat: task table component, tasks list and detail pages"
```

---

## Task 13: Projects Pages

**Files:**
- Create: `apps/frontend/src/app/(app)/projects/page.tsx`
- Create: `apps/frontend/src/app/(app)/projects/new/page.tsx`
- Create: `apps/frontend/src/app/(app)/projects/[id]/page.tsx`
- Create: `apps/frontend/src/app/(app)/projects/[id]/tasks/new/page.tsx`

- [ ] **Step 1: Create Projects list page**

`apps/frontend/src/app/(app)/projects/page.tsx`:
```typescript
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Project } from "@repo/types";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<(Project & { _count?: { tasks: number } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: typeof projects }>("/api/projects").then((res) => setProjects(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
        <RoleGuard role="ADMIN">
          <Button asChild><Link href="/projects/new">New Project</Link></Button>
        </RoleGuard>
      </div>
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <p className="text-slate-400 text-center py-16">No projects yet. Ask an admin to create one.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base">{project.name}</CardTitle>
                <CardDescription>{project.description ?? "No description"}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">{project._count?.tasks ?? 0} tasks · {project.members?.length ?? 0} members</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Created {formatDate(project.createdAt)}</span>
                <Button variant="outline" size="sm" asChild><Link href={`/projects/${project.id}`}>View</Link></Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create New Project page**

`apps/frontend/src/app/(app)/projects/new/page.tsx`:
```typescript
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ data: { id: string } }>("/api/projects", form);
      toast.success("Project created!");
      router.push(`/projects/${res.data.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">New Project</h1>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader><CardTitle className="text-base">Project Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input id="name" placeholder="e.g. Website Redesign" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" placeholder="What is this project about?" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
          </CardContent>
          <CardFooter className="gap-3">
            <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create Project"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Create Project detail page**

`apps/frontend/src/app/(app)/projects/[id]/page.tsx`:
```typescript
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Project, User } from "@repo/types";
import { useAuth } from "@/hooks/use-auth";
import { RoleGuard } from "@/components/role-guard";
import { TaskTable } from "@/components/task-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type ProjectDetail = Project & { tasks: Parameters<typeof TaskTable>[0]["tasks"]; members: { userId: string; user: User }[] };

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMember, setAddingMember] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");

  useEffect(() => {
    const reqs: Promise<unknown>[] = [api.get<{ data: ProjectDetail }>(`/api/projects/${id}`)];
    if (user?.role === "ADMIN") reqs.push(api.get<{ data: User[] }>("/api/users"));
    Promise.all(reqs).then(([projRes, usersRes]) => {
      setProject((projRes as { data: ProjectDetail }).data);
      if (usersRes) setAllUsers((usersRes as { data: User[] }).data);
    }).finally(() => setLoading(false));
  }, [id, user?.role]);

  async function addMember() {
    if (!selectedUser) return;
    setAddingMember(true);
    try {
      await api.post(`/api/projects/${id}/members`, { userId: selectedUser });
      const res = await api.get<{ data: ProjectDetail }>(`/api/projects/${id}`);
      setProject(res.data);
      setSelectedUser("");
      toast.success("Member added");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setAddingMember(false);
    }
  }

  async function removeMember(userId: string) {
    try {
      await api.delete(`/api/projects/${id}/members/${userId}`);
      setProject((p) => p ? { ...p, members: p.members.filter((m) => m.userId !== userId) } : p);
      toast.success("Member removed");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    }
  }

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!project) return <p className="text-slate-500">Project not found</p>;

  const memberUserIds = new Set(project.members.map((m) => m.userId));
  const nonMembers = allUsers.filter((u) => !memberUserIds.has(u.id));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
          {project.description && <p className="text-slate-500 mt-1">{project.description}</p>}
        </div>
        <RoleGuard role="ADMIN">
          <Button asChild><Link href={`/projects/${id}/tasks/new`}>Add Task</Link></Button>
        </RoleGuard>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Tasks ({project.tasks?.length ?? 0})</CardTitle></CardHeader>
            <CardContent>
              <TaskTable tasks={project.tasks ?? []} />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Members ({project.members.length})</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {project.members.map((m) => (
                <div key={m.userId} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{m.user.name}</p>
                    <Badge variant="secondary" className="text-xs">{m.user.role}</Badge>
                  </div>
                  <RoleGuard role="ADMIN">
                    {m.userId !== user?.id && (
                      <button onClick={() => removeMember(m.userId)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    )}
                  </RoleGuard>
                </div>
              ))}
              <RoleGuard role="ADMIN">
                {nonMembers.length > 0 && (
                  <div className="pt-3 border-t space-y-2">
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger><SelectValue placeholder="Add member…" /></SelectTrigger>
                      <SelectContent>
                        {nonMembers.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="w-full" onClick={addMember} disabled={!selectedUser || addingMember}>
                      {addingMember ? "Adding…" : "Add Member"}
                    </Button>
                  </div>
                )}
              </RoleGuard>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create New Task page**

`apps/frontend/src/app/(app)/projects/[id]/tasks/new/page.tsx`:
```typescript
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { User } from "@repo/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewTaskPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<User[]>([]);
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM", dueDate: "", assignedToId: "" });

  useEffect(() => {
    api.get<{ data: { members: { user: User }[] } }>(`/api/projects/${projectId}`)
      .then((res) => setMembers(res.data.members.map((m) => m.user)));
  }, [projectId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        projectId,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        assignedToId: form.assignedToId || undefined,
      };
      await api.post("/api/tasks", body);
      toast.success("Task created!");
      router.push(`/projects/${projectId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">New Task</h1>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader><CardTitle className="text-base">Task Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Task title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" placeholder="Task details…" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["LOW", "MEDIUM", "HIGH"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select value={form.assignedToId} onValueChange={(v) => setForm((f) => ({ ...f, assignedToId: v }))}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {members.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="gap-3">
            <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create Task"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
cd "D:\Aditya Website"
git add apps/frontend/src/app/\(app\)/projects
git commit -m "feat: projects list, detail, new project and new task pages"
```

---

## Task 14: Link Shared Types + Fix Imports

**Files:**
- Modify: `apps/frontend/package.json`
- Modify: `apps/backend/package.json`
- Modify: `apps/frontend/tsconfig.json`

- [ ] **Step 1: Add @repo/types to frontend**

`apps/frontend/package.json` — add to dependencies:
```json
{
  "dependencies": {
    "@repo/types": "*"
  }
}
```

- [ ] **Step 2: Add @repo/types to backend**

`apps/backend/package.json` — add to dependencies:
```json
{
  "dependencies": {
    "@repo/types": "*"
  }
}
```

- [ ] **Step 3: Update frontend tsconfig for path resolution**

In `apps/frontend/tsconfig.json`, add to `compilerOptions.paths`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@repo/types": ["../../packages/types/index.ts"]
    }
  }
}
```

- [ ] **Step 4: Install workspace deps from root**

```bash
cd "D:\Aditya Website"
npm install
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: link @repo/types workspace package to frontend and backend"
```

---

## Task 15: README + .env files + Railway Deploy

**Files:**
- Create: `README.md`
- Create: `apps/backend/.env` (local only, not committed)
- Create: `apps/frontend/.env.local` (local only, not committed)

- [ ] **Step 1: Create README.md**

`README.md`:
```markdown
# Team Task Manager

A full-stack web app for managing team projects and tasks with role-based access control.

## Live Demo
[Live URL on Railway] — [GitHub Repo]

## Tech Stack
- **Frontend:** Next.js 15, Tailwind CSS, shadcn/ui, Recharts
- **Backend:** Express.js, Prisma ORM
- **Database:** PostgreSQL
- **Auth:** JWT (Access + Refresh tokens in httpOnly cookies)
- **Deploy:** Railway

## Features
- Signup / Login with JWT auth (httpOnly cookies, token rotation)
- Role-based access: Admin and Member roles
- Admin: create projects, assign tasks, manage members
- Member: view assigned tasks, update task status
- Dashboard with stats cards and bar chart (tasks by project)
- Overdue task detection and highlighting
- Paginated task list with status/priority filters
- Responsive mobile layout

## Architecture
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
- PostgreSQL database

### Setup

1. Clone the repo
```bash
git clone <repo-url>
cd team-task-manager
npm install
```

2. Backend env
```bash
cp apps/backend/.env.example apps/backend/.env
# Fill in DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
```

3. Run migrations
```bash
cd apps/backend
npx prisma migrate dev
```

4. Frontend env
```bash
echo 'NEXT_PUBLIC_API_URL=http://localhost:4000' > apps/frontend/.env.local
```

5. Start both servers
```bash
# Terminal 1
npm run dev:backend

# Terminal 2
npm run dev:frontend
```

Open http://localhost:3000

## Deployment (Railway)

1. Push repo to GitHub
2. Create new Railway project → "Deploy from GitHub repo"
3. Add PostgreSQL plugin
4. Create two services: `apps/backend` and `apps/frontend`
5. Set environment variables (see .env.example)
6. Deploy
```

- [ ] **Step 2: Create backend .env (local only)**

`apps/backend/.env`:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/taskmanager"
JWT_ACCESS_SECRET="supersecretaccesskey32charsminimum1"
JWT_REFRESH_SECRET="supersecretrefreshkey32charsminimum"
FRONTEND_URL="http://localhost:3000"
PORT=4000
```

- [ ] **Step 3: Create frontend .env.local (local only)**

`apps/frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

- [ ] **Step 4: Add env files to .gitignore**

In root `.gitignore`, ensure these are present:
```
.env
.env.local
.env.*.local
```

- [ ] **Step 5: Final commit and push to GitHub**

```bash
cd "D:\Aditya Website"
git add README.md railway.toml
git commit -m "docs: readme and railway config for deployment"
git remote add origin <your-github-repo-url>
git push -u origin main
```

- [ ] **Step 6: Deploy to Railway**

1. Go to railway.app → New Project → Deploy from GitHub
2. Select your repo
3. Add PostgreSQL plugin (it auto-sets `DATABASE_URL`)
4. Create Service → from repo → root path: `apps/backend`
   - Build: `npm install && npm run build && npx prisma generate`
   - Start: `npx prisma migrate deploy && node dist/index.js`
   - Add env vars: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL` (frontend Railway URL)
5. Create Service → from repo → root path: `apps/frontend`
   - Build: `npm install && npm run build`
   - Start: `node .next/standalone/server.js`
   - Add env var: `NEXT_PUBLIC_API_URL` (backend Railway URL)
6. Deploy both services
7. Copy live URLs for form submission

---

## Self-Review: Spec Coverage Check

| Requirement | Task |
|---|---|
| Authentication Signup/Login | Task 6, Task 9 |
| JWT with refresh | Task 4, Task 6 |
| Project & team management | Task 7 (projects routes), Task 13 |
| Task creation, assignment, status | Task 7 (tasks routes), Task 12, Task 13 |
| Dashboard (tasks, status, overdue) | Task 7 (dashboard route), Task 11 |
| Role-based access Admin/Member | Task 5 (middleware), Task 10 (RoleGuard) |
| REST API + PostgreSQL | Task 2-7 |
| Zod validation | Task 4, Task 5 |
| Deployment on Railway | Task 15 |
| README | Task 15 |
| Recharts bar chart | Task 11 |
| Responsive layout | Tailwind throughout |
| httpOnly cookies | Task 6 |
| Shared TypeScript types | Task 1, Task 14 |

All requirements covered. No gaps found.
```
