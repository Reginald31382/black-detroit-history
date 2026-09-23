import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import connectDB from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth/session";

export async function POST(request) {
  try {
    const sessionToken = request.cookies.get(getSessionCookieName())?.value;

    const session = verifySessionToken(sessionToken);

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    const currentPassword = body.currentPassword;
    const newPassword = body.newPassword;
    const confirmPassword = body.confirmPassword;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          error: "All password fields are required.",
        },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          error: "New passwords do not match.",
        },
        { status: 400 },
      );
    }

    if (newPassword.length < 12) {
      return NextResponse.json(
        {
          error: "Your new password must be at least 12 characters.",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const adminUser = await AdminUser.findById(session.userId);

    if (!adminUser) {
      return NextResponse.json(
        {
          error: "Admin account not found.",
        },
        { status: 404 },
      );
    }

    const currentPasswordMatches = await bcrypt.compare(
      currentPassword,
      adminUser.passwordHash,
    );

    if (!currentPasswordMatches) {
      return NextResponse.json(
        {
          error: "Current password is incorrect.",
        },
        { status: 401 },
      );
    }

    const samePassword = await bcrypt.compare(
      newPassword,
      adminUser.passwordHash,
    );

    if (samePassword) {
      return NextResponse.json(
        {
          error:
            "Your new password must be different from your current password.",
        },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    adminUser.passwordHash = passwordHash;
    adminUser.passwordChangedAt = new Date();

    // Clear any outstanding password-reset token.
    adminUser.resetTokenHash = null;
    adminUser.resetTokenExpires = null;

    await adminUser.save();

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return NextResponse.json(
      {
        error: "Unable to change password.",
      },
      { status: 500 },
    );
  }
}
