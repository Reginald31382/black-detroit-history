import { NextResponse } from "next/server";

import { getSessionCookieName, verifySessionToken } from "@/lib/auth/session";

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (
    pathname === "/admin/login" ||
    pathname === "/admin/forgot-password" ||
    pathname === "/admin/reset-password" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout" ||
    pathname === "/api/admin/forgot-password" ||
    pathname === "/api/admin/forgot-password/questions" ||
    pathname === "/api/admin/reset-password" ||
    pathname === "/api/history/today"
  ) {
    return NextResponse.next();
  }

  // Protect all admin pages
  if (pathname.startsWith("/admin")) {
    const sessionToken = request.cookies.get(getSessionCookieName())?.value;

    const session = verifySessionToken(sessionToken);

    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Protect history management APIs
  if (
    pathname.startsWith("/api/history") &&
    pathname !== "/api/history/today"
  ) {
    const sessionToken = request.cookies.get(getSessionCookieName())?.value;

    const session = verifySessionToken(sessionToken);

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }
  }

  // Protect Instagram APIs
  if (pathname.startsWith("/api/instagram")) {
    const sessionToken = request.cookies.get(getSessionCookieName())?.value;

    const session = verifySessionToken(sessionToken);

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/history/:path*",
    "/api/instagram/:path*",
  ],
};
