"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StatsCard } from "@/components/stats-card";
import { TaskBarChart } from "@/components/task-bar-chart";
import { OverdueList } from "@/components/overdue-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  total: number;
  done: number;
  overdue: number;
  inProgress: number;
  todo: number;
  byProject: { projectName: string; total: number; done: number; overdue: number; inProgress: number }[];
}

interface Task {
  id: string;
  title: string;
  dueDate?: string;
  project?: { id: string; name: string };
}

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
