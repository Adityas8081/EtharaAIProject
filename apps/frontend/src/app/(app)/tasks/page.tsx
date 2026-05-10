"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { TaskTable } from "@/components/task-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskStatus } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string;
  assignedTo?: { id: string; name: string };
  project?: { id: string; name: string };
}

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const isAdmin = user?.role === "ADMIN";

  function loadTasks() {
    setLoading(true);
    const query = statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
    api.get<{ data: Task[] }>(`/api/tasks${query}`)
      .then((res) => setTasks(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadTasks();
    function onVisible() { if (document.visibilityState === "visible") loadTasks(); }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function handleDeleteTask(taskId: string, taskTitle: string) {
    if (!confirm(`Delete task "${taskTitle}"?`)) return;
    try {
      await api.delete(`/api/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success("Task deleted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete task");
    }
  }

  const statuses: (TaskStatus | "ALL")[] = ["ALL", "TODO", "IN_PROGRESS", "DONE", "OVERDUE"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Tasks</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isAdmin ? "All tasks across projects" : "Tasks in your projects"}
          </p>
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "ALL")}>
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
          {loading
            ? <Skeleton className="h-64 w-full" />
            : <TaskTable
                tasks={tasks}
                isAdmin={isAdmin}
                onDeleteTask={isAdmin ? handleDeleteTask : undefined}
                onStatusChange={(id, status) =>
                  setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t))
                }
              />
          }
        </CardContent>
      </Card>
    </div>
  );
}
