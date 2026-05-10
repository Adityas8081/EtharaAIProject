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

const roleHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const { role } = req.body;
  if (!["ADMIN", "MEMBER"].includes(role)) {
    res.status(422).json({ message: "Role must be ADMIN or MEMBER" });
    return;
  }
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  res.json({ data: user });
};

router.patch("/:id/role", requireAdmin, roleHandler);
router.put("/:id/role", requireAdmin, roleHandler);

export default router;
