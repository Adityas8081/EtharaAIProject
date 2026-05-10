"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
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
