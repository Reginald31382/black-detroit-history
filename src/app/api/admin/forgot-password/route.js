import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";

import connectDB from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";

const MAX_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 30;
const TOKEN_MINUTES = 15;

function normalizeAnswer(answer) {
  return answer.trim().toLowerCase().replace(/\s+/g, " ");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

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
    });

    /*
     * Do not reveal whether the username exists.
     */
    if (!adminUser) {
      return NextResponse.json({
        success: true,
        message: "If the account exists, the recovery process is available.",
      });
    }

    if (
      adminUser.recoveryLockedUntil &&
      adminUser.recoveryLockedUntil > new Date()
    ) {
      const remainingMinutes = Math.ceil(
        (adminUser.recoveryLockedUntil.getTime() - Date.now()) / 60000,
      );

      return NextResponse.json(
        {
          error: `Password recovery is temporarily locked. Try again in approximately ${remainingMinutes} minute${
            remainingMinutes === 1 ? "" : "s"
          }.`,
        },
        { status: 429 },
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

    const answers = body.answers;

    if (!Array.isArray(answers) || answers.length !== 3) {
      return NextResponse.json(
        {
          error: "All three security questions must be answered.",
        },
        { status: 400 },
      );
    }

    for (const answer of answers) {
      if (!answer?.trim()) {
        return NextResponse.json(
          {
            error: "All three security questions must be answered.",
          },
          { status: 400 },
        );
      }
    }

    let allAnswersCorrect = true;

    for (let i = 0; i < 3; i++) {
      const submittedAnswer = normalizeAnswer(answers[i]);

      const correct = await bcrypt.compare(
        submittedAnswer,
        adminUser.securityQuestions[i].answerHash,
      );

      if (!correct) {
        allAnswersCorrect = false;
      }
    }

    if (!allAnswersCorrect) {
      adminUser.recoveryAttempts += 1;

      if (adminUser.recoveryAttempts >= MAX_ATTEMPTS) {
        adminUser.recoveryLockedUntil = new Date(
          Date.now() + LOCKOUT_MINUTES * 60 * 1000,
        );

        adminUser.recoveryAttempts = 0;
      }

      await adminUser.save();

      const attemptsRemaining = Math.max(
        0,
        MAX_ATTEMPTS - adminUser.recoveryAttempts,
      );

      return NextResponse.json(
        {
          error:
            attemptsRemaining > 0
              ? `Incorrect answers. You have ${attemptsRemaining} attempt${
                  attemptsRemaining === 1 ? "" : "s"
                } remaining.`
              : "Incorrect answers. Password recovery has been temporarily locked.",
          attemptsRemaining,
        },
        { status: 401 },
      );
    }

    /*
     * Successful challenge.
     */
    const resetToken = crypto.randomBytes(32).toString("hex");

    const resetTokenHash = hashToken(resetToken);

    adminUser.resetTokenHash = resetTokenHash;
    adminUser.resetTokenExpires = new Date(
      Date.now() + TOKEN_MINUTES * 60 * 1000,
    );

    adminUser.recoveryAttempts = 0;
    adminUser.recoveryLockedUntil = null;

    await adminUser.save();

    return NextResponse.json({
      success: true,
      resetToken,
      expiresInMinutes: TOKEN_MINUTES,
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return NextResponse.json(
      {
        error: "Unable to process password recovery.",
      },
      { status: 500 },
    );
  }
}
