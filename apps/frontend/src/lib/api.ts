const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (res.status === 401) {
    const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, { method: "POST", credentials: "include" });
    if (refreshRes.ok) {
      const retry = await fetch(`${API_URL}${path}`, { ...options, credentials: "include", headers: { "Content-Type": "application/json", ...options.headers } });
      if (retry.ok) return retry.json();
    }
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/signup")) {
      window.location.href = "/login";
    }
    throw new Error("Session expired");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
