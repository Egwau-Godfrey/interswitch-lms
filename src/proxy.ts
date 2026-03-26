import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // Public routes that don't require authentication
  const publicRoutes = ["/"];

  // API routes that should be handled by NextAuth
  const authApiRoutes = ["/api/auth"];

  // Check if the current path is an auth API route
  const isAuthApiRoute = authApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Allow auth API routes to pass through
  if (isAuthApiRoute) {
    return NextResponse.next();
  }

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.includes(pathname);

  // If user is not authenticated and trying to access protected route
  if (!isAuthenticated && !isPublicRoute) {
    const url = new URL("/", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // User wants to always be able to view the login page at "/"
  // Commenting out the automatic redirect for authenticated users.
  /*
  if (isAuthenticated && pathname === "/") {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    const role = (req.auth as any)?.user?.role;
    const defaultDashboard = role === "super_admin" ? "/super-admin" : "/manager";
    const url = new URL(callbackUrl || defaultDashboard, req.url);
    return NextResponse.redirect(url);
  }
  */

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
