"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { TaskBarChart } from "@/components/task-bar-chart";
import { OverdueList } from "@/components/overdue-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2, Clock, AlertCircle, ListTodo,
  LayoutDashboard, ShieldCheck, RefreshCw,
  FolderKanban, User, Inbox,
} from "lucide-react";

interface MemberStat {
  id: string;
  name: string;
  total: number;
  done: number;
  inProgress: number;
  projects: number;
}

interface DashboardStats {
  // workspace-wide
  total: number;
  done: number;
  overdue: number;
  inProgress: number;
  todo: number;
  byProject: { projectId: string; projectName: string; total: number; done: number; overdue: number; inProgress: number }[];
  // personal
  myAssignedCount: number;
  myProjectCount: number;
  myDone: number;
  myInProgress: number;
  myOverdue: number;
  // admin
  memberStats: MemberStat[];
}

interface Task {
  id: string;
  title: string;
  status: string;
  dueDate?: string;
  project?: { id: string; name: string };
}

const POLL_INTERVAL = 10_000;

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const bg = pct === 100 ? "#22c55e" : pct >= 60 ? "#6366f1" : pct >= 30 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: bg }} />
      </div>
      <span className="text-xs text-slate-400 w-7 text-right">{pct}%</span>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchData(silent = false) {
    if (silent) setRefreshing(true);
    try {
      const [statsRes, tasksRes] = await Promise.all([
        api.get<{ data: DashboardStats }>("/api/dashboard/stats"),
        api.get<{ data: Task[] }>("/api/tasks?limit=50"),
      ]);
      setStats(statsRes.data);
      const now = new Date();
      setOverdueTasks(
        tasksRes.data.filter((t) => t.status !== "DONE" && t.dueDate && new Date(t.dueDate) < now).slice(0, 5)
      );
      setLastUpdated(new Date());
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(() => fetchData(true), POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const isAdmin = user?.role === "ADMIN";
  const completionRate = stats && stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const myCompletionRate = stats && stats.myAssignedCount > 0 ? Math.round((stats.myDone / stats.myAssignedCount) * 100) : 0;

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-20 rounded-xl" />
      <div className="grid grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );

  const initials = user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-4">

      {/* Compact welcome banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl px-5 py-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-black text-sm shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-3.5 h-3.5 text-indigo-300" />
              <h1 className="text-base font-bold">Welcome, {user?.name?.split(" ")[0]}</h1>
              <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-white/10 ${refreshing ? "text-yellow-300" : "text-green-300"}`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${refreshing ? "bg-yellow-400" : "bg-green-400"}`} />
                {refreshing ? "Updating" : "Live"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-indigo-300" />
              <span className="text-xs text-indigo-200">{isAdmin ? "Admin · All workspace data" : "Member · Workspace overview"}</span>
              {lastUpdated && (
                <span className="text-xs text-indigo-300 flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5" />{lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-3xl font-black">{completionRate}%</div>
          <div className="text-indigo-200 text-xs">workspace done</div>
          <div className="mt-1 w-20 ml-auto">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-green-400 rounded-full transition-all duration-700" style={{ width: `${completionRate}%` }} />
            </div>
            <p className="text-indigo-300 text-xs mt-0.5">{stats?.done}/{stats?.total} tasks</p>
          </div>
        </div>
      </div>

      {/* Workspace-wide stats — SAME for all users */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Workspace Overview</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Tasks",  value: stats?.total ?? 0,      icon: ListTodo,     cls: "text-slate-700",  bg: "bg-slate-50 border-slate-200" },
            { label: "Completed",    value: stats?.done ?? 0,        icon: CheckCircle2, cls: "text-green-700",  bg: "bg-green-50 border-green-200" },
            { label: "In Progress",  value: stats?.inProgress ?? 0,  icon: Clock,        cls: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
            { label: "Overdue",      value: stats?.overdue ?? 0,     icon: AlertCircle,  cls: "text-red-700",    bg: "bg-red-50 border-red-200" },
          ].map(({ label, value, icon: Icon, cls, bg }) => (
            <Card key={label} className={`border-2 ${bg}`}>
              <CardContent className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className={`text-2xl font-black ${cls}`}>{value}</p>
                </div>
                <Icon className={`w-5 h-5 opacity-30 ${cls}`} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Personal stats — unique per user */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">My Stats</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-2 border-indigo-100 bg-indigo-50">
            <CardContent className="px-4 py-3 flex items-center gap-2">
              <FolderKanban className="w-6 h-6 text-indigo-400 shrink-0" />
              <div>
                <p className="text-xs text-indigo-500">My Projects</p>
                <p className="text-2xl font-black text-indigo-700">{stats?.myProjectCount ?? 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-purple-100 bg-purple-50">
            <CardContent className="px-4 py-3 flex items-center gap-2">
              <User className="w-6 h-6 text-purple-400 shrink-0" />
              <div>
                <p className="text-xs text-purple-500">Assigned to Me</p>
                <p className="text-2xl font-black text-purple-700">{stats?.myAssignedCount ?? 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-100 bg-green-50">
            <CardContent className="px-4 py-3 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
              <div>
                <p className="text-xs text-green-600">My Done</p>
                <p className="text-2xl font-black text-green-700">{stats?.myDone ?? 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-100 bg-blue-50">
            <CardContent className="px-4 py-3 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-400 shrink-0" />
              <div>
                <p className="text-xs text-blue-600">My Progress</p>
                <p className="text-2xl font-black text-blue-700">{myCompletionRate}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* No workspace tasks yet */}
      {(stats?.total ?? 0) === 0 ? (
        <Card className="border-2 border-dashed border-slate-200">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Inbox className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-slate-500 font-medium text-sm">No tasks in workspace yet</p>
            <p className="text-slate-400 text-xs mt-1">
              {isAdmin ? "Create a project and add tasks." : "Ask an admin to create projects and tasks."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Per-project progress */}
          {(stats?.byProject?.length ?? 0) > 0 && (
            <Card className="border-2">
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-sm font-bold text-slate-700">Project Progress</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                {stats!.byProject.map((proj) => (
                  <div key={proj.projectId}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-slate-700 truncate">{proj.projectName}</p>
                      <div className="flex items-center gap-2 shrink-0 ml-2 text-xs">
                        <span className="text-slate-400">{proj.done}/{proj.total}</span>
                        {proj.inProgress > 0 && <span className="text-blue-500">{proj.inProgress} active</span>}
                        {proj.overdue > 0 && <span className="text-red-500">{proj.overdue} late</span>}
                      </div>
                    </div>
                    <ProgressBar value={proj.done} total={proj.total} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Admin: team workload */}
          {isAdmin && (stats?.memberStats?.length ?? 0) > 0 && (
            <Card className="border-2">
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-sm font-bold text-slate-700">Team Workload</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                {stats!.memberStats.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                      {m.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-slate-700 truncate">{m.name}</p>
                        <div className="flex items-center gap-3 shrink-0 ml-2 text-xs">
                          <span className="text-slate-500"><span className="font-bold text-slate-700">{m.total}</span> tasks</span>
                          <span className="text-green-600"><span className="font-bold">{m.done}</span> done</span>
                          <span className="text-blue-600"><span className="font-bold">{m.inProgress}</span> active</span>
                          <span className="text-slate-400 flex items-center gap-0.5"><FolderKanban className="w-3 h-3" />{m.projects}</span>
                        </div>
                      </div>
                      <ProgressBar value={m.done} total={m.total} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Chart + Overdue */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="md:col-span-2 border-2">
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-sm font-bold text-slate-700">Tasks by Project</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <TaskBarChart data={stats?.byProject ?? []} />
              </CardContent>
            </Card>
            <Card className="border-2 border-red-100">
              <CardHeader className="pb-1 pt-3 px-4">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  <CardTitle className="text-sm font-bold text-red-600">Overdue Tasks</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <OverdueList tasks={overdueTasks} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
