"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDate, priorityColors } from "@/lib/utils";
import type { Priority } from "@/lib/utils";
import { FolderKanban, Plus, Users, ListTodo, Calendar, Flag, MoreVertical, Pencil, Trash2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description?: string;
  dueDate?: string;
  priority: Priority;
  createdAt: string;
  members?: { userId: string }[];
  _count?: { tasks: number };
}

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === "ADMIN";

  function loadProjects() {
    api.get<{ data: Project[] }>("/api/projects")
      .then((res) => setProjects(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProjects();
    function onVisible() { if (document.visibilityState === "visible") loadProjects(); }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  async function deleteProject(id: string, name: string) {
    if (!confirm(`Delete project "${name}"? All tasks inside will also be deleted.`)) return;
    try {
      await api.delete(`/api/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success("Project deleted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">All active projects in your workspace</p>
        </div>
        {isAdmin && (
          <Link href="/projects/new" className={cn(buttonVariants(), "bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2")}>
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <p className="text-slate-400 text-center py-16">No projects yet. {isAdmin ? "Create one to get started." : "Ask an admin to create one."}</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{project.name}</CardTitle>
                    <CardDescription className="mt-0.5 line-clamp-2">{project.description ?? "No description"}</CardDescription>
                  </div>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 shrink-0 mt-0.5">
                        <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}/edit`)}>
                          <Pencil className="w-3.5 h-3.5 mr-2" /> Edit Project
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={() => deleteProject(project.id, project.name)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>

              <CardContent className="py-2">
                <div className="flex items-center justify-between mb-2">
                  <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${priorityColors[project.priority ?? "MEDIUM"]}`}>
                    <Flag className="w-3 h-3" />
                    {project.priority ?? "MEDIUM"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><ListTodo className="w-3.5 h-3.5" />{project._count?.tasks ?? 0} tasks</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{project.members?.length ?? 0} members</span>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-2 items-start pt-3 border-t mt-auto">
                <div className="flex items-center justify-between w-full text-xs text-slate-400">
                  <span>Created {formatDate(project.createdAt)}</span>
                  {project.dueDate && (
                    <span className="flex items-center gap-1 text-amber-600 font-medium">
                      <Calendar className="w-3 h-3" />
                      Due {formatDate(project.dueDate)}
                    </span>
                  )}
                </div>
                <Link href={`/projects/${project.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-center")}>
                  View Project
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
