import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/stats", async (req: AuthRequest, res: Response): Promise<void> => {
  const isAdmin = req.user!.role === "ADMIN";
  const userId = req.user!.userId;
  const now = new Date();

  // Workspace-wide tasks (same for everyone — gives shared overview)
  const allTasks = await prisma.task.findMany({
    include: { project: { select: { id: true, name: true } } },
  });

  const withStatus = allTasks.map((t) => ({
    ...t,
    computedStatus: t.status === "DONE" ? "DONE" : t.dueDate && t.dueDate < now ? "OVERDUE" : t.status,
  }));

  const total = withStatus.length;
  const done = withStatus.filter((t) => t.computedStatus === "DONE").length;
  const overdue = withStatus.filter((t) => t.computedStatus === "OVERDUE").length;
  const inProgress = withStatus.filter((t) => t.computedStatus === "IN_PROGRESS").length;
  const todo = withStatus.filter((t) => t.computedStatus === "TODO").length;

  const projectMap: Record<string, { projectId: string; projectName: string; total: number; done: number; overdue: number; inProgress: number }> = {};
  for (const task of withStatus) {
    const pid = task.project.id;
    if (!projectMap[pid]) projectMap[pid] = { projectId: pid, projectName: task.project.name, total: 0, done: 0, overdue: 0, inProgress: 0 };
    projectMap[pid].total++;
    if (task.computedStatus === "DONE") projectMap[pid].done++;
    else if (task.computedStatus === "OVERDUE") projectMap[pid].overdue++;
    else if (task.computedStatus === "IN_PROGRESS") projectMap[pid].inProgress++;
  }

  // Personal stats for current user
  const [myAssignedCount, myProjectCount] = await Promise.all([
    prisma.task.count({ where: { assignedToId: userId } }),
    prisma.projectMember.count({ where: { userId } }),
  ]);

  // My assigned tasks breakdown
  const myTasks = await prisma.task.findMany({
    where: { assignedToId: userId },
    include: { project: { select: { id: true, name: true } } },
  });
  const myWithStatus = myTasks.map((t) => ({
    ...t,
    computedStatus: t.status === "DONE" ? "DONE" : t.dueDate && t.dueDate < now ? "OVERDUE" : t.status,
  }));
  const myDone = myWithStatus.filter((t) => t.computedStatus === "DONE").length;
  const myInProgress = myWithStatus.filter((t) => t.computedStatus === "IN_PROGRESS").length;
  const myOverdue = myWithStatus.filter((t) => t.computedStatus === "OVERDUE").length;

  // Admin: per-member workload
  let memberStats: { id: string; name: string; total: number; done: number; inProgress: number; projects: number }[] = [];
  if (isAdmin) {
    const members = await prisma.user.findMany({
      where: { role: "MEMBER" },
      select: {
        id: true,
        name: true,
        assignedTasks: { select: { status: true } },
        projects: { select: { projectId: true } },
      },
    });
    memberStats = members.map((m) => ({
      id: m.id,
      name: m.name,
      total: m.assignedTasks.length,
      done: m.assignedTasks.filter((t) => t.status === "DONE").length,
      inProgress: m.assignedTasks.filter((t) => t.status === "IN_PROGRESS").length,
      projects: m.projects.length,
    }));
  }

  res.json({
    data: {
      // Workspace-wide (same for all users)
      total, done, overdue, inProgress, todo,
      byProject: Object.values(projectMap),
      // Personal
      myAssignedCount,
      myProjectCount,
      myDone,
      myInProgress,
      myOverdue,
      // Admin only
      memberStats,
    },
  });
});

export default router;
