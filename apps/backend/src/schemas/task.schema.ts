import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
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
