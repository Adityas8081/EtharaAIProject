"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { RoleGuard } from "@/components/role-guard";
import { TaskTable } from "@/components/task-table";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskStatus, Priority, formatDate, priorityColors } from "@/lib/utils";
import { Plus, Calendar, Flag, MoreVertical, Pencil, Trash2, CheckCircle2, Clock, Circle, ArrowRight, Bell } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  assignedAt?: string;
  assignedTo?: { id: string; name: string };
  project?: { id: string; name: string };
}

interface Project {
  id: string;
  name: string;
  description?: string;
  dueDate?: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  tasks: Task[];
  members: { userId: string; user: User }[];
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMember, setAddingMember] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const isAdmin = user?.role === "ADMIN";

  function loadProject() {
    const reqs: Promise<unknown>[] = [api.get<{ data: Project }>(`/api/projects/${id}`)];
    if (user?.role === "ADMIN") reqs.push(api.get<{ data: User[] }>("/api/users"));
    Promise.all(reqs).then(([projRes, usersRes]) => {
      setProject((projRes as { data: Project }).data);
      if (usersRes) setAllUsers((usersRes as { data: User[] }).data);
    }).finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProject();
    // Refetch whenever the tab becomes visible again (handles back-navigation)
    function onVisible() { if (document.visibilityState === "visible") loadProject(); }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.role]);

  async function deleteProject() {
    if (!confirm(`Delete project "${project?.name}"? All tasks inside will also be deleted.`)) return;
    try {
      await api.delete(`/api/projects/${id}`);
      toast.success("Project deleted");
      router.push("/projects");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
    }
  }

  async function deleteTask(taskId: string, taskTitle: string) {
    if (!confirm(`Delete task "${taskTitle}"?`)) return;
    try {
      await api.delete(`/api/tasks/${taskId}`);
      setProject((p) => p ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p);
      toast.success("Task deleted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete task");
    }
  }

  async function addMember() {
    if (!selectedUser) return;
    setAddingMember(true);
    try {
      await api.post(`/api/projects/${id}/members`, { userId: selectedUser });
      const res = await api.get<{ data: Project }>(`/api/projects/${id}`);
      setProject(res.data);
      setSelectedUser("");
      toast.success("Member added");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setAddingMember(false);
    }
  }

  async function removeMember(userId: string) {
    try {
      await api.delete(`/api/projects/${id}/members/${userId}`);
      setProject((p) => p ? { ...p, members: p.members.filter((m) => m.userId !== userId) } : p);
      toast.success("Member removed");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    }
  }

  async function updateTaskStatus(taskId: string, status: TaskStatus) {
    try {
      await api.put(`/api/tasks/${taskId}`, { status });
      setProject((p) => p ? { ...p, tasks: p.tasks.map((t) => t.id === taskId ? { ...t, status } : t) } : p);
      toast.success(`Marked as ${status.replace("_", " ").toLowerCase()}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!project) return <p className="text-slate-500">Project not found</p>;

  const memberUserIds = new Set(project.members.map((m) => m.userId));
  const nonMembers = allUsers.filter((u) => !memberUserIds.has(u.id));
  const myTasks = !isAdmin ? (project.tasks ?? []).filter((t) => t.assignedTo?.id === user?.id) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
          {project.description && <p className="text-slate-500 mt-1 text-sm">{project.description}</p>}
          <div className="flex items-center gap-3 mt-2">
            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${priorityColors[project.priority]}`}>
              <Flag className="w-3 h-3" />
              {project.priority}
            </span>
            {project.dueDate && (
              <span className="flex items-center gap-1 text-sm text-amber-600 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                Due {formatDate(project.dueDate)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isAdmin && (
            <Link href={`/projects/${id}/tasks/new`} className={cn(buttonVariants({ variant: "outline" }), "flex items-center gap-2")}>
              <Plus className="w-4 h-4" /> Request Task
            </Link>
          )}
          {isAdmin && (
            <>
              <Link href={`/projects/${id}/tasks/new`} className={cn(buttonVariants(), "bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2")}>
                <Plus className="w-4 h-4" /> Add Task
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline", size: "icon" }))}>
                  <MoreVertical className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => router.push(`/projects/${id}/edit`)}>
                    <Pencil className="w-3.5 h-3.5 mr-2" /> Edit Project
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={deleteProject}>
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* My Tasks — member only, prominent status controls */}
      {!isAdmin && myTasks.length > 0 && (
        <Card className="border-2 border-indigo-200 bg-indigo-50">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-base text-indigo-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              My Tasks — Update Your Progress
            </CardTitle>
            <p className="text-xs text-indigo-500 mt-0.5">Click a button to change the status of your task</p>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3">
            {myTasks.map((task) => {
              const isDone = task.status === "DONE";
              const isInProgress = task.status === "IN_PROGRESS";
              const isTodo = task.status === "TODO";
              return (
                <div key={task.id} className={`bg-white rounded-xl border-2 p-4 ${isDone ? "border-green-300 opacity-75" : isInProgress ? "border-blue-300" : "border-slate-200"}`}>
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className={`text-sm font-semibold ${isDone ? "line-through text-slate-400" : "text-slate-800"}`}>{task.title}</p>
                    {task.dueDate && (
                      <span className="text-xs text-amber-600 flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3" />{formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                  {task.assignedAt && (
                    <p className="text-xs text-indigo-400 flex items-center gap-1 mb-3">
                      <Bell className="w-3 h-3" />
                      Assigned {new Date(task.assignedAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => !isTodo && updateTaskStatus(task.id, "TODO")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${isTodo ? "bg-slate-700 text-white border-slate-700" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"}`}
                    >
                      <Circle className="w-3.5 h-3.5" /> To Do
                    </button>
                    <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                    <button
                      onClick={() => !isInProgress && updateTaskStatus(task.id, "IN_PROGRESS")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${isInProgress ? "bg-blue-600 text-white border-blue-600" : "bg-white text-blue-500 border-blue-200 hover:border-blue-400"}`}
                    >
                      <Clock className="w-3.5 h-3.5" /> In Progress
                    </button>
                    <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                    <button
                      onClick={() => !isDone && updateTaskStatus(task.id, "DONE")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${isDone ? "bg-green-600 text-white border-green-600" : "bg-white text-green-600 border-green-200 hover:border-green-400"}`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Done
                    </button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {!isAdmin && myTasks.length === 0 && (
        <Card className="border-2 border-dashed border-indigo-200 bg-indigo-50/50">
          <CardContent className="flex items-center gap-3 py-4 px-5">
            <CheckCircle2 className="w-5 h-5 text-indigo-300" />
            <p className="text-sm text-indigo-500">No tasks assigned to you in this project yet.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Tasks */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Tasks ({project.tasks?.length ?? 0})</CardTitle></CardHeader>
            <CardContent>
              <TaskTable
                tasks={project.tasks ?? []}
                isAdmin={isAdmin}
                onDeleteTask={deleteTask}
                onStatusChange={(taskId, status) =>
                  setProject((p) => p ? { ...p, tasks: p.tasks.map((t) => t.id === taskId ? { ...t, status } : t) } : p)
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Members */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Members ({project.members.length})</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {project.members.map((m) => (
                <div key={m.userId} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{m.user.name}</p>
                    <Badge variant="secondary" className="text-xs">{m.user.role}</Badge>
                  </div>
                  {isAdmin && m.userId !== user?.id && (
                    <button onClick={() => removeMember(m.userId)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  )}
                </div>
              ))}
              {isAdmin && nonMembers.length > 0 && (
                <div className="pt-3 border-t space-y-2">
                  <Select value={selectedUser} onValueChange={(v) => setSelectedUser(v ?? "")}>
                    <SelectTrigger><SelectValue placeholder="Add member…" /></SelectTrigger>
                    <SelectContent>
                      {nonMembers.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="w-full" onClick={addMember} disabled={!selectedUser || addingMember}>
                    {addingMember ? "Adding…" : "Add Member"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
