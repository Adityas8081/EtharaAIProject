"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();
  const { refetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "MEMBER" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/auth/signup", form);
      toast.success(`Account created! Welcome, ${form.name}.`);
      await refetch();
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
            TF
          </div>
          <h1 className="text-3xl font-black text-indigo-600">TaskFlow</h1>
          <p className="text-slate-500 text-sm">Team Task Manager</p>
        </div>
        <Card className="border-2 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold">Create account</CardTitle>
            <CardDescription>Start managing your team&apos;s tasks today</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" placeholder="Aditya Singh" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Min 8 characters" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={8} />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label>Select Role</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, role: "ADMIN" }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      form.role === "ADMIN"
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-900 mb-1">Admin</div>
                    <div className="text-xs text-slate-500">Create projects, assign tasks, manage team</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, role: "MEMBER" }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      form.role === "MEMBER"
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-900 mb-1">Member</div>
                    <div className="text-xs text-slate-500">View tasks, update status, collaborate</div>
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                {loading ? "Creating account…" : `Sign up as ${form.role}`}
              </Button>
              <p className="text-sm text-slate-500 text-center">
                Already have an account?{" "}
                <Link href="/login" className="text-indigo-600 font-semibold hover:underline">Sign in</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
