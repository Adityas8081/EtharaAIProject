"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { RoleGuard } from "@/components/role-guard";
import { TaskTable } from "@/components/task-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskStatus, Priority } from "@/lib/utils";

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
  assignedTo?: { id: string; name: string };
  project?: { id: string; name: string };
}

interface Project {
  id: string;
  name: string;
  description?: string;
  tasks: Task[];
  members: { userId: string; user: User }[];
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMember, setAddingMember] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");

  useEffect(() => {
    const reqs: Promise<unknown>[] = [api.get<{ data: Project }>(`/api/projects/${id}`)];
    if (user?.role === "ADMIN") reqs.push(api.get<{ data: User[] }>("/api/users"));
    Promise.all(reqs).then(([projRes, usersRes]) => {
      setProject((projRes as { data: Project }).data);
      if (usersRes) setAllUsers((usersRes as { data: User[] }).data);
    }).finally(() => setLoading(false));
  }, [id, user?.role]);

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

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!project) return <p className="text-slate-500">Project not found</p>;

  const memberUserIds = new Set(project.members.map((m) => m.userId));
  const nonMembers = allUsers.filter((u) => !memberUserIds.has(u.id));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
          {project.description && <p className="text-slate-500 mt-1">{project.description}</p>}
        </div>
        <RoleGuard role="ADMIN">
          <Button asChild><Link href={`/projects/${id}/tasks/new`}>Add Task</Link></Button>
        </RoleGuard>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Tasks ({project.tasks?.length ?? 0})</CardTitle></CardHeader>
            <CardContent>
              <TaskTable tasks={project.tasks ?? []} />
            </CardContent>
          </Card>
        </div>
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
                  <RoleGuard role="ADMIN">
                    {m.userId !== user?.id && (
                      <button onClick={() => removeMember(m.userId)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    )}
                  </RoleGuard>
                </div>
              ))}
              <RoleGuard role="ADMIN">
                {nonMembers.length > 0 && (
                  <div className="pt-3 border-t space-y-2">
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
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
              </RoleGuard>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
