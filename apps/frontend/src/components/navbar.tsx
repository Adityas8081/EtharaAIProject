"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/tasks", label: "Tasks" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-bold text-xl text-indigo-600 tracking-tight">
            TaskFlow
          </Link>
          <nav className="flex gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  pathname.startsWith(link.href)
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2 border">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold",
                  user.role === "ADMIN" ? "bg-indigo-600" : "bg-slate-500"
                )}>
                  {initials}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900 leading-tight">{user.name}</span>
                  <span className="text-xs text-slate-500 leading-tight">{user.email}</span>
                </div>
                <Badge className={cn(
                  "text-xs font-bold ml-1",
                  user.role === "ADMIN"
                    ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-100"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                )}>
                  {user.role}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={logout} className="text-red-600 border-red-200 hover:bg-red-50">
                Logout
              </Button>
            </>
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
          )}
        </div>
      </div>
    </header>
  );
}
