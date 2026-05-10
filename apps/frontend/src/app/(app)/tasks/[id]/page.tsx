"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, statusColors, priorityColors, TaskStatus, Priority } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  assignedTo?: { id: string; name: string };
  project?: { id: string; name: string };
}

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
  const adminStatuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE", "OVERDUE"];

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
                {(user?.role === "ADMIN" ? adminStatuses : memberStatuses).map((s) => (
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
