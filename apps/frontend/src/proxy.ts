import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/signup"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  const hasToken = request.cookies.has("accessToken");

  if (!isPublic && !hasToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isPublic && hasToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}
