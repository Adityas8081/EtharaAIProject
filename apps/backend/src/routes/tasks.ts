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
