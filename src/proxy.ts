import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;
  const role: string = (req.auth as any)?.user?.role ?? "";

  // Always allow NextAuth API routes through
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Public routes — always accessible
  const publicRoutes = ["/"];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Unauthenticated users get redirected to login
  if (!isAuthenticated) {
    const url = new URL("/", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // ── Role-based route guards ──────────────────────────────────────────
  // /super-admin/* — only super_admin (or legacy is_admin)
  if (pathname.startsWith("/super-admin")) {
    if (role === "super_admin" || (req.auth as any)?.user?.isAdmin) {
      return NextResponse.next();
    }
    // user → their own portal; agent → agent portal
    const fallback = role === "user" ? "/user" : "/agent";
    return NextResponse.redirect(new URL(fallback, req.url));
  }

  // /user/* — super_admin or user
  if (pathname.startsWith("/user")) {
    if (role === "super_admin" || role === "user" || (req.auth as any)?.user?.isAdmin) {
      return NextResponse.next();
    }
    // agent (or unknown) → agent portal
    return NextResponse.redirect(new URL("/agent", req.url));
  }

  // /agent/* — any authenticated user may access their own portal
  // (agents are already blocked from /user and /super-admin above)
  if (pathname.startsWith("/agent")) {
    return NextResponse.next();
  }

  // All other authenticated routes — allow through
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
