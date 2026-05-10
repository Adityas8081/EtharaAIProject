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
