import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import connectDB from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";

export async function POST() {
  try {
    await connectDB();

    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    const email = process.env.ADMIN_EMAIL;

    if (!username || !password || !email) {
      return NextResponse.json(
        {
          error:
            "ADMIN_USERNAME, ADMIN_PASSWORD, and ADMIN_EMAIL must be configured.",
        },
        { status: 500 },
      );
    }

    const existingUser = await AdminUser.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin account already exists.",
        },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const adminUser = await AdminUser.create({
      username,
      email,
      passwordHash,
      role: "admin",
      passwordChangedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Admin account created successfully.",
      user: {
        id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (error) {
    console.error("Admin bootstrap error:", error);

    return NextResponse.json(
      {
        error: "Unable to create admin account.",
      },
      { status: 500 },
    );
  }
}
