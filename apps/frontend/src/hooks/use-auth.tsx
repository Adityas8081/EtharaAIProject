"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AUTH_CACHE_KEY = "tf_user";

function getCachedUser(): User | null {
  try {
    const raw = sessionStorage.getItem(AUTH_CACHE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function setCachedUser(u: User | null) {
  try {
    if (u) sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(u));
    else sessionStorage.removeItem(AUTH_CACHE_KEY);
  } catch {}
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Always start null/loading so server and client render identically (no hydration mismatch)
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchUser() {
    try {
      const res = await api.get<{ data: User }>("/api/users/me");
      setUser(res.data);
      setCachedUser(res.data);
    } catch {
      setUser(null);
      setCachedUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try { await api.post("/api/auth/logout", {}); } catch {}
    setUser(null);
    setCachedUser(null);
    window.location.href = "/login";
  }

  useEffect(() => {
    // Restore from cache instantly so UI doesn't flash, then verify with server
    const cached = getCachedUser();
    if (cached) {
      setUser(cached);
      setLoading(false);
    }
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refetch: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
