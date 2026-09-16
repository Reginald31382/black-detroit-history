import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import HistoryEvent from "@/models/HistoryEvent";

const records = [
  {
    month: 6,
    day: 14,
    year: 1833,
    title: "Detroit's first recorded race riot begins",
  },
  {
    month: 4,
    day: 26,
    year: 1837,
    title: "Detroit Anti-Slavery Society is founded",
  },
  {
    month: 12,
    day: 20,
    year: 1842,
    title: "Colored Vigilant Committee of Detroit is formed",
  },
  {
    month: 3,
    day: 12,
    year: 1859,
    title: "John Brown and Frederick Douglass meet in Detroit",
  },
  {
    month: 5,
    day: 5,
    year: 1903,
    title: "Booker T. Washington speaks in Detroit",
  },
];

export async function POST() {
  try {
    await connectDB();

    let approved = 0;
    let notFound = 0;

    for (const record of records) {
      const event = await HistoryEvent.findOne({
        month: record.month,
        day: record.day,
        year: record.year,
        title: record.title,
      });

      if (!event) {
        notFound++;
        continue;
      }

      event.verification.status = "approved";

      if (record.year === 1833) {
        event.description =
          "Detroit's Black community helped Thornton and Lucie Blackburn, a fugitive couple, escape toward Canada. The resulting confrontation and mob violence on June 14–15 became Detroit's first recorded race riot.";

        event.verification.notes =
          "Date and event verified for June 14–15, 1833. Approved after historical source review.";
      } else {
        event.verification.notes = "Approved after historical source review.";
      }

      await event.save();
      approved++;
    }

    return NextResponse.json({
      success: true,
      approved,
      notFound,
      message: `${approved} historical records approved.`,
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
