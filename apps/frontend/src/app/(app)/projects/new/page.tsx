"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderKanban, ArrowLeft, X, Calendar, Flag, Users, UserPlus, Check } from "lucide-react";
import { cn, priorityColors } from "@/lib/utils";
import type { Priority } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  role: string;
}

const priorities: Priority[] = ["LOW", "MEDIUM", "HIGH"];

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", description: "", dueDate: "", priority: "MEDIUM" as Priority });

  useEffect(() => {
    api.get<{ data: User[] }>("/api/users").then((res) => setUsers(res.data)).catch(() => {});
  }, []);

  function toggleMember(id: string) {
    setSelectedMembers((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
  }

  function clearForm() {
    setForm({ name: "", description: "", dueDate: "", priority: "MEDIUM" });
    setSelectedMembers([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ data: { id: string } }>("/api/projects", {
        name: form.name,
        description: form.description || undefined,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        priority: form.priority,
      });

      const projectId = res.data.id;

      // Add selected members
      if (selectedMembers.length > 0) {
        await Promise.all(
          selectedMembers.map((userId) =>
            api.post(`/api/projects/${projectId}/members`, { userId }).catch(() => {})
          )
        );
      }

      toast.success("Project created!");
      router.push(`/projects/${projectId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
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
        Back to Projects
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <FolderKanban className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Project</h1>
          <p className="text-sm text-slate-500">Set up your project and add team members</p>
        </div>
      </div>

      <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Section: Project Details */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Project Details</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-6 space-y-5">

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="name"
                  placeholder="e.g. Website Redesign"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="pr-8"
                />
                {form.name && (
                  <button type="button" onClick={() => setForm((f) => ({ ...f, name: "" }))}
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
                placeholder="What is this project about? What are the goals?"
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
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

          </div>

          {/* Section: Assign Members */}
          <div className="px-6 py-4 border-t border-b border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Assign Members
              </p>
              {selectedMembers.length > 0 && (
                <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                  {selectedMembers.length} selected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Select team members to add to this project</p>
          </div>

          <div className="px-6 py-4">
            {users.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No other users registered yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {users.map((u) => {
                  const selected = selectedMembers.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleMember(u.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all",
                        selected
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                        u.role === "ADMIN" ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"
                      )}>
                        {u.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.role}</p>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                        selected ? "border-indigo-500 bg-indigo-500" : "border-slate-300"
                      )}>
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={clearForm}
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button
                type="submit"
                disabled={loading || !form.name.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 px-6 flex items-center gap-2"
              >
                {loading ? "Creating…" : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Create Project
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
