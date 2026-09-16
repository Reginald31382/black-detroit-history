import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import HistoryEvent from "@/models/HistoryEvent";

const records = [
  {
    month: 9,
    day: 8,
    year: 1925,
  },
  {
    month: 9,
    day: 9,
    year: 1935,
  },
  {
    month: 2,
    day: 8,
    year: 1936,
  },
  {
    month: 11,
    day: 5,
    year: 1939,
  },
];

export async function POST() {
  try {
    await connectDB();

    let approved = 0;
    let notFound = 0;

    const results = [];

    for (const record of records) {
      const event = await HistoryEvent.findOne({
        month: record.month,
        day: record.day,
        year: record.year,
        "verification.status": "needs_review",
      });

      if (!event) {
        notFound++;

        results.push({
          date: `${record.month}/${record.day}/${record.year}`,
          status: "not_found",
        });

        continue;
      }

      event.verification.status = "approved";

      event.verification.notes = "Approved after historical source review.";

      await event.save();

      approved++;

      results.push({
        date: `${record.month}/${record.day}/${record.year}`,
        title: event.title,
        status: "approved",
      });
    }

    return NextResponse.json({
      success: true,
      batch: 2,
      approved,
      notFound,
      results,
      message: `${approved} Batch 2 records approved.`,
    });
  } catch (error) {
    console.error("VERIFY BATCH FAILED:", error);

    return NextResponse.json(
      {
        error: "Failed to verify batch",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
