import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";

import connectDB from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request) {
  try {
    const body = await request.json();

    const token = body.token;
    const newPassword = body.newPassword;
    const confirmPassword = body.confirmPassword;

    if (!token || !newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          error: "All fields are required.",
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

    const resetTokenHash = hashToken(token);

    const adminUser = await AdminUser.findOne({
      resetTokenHash,
      resetTokenExpires: {
        $gt: new Date(),
      },
    });

    if (!adminUser) {
      return NextResponse.json(
        {
          error: "This password reset link is invalid or has expired.",
        },
        { status: 400 },
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
            "Your new password must be different from your previous password.",
        },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    adminUser.passwordHash = passwordHash;
    adminUser.passwordChangedAt = new Date();

    // Invalidate the recovery token immediately.
    adminUser.resetTokenHash = null;
    adminUser.resetTokenExpires = null;

    // Reset recovery protection counters.
    adminUser.recoveryAttempts = 0;
    adminUser.recoveryLockedUntil = null;

    await adminUser.save();

    return NextResponse.json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return NextResponse.json(
      {
        error: "Unable to reset password.",
      },
      { status: 500 },
    );
  }
}
