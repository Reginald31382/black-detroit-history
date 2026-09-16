import { NextResponse } from "next/server";

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout" ||
    pathname === "/api/history/today"
  ) {
    return NextResponse.next();
  }

  // Protect all admin pages
  if (pathname.startsWith("/admin")) {
    const session = request.cookies.get("bdh_admin_session")?.value;

    if (session !== "authenticated") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Protect history management APIs
  if (
    pathname.startsWith("/api/history") &&
    pathname !== "/api/history/today"
  ) {
    const session = request.cookies.get("bdh_admin_session")?.value;

    if (session !== "authenticated") {
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
    const session = request.cookies.get("bdh_admin_session")?.value;

    if (session !== "authenticated") {
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
