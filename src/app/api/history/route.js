import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import HistoryEvent from "@/models/HistoryEvent";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const month = searchParams.get("month");
    const day = searchParams.get("day");
    const year = searchParams.get("year");
    const verification = searchParams.get("verification");
    const archive = searchParams.get("archive") || "active";

    const filter = {};

    if (month) {
      filter.month = Number(month);
    }

    if (day) {
      filter.day = Number(day);
    }

    if (year) {
      filter.year = Number(year);
    }

    if (verification) {
      filter["verification.status"] = verification;
    }

    if (archive !== "all") {
      filter["archive.status"] = archive;
    }

    const events = await HistoryEvent.find(filter)
      .sort({
        month: 1,
        day: 1,
        year: 1,
      })
      .lean();

    return NextResponse.json({
      count: events.length,
      filters: {
        month: month ? Number(month) : null,
        day: day ? Number(day) : null,
        year: year ? Number(year) : null,
        verification,
        archive,
      },
      events,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to load history",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    const event = await HistoryEvent.create({
      ...body,

      archive: {
        status: "active",
        ...(body.archive || {}),
      },
    });

    return NextResponse.json(event, {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to create history event",
        details: error.message,
      },
      {
        status: 400,
      },
    );
  }
}
