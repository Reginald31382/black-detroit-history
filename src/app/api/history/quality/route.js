import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import HistoryEvent from "@/models/HistoryEvent";

export async function GET() {
  try {
    await connectDB();

    const events = await HistoryEvent.find({})
      .sort({ month: 1, day: 1, year: 1 })
      .lean();

    const duplicateMap = new Map();

    for (const event of events) {
      const key = `${event.month}-${event.day}-${event.year}`;

      if (!duplicateMap.has(key)) {
        duplicateMap.set(key, []);
      }

      duplicateMap.get(key).push(event);
    }

    const duplicateDates = [...duplicateMap.entries()]
      .filter(([, records]) => records.length > 1)
      .map(([date, records]) => ({
        date,
        count: records.length,
        records: records.map((event) => ({
          id: event._id,
          title: event.title,
          year: event.year,
          verification: event.verification?.status || "draft",
          archive: event.archive?.status || "active",
        })),
      }));

    const duplicateTitleMap = new Map();

    for (const event of events) {
      const key = event.title?.trim().toLowerCase();

      if (!key) continue;

      if (!duplicateTitleMap.has(key)) {
        duplicateTitleMap.set(key, []);
      }

      duplicateTitleMap.get(key).push(event);
    }

    const duplicateTitles = [...duplicateTitleMap.entries()]
      .filter(([, records]) => records.length > 1)
      .map(([title, records]) => ({
        title,
        count: records.length,
        records: records.map((event) => ({
          id: event._id,
          date: `${event.month}/${event.day}/${event.year}`,
          verification: event.verification?.status || "draft",
          archive: event.archive?.status || "active",
        })),
      }));

    const missingSources = events
      .filter(
        (event) => !Array.isArray(event.sources) || event.sources.length === 0,
      )
      .map(formatBasicRecord);

    const missingSignificance = events
      .filter((event) => !event.significance || !event.significance.trim())
      .map(formatBasicRecord);

    const missingDescription = events
      .filter((event) => !event.description || !event.description.trim())
      .map(formatBasicRecord);

    const missingCategory = events
      .filter((event) => !event.category || !event.category.trim())
      .map(formatBasicRecord);

    const needsReview = events
      .filter((event) => event.verification?.status === "needs_review")
      .map(formatBasicRecord);

    const rejected = events
      .filter((event) => event.verification?.status === "rejected")
      .map(formatBasicRecord);

    const incompleteApproved = events
      .filter(
        (event) =>
          event.verification?.status === "approved" &&
          (!event.title?.trim() ||
            !event.description?.trim() ||
            !event.significance?.trim() ||
            !event.category?.trim() ||
            !event.sources?.length),
      )
      .map(formatBasicRecord);

    const summary = {
      total: events.length,
      duplicateDates: duplicateDates.length,
      duplicateTitles: duplicateTitles.length,
      missingSources: missingSources.length,
      missingSignificance: missingSignificance.length,
      missingDescription: missingDescription.length,
      missingCategory: missingCategory.length,
      needsReview: needsReview.length,
      rejected: rejected.length,
      incompleteApproved: incompleteApproved.length,
    };

    return NextResponse.json({
      success: true,
      summary,
      duplicateDates,
      duplicateTitles,
      missingSources,
      missingSignificance,
      missingDescription,
      missingCategory,
      needsReview,
      rejected,
      incompleteApproved,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to run archive quality check",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

function formatBasicRecord(event) {
  return {
    id: event._id,
    month: event.month,
    day: event.day,
    year: event.year,
    date: `${event.month}/${event.day}/${event.year}`,
    title: event.title,
    verification: event.verification?.status || "draft",
    archive: event.archive?.status || "active",
  };
}
