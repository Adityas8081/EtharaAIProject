"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, statusColors, priorityColors, TaskStatus, Priority } from "@/lib/utils";

interface User {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  assignedTo?: { id: string; name: string };
  assignedToId?: string;
  project?: { id: string; name: string };
  projectId: string;
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", priority: "MEDIUM", dueDate: "", assignedToId: "", status: "TODO" });

  useEffect(() => {
    api.get<{ data: Task }>(`/api/tasks/${id}`).then((res) => {
      const t = res.data;
      setTask(t);
      setEditForm({
        title: t.title,
        description: t.description ?? "",
        priority: t.priority,
        dueDate: t.dueDate ? t.dueDate.slice(0, 10) : "",
        assignedToId: t.assignedToId ?? "",
        status: t.status,
      });
      if (t.projectId) {
        api.get<{ data: { members: { user: User }[] } }>(`/api/projects/${t.projectId}`)
          .then((r) => setMembers(r.data.members.map((m) => m.user)))
          .catch(() => {});
      }
    }).finally(() => setLoading(false));
  }, [id]);

  async function saveEdit() {
    if (!task) return;
    setSaving(true);
    try {
      const body = {
        title: editForm.title,
        description: editForm.description || undefined,
        priority: editForm.priority,
        status: editForm.status,
        dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : undefined,
        assignedToId: editForm.assignedToId || undefined,
      };
      const res = await api.put<{ data: Task }>(`/api/tasks/${id}`, body);
      setTask(res.data);
      setEditing(false);
      toast.success("Task updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(status: TaskStatus) {
    if (!task) return;
    setSaving(true);
    try {
      const res = await api.put<{ data: Task }>(`/api/tasks/${id}`, { status });
      setTask(res.data);
      setEditForm((f) => ({ ...f, status }));
      toast.success("Status updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
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

  const isAdmin = user?.role === "ADMIN";
  const memberStatuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
  const adminStatuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE", "OVERDUE"];

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{task.title}</h1>
          {task.project && <p className="text-sm text-slate-500 mt-0.5">Project: {task.project.name}</p>}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && !editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
          )}
          {isAdmin && editing && (
            <>
              <Button size="sm" onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            </>
          )}
          {isAdmin && (
            <Button variant="destructive" size="sm" onClick={deleteTask}>Delete</Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {editing && isAdmin ? (
            <>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea rows={3} value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} placeholder="Task details…" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm((f) => ({ ...f, status: v ?? f.status }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {adminStatuses.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={editForm.priority} onValueChange={(v) => setEditForm((f) => ({ ...f, priority: v ?? f.priority }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["LOW", "MEDIUM", "HIGH"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={editForm.dueDate} onChange={(e) => setEditForm((f) => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <Select value={editForm.assignedToId} onValueChange={(v) => setEditForm((f) => ({ ...f, assignedToId: v ?? "" }))}>
                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {members.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}

          {!editing && (
            <div>
              <p className="text-slate-400 text-sm mb-2">Update Status</p>
              <Select value={task.status} onValueChange={(v) => updateStatus(v as TaskStatus)} disabled={saving}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(isAdmin ? adminStatuses : memberStatuses).map((s) => (
                    <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
