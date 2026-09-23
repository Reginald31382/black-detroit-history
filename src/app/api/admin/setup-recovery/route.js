import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import connectDB from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";

import { getSessionCookieName, verifySessionToken } from "@/lib/auth/session";

function normalizeAnswer(answer) {
  return answer.trim().toLowerCase().replace(/\s+/g, " ");
}

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

    const questions = body.questions;

    if (!Array.isArray(questions) || questions.length !== 3) {
      return NextResponse.json(
        {
          error: "Exactly three security questions are required.",
        },
        { status: 400 },
      );
    }

    for (const item of questions) {
      if (!item.question?.trim() || !item.answer?.trim()) {
        return NextResponse.json(
          {
            error: "Each question must have an answer.",
          },
          { status: 400 },
        );
      }
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

    const securityQuestions = [];

    for (const item of questions) {
      const answerHash = await bcrypt.hash(normalizeAnswer(item.answer), 12);

      securityQuestions.push({
        question: item.question.trim(),
        answerHash,
      });
    }

    adminUser.securityQuestions = securityQuestions;
    adminUser.recoveryAttempts = 0;
    adminUser.recoveryLockedUntil = null;
    adminUser.resetTokenHash = null;
    adminUser.resetTokenExpires = null;

    await adminUser.save();

    return NextResponse.json({
      success: true,
      message: "Password recovery questions configured successfully.",
    });
  } catch (error) {
    console.error("Recovery setup error:", error);

    return NextResponse.json(
      {
        error: "Unable to configure password recovery.",
      },
      { status: 500 },
    );
  }
}
