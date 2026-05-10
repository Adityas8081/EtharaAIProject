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

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-bold text-lg text-slate-900">TaskFlow</Link>
          <nav className="hidden md:flex gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={cn("px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname.startsWith(link.href) ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <>
              <span className="hidden sm:block text-sm text-slate-600">{user.name}</span>
              <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
              <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
