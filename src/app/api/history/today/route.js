import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import HistoryEvent from "@/models/HistoryEvent";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    let month = searchParams.get("month");
    let day = searchParams.get("day");

    if (!month || !day) {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Detroit",
        month: "numeric",
        day: "numeric",
      }).formatToParts(new Date());

      month = Number(parts.find((p) => p.type === "month").value);

      day = Number(parts.find((p) => p.type === "day").value);
    } else {
      month = Number(month);
      day = Number(day);
    }

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(day) ||
      day < 1 ||
      day > 31
    ) {
      return NextResponse.json(
        { error: "Invalid month or day" },
        { status: 400 },
      );
    }

    const events = await HistoryEvent.find(
      {
        month,
        day,
        "verification.status": "approved",
        "archive.status": "active",
      },
      {
        month: 1,
        day: 1,
        year: 1,
        title: 1,
        description: 1,
        significance: 1,
        category: 1,
        people: 1,
        organizations: 1,
        location: 1,
        images: 1,
      },
    )
      .sort({ year: 1 })
      .lean();

    return NextResponse.json({
      date: {
        month,
        day,
      },
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("Failed to load today's history:", error);

    return NextResponse.json(
      {
        error: "Failed to load today's history",
      },
      { status: 500 },
    );
  }
}
