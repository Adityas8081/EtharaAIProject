"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  members?: { userId: string }[];
  _count?: { tasks: number };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: Project[] }>("/api/projects").then((res) => setProjects(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
        <RoleGuard role="ADMIN">
          <Button asChild><Link href="/projects/new">New Project</Link></Button>
        </RoleGuard>
      </div>
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <p className="text-slate-400 text-center py-16">No projects yet. Ask an admin to create one.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base">{project.name}</CardTitle>
                <CardDescription>{project.description ?? "No description"}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">{project._count?.tasks ?? 0} tasks · {project.members?.length ?? 0} members</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Created {formatDate(project.createdAt)}</span>
                <Button variant="outline" size="sm" asChild><Link href={`/projects/${project.id}`}>View</Link></Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
