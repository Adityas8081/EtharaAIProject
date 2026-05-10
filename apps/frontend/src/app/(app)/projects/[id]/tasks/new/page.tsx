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
import { cn, priorityColors } from "@/lib/utils";
import type { Priority } from "@/lib/utils";
import { ArrowLeft, CheckSquare, Flag, Calendar, User, X } from "lucide-react";

interface Member {
  id: string;
  name: string;
  role: string;
}

const priorities: Priority[] = ["LOW", "MEDIUM", "HIGH"];

export default function NewTaskPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as Priority,
    dueDate: "",
    assignedToId: "",
  });

  useEffect(() => {
    api.get<{ data: { members: { user: Member }[] } }>(`/api/projects/${projectId}`)
      .then((res) => setMembers(res.data.members.map((m) => m.user)));
  }, [projectId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/tasks", {
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        projectId,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        // Only send assignedToId if a real user is selected (not empty string)
        assignedToId: form.assignedToId || undefined,
      });
      toast.success("Task created!");
      router.push(`/projects/${projectId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Project
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <CheckSquare className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add Task</h1>
          <p className="text-sm text-slate-500">Create a new task and assign it to a team member</p>
        </div>
      </div>

      <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Task Details</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-6 space-y-5">

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                Task Title <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="title"
                  placeholder="e.g. Design landing page"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  className="pr-8"
                />
                {form.title && (
                  <button type="button" onClick={() => setForm((f) => ({ ...f, title: "" }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description</Label>
                <span className="text-xs text-slate-400">Optional</span>
              </div>
              <Textarea
                id="description"
                placeholder="What needs to be done? Add any relevant details…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Priority + Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-slate-400" /> Priority
                </Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Priority }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p} value={p}>
                        <span className={cn("px-2 py-0.5 rounded text-xs font-semibold", priorityColors[p])}>{p}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dueDate" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Due Date
                  <span className="text-xs text-slate-400 font-normal">Optional</span>
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={form.dueDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Assign To */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Assign To
                <span className="text-xs text-slate-400 font-normal">Optional</span>
              </Label>
              {members.length === 0 ? (
                <div className="text-sm text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  No members in this project yet. Add members from the project page first.
                </div>
              ) : (
                <Select
                  value={form.assignedToId}
                  onValueChange={(v) => setForm((f) => ({ ...f, assignedToId: !v || v === "_none" ? "" : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Leave unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">
                      <span className="text-slate-400">Unassigned</span>
                    </SelectItem>
                    {members.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                            {u.name[0].toUpperCase()}
                          </div>
                          <span>{u.name}</span>
                          <span className="text-xs text-slate-400">{u.role}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setForm({ title: "", description: "", priority: "MEDIUM", dueDate: "", assignedToId: "" })}
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button
                type="submit"
                disabled={loading || !form.title.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 px-6"
              >
                {loading ? "Creating…" : "Create Task"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
