import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";

export async function POST(request) {
  try {
    const body = await request.json();

    const username = body.username?.trim();

    if (!username) {
      return NextResponse.json(
        {
          error: "Username is required.",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const adminUser = await AdminUser.findOne({
      username,
    }).select("securityQuestions");

    if (!adminUser) {
      return NextResponse.json(
        {
          error: "Unable to begin password recovery.",
        },
        { status: 404 },
      );
    }

    if (
      !adminUser.securityQuestions ||
      adminUser.securityQuestions.length !== 3
    ) {
      return NextResponse.json(
        {
          error: "Password recovery has not been configured.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      questions: adminUser.securityQuestions.map((item) => item.question),
    });
  } catch (error) {
    console.error("Recovery questions error:", error);

    return NextResponse.json(
      {
        error: "Unable to load recovery questions.",
      },
      { status: 500 },
    );
  }
}
