"use client";
import { useAuth } from "@/hooks/use-auth";
import { ReactNode } from "react";

interface RoleGuardProps {
  role: "ADMIN" | "MEMBER";
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ role, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();
  if (!user || user.role !== role) return <>{fallback}</>;
  return <>{children}</>;
}
