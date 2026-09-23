import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import connectDB from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionDuration,
} from "@/lib/auth/session";

export async function POST(request) {
  try {
    const body = await request.json();

    const username = body.username?.trim();
    const password = body.password;

    if (!username || !password) {
      return NextResponse.json(
        {
          error: "Username and password are required.",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const adminUser = await AdminUser.findOne({
      username,
    });

    if (!adminUser) {
      return NextResponse.json(
        {
          error: "Invalid username or password.",
        },
        { status: 401 },
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      adminUser.passwordHash,
    );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          error: "Invalid username or password.",
        },
        { status: 401 },
      );
    }

    const sessionToken = createSessionToken(adminUser._id.toString());

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set(getSessionCookieName(), sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: getSessionDuration(),
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      {
        error: "Login failed.",
      },
      { status: 500 },
    );
  }
}
