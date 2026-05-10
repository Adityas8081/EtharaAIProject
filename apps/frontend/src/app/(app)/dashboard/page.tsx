"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { StatsCard } from "@/components/stats-card";
import { TaskBarChart } from "@/components/task-bar-chart";
import { OverdueList } from "@/components/overdue-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, ListTodo, LayoutDashboard, ShieldCheck } from "lucide-react";

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
  const { user } = useAuth();
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
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const completionRate = stats && stats.total > 0
    ? Math.round((stats.done / stats.total) * 100)
    : 0;

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-24 rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutDashboard className="w-5 h-5 text-indigo-300" />
              <span className="text-indigo-200 text-sm font-medium">Overview</span>
            </div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(" ")[0]}</h1>
            <p className="text-indigo-200 mt-1 text-sm">Here&apos;s what&apos;s happening with your team today</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black">{completionRate}%</div>
            <div className="text-indigo-200 text-sm">completion rate</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Total Tasks" value={stats?.total ?? 0} icon={ListTodo} color="default" />
        <StatsCard title="Completed" value={stats?.done ?? 0} icon={CheckCircle2} color="green" />
        <StatsCard title="In Progress" value={stats?.inProgress ?? 0} icon={Clock} color="blue" />
        <StatsCard title="Overdue" value={stats?.overdue ?? 0} icon={AlertCircle} color="red" />
      </div>

      {/* Todo + Role */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-yellow-50 border-2 border-yellow-200">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide">Todo</p>
              <ListTodo className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-2xl font-black text-yellow-800">{stats?.todo ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-indigo-50 border-2 border-indigo-200">
          <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm ${user?.role === "ADMIN" ? "bg-indigo-600" : "bg-slate-500"}`}>
              {user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <ShieldCheck className="w-3 h-3 text-indigo-500" />
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Your Role</p>
              </div>
              <Badge className={`text-sm font-bold ${user?.role === "ADMIN" ? "bg-indigo-600 text-white" : "bg-slate-500 text-white"}`}>
                {user?.role}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart + Overdue */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-800">Tasks by Project</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskBarChart data={stats?.byProject ?? []} />
          </CardContent>
        </Card>
        <Card className="border-2 border-red-100">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <CardTitle className="text-base font-bold text-red-600">Overdue Tasks</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <OverdueList tasks={overdueTasks} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
