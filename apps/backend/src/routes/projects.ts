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
