"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
  id: string;
  name: string;
}

export default function NewTaskPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<User[]>([]);
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM", dueDate: "", assignedToId: "" });

  useEffect(() => {
    api.get<{ data: { members: { user: User }[] } }>(`/api/projects/${projectId}`)
      .then((res) => setMembers(res.data.members.map((m) => m.user)));
  }, [projectId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        projectId,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        assignedToId: form.assignedToId || undefined,
      };
      await api.post("/api/tasks", body);
      toast.success("Task created!");
      router.push(`/projects/${projectId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">New Task</h1>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader><CardTitle className="text-base">Task Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Task title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" placeholder="Task details…" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["LOW", "MEDIUM", "HIGH"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select value={form.assignedToId} onValueChange={(v) => setForm((f) => ({ ...f, assignedToId: v }))}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="gap-3">
            <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create Task"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
