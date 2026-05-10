"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  createdAt: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && currentUser.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    api.get<{ data: User[] }>("/api/users")
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false));
  }, [currentUser, router]);

  async function changeRole(userId: string, role: string) {
    setUpdating(userId);
    try {
      const res = await api.put<{ data: User }>(`/api/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => u.id === userId ? res.data : u));
      toast.success("Role updated successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setUpdating(null);
    }
  }

  const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-500 text-sm mt-1">Manage user roles and permissions</p>
      </div>

      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 rounded-xl border bg-slate-50 hover:bg-white transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${user.role === "ADMIN" ? "bg-indigo-600" : "bg-slate-400"}`}>
                      {initials(user.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{user.name}</p>
                        {user.id === currentUser?.id && (
                          <Badge className="text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-100">You</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={user.role === "ADMIN" ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-100 font-bold" : "bg-slate-100 text-slate-600 hover:bg-slate-100 font-bold"}>
                      {user.role}
                    </Badge>
                    {user.id !== currentUser?.id && (
                      <Select
                        value={user.role}
                        onValueChange={(value) => changeRole(user.id, value)}
                        disabled={updating === user.id}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                          <SelectItem value="MEMBER">MEMBER</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {user.id === currentUser?.id && (
                      <span className="text-xs text-slate-400 w-32 text-center">Cannot change own role</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
