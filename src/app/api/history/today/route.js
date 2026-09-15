import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import HistoryEvent from "@/models/HistoryEvent";
export async function GET() {
  try {
    await connectDB();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Detroit",
      month: "numeric",
      day: "numeric",
    }).formatToParts(new Date());
    const month = Number(parts.find((p) => p.type === "month").value),
      day = Number(parts.find((p) => p.type === "day").value);
    const events = await HistoryEvent.find({
      month,
      day,
      "verification.status": "approved",
      "lifecycle.status": "active",
    })
      .sort({ year: 1 })
      .lean();
    return NextResponse.json({
      date: { month, day },
      count: events.length,
      events,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load today's history" },
      { status: 500 },
    );
  }
}
