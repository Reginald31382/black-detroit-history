import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

    const username = process.env.ADMIN_USERNAME;

    const password = process.env.ADMIN_PASSWORD;

    if (!username || !password) {
      return NextResponse.json(
        {
          error: "Admin authentication is not configured.",
        },
        { status: 500 },
      );
    }

    if (body.username !== username || body.password !== password) {
      return NextResponse.json(
        {
          error: "Invalid username or password.",
        },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set("bdh_admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Login failed.",
      },
      { status: 400 },
    );
  }
}
