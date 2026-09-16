import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import HistoryEvent from "@/models/HistoryEvent";

const VERIFICATION_STATUSES = ["draft", "needs_review", "approved", "rejected"];

function normalizeRecord(record) {
  return {
    month: Number(record.month),
    day: Number(record.day),
    year: Number(record.year),

    title: String(record.title || "").trim(),

    description:
      record.description || "Historical lead requiring further research.",

    significance:
      record.significance || "Significance requires further research.",

    category: record.category || "Other",

    people: Array.isArray(record.people) ? record.people : [],

    organizations: Array.isArray(record.organizations)
      ? record.organizations
      : [],

    location: {
      address: record.location?.address || "",
      neighborhood: record.location?.neighborhood || "",
    },

    sources: Array.isArray(record.sources) ? record.sources : [],

    images: Array.isArray(record.images) ? record.images : [],

    verification: {
      status: VERIFICATION_STATUSES.includes(record.verification?.status)
        ? record.verification.status
        : "needs_review",

      notes:
        record.verification?.notes || "Historical lead requiring verification.",
    },

    archive: {
      status: "active",
      notes: record.archive?.notes || "Entered through research intake.",
    },

    instagram: {
      status: "not_ready",
      caption: "",
      scheduledFor: null,
      publishedAt: null,
      postId: "",
    },
  };
}

export async function POST() {
  try {
    await connectDB();

    const recoveredModule =
      await import("@/data/black_detroit_history_recovered_needs_review_batch.json");

    const recoveredBatch = recoveredModule.default || recoveredModule;

    const uniqueRecords = new Map();

    for (const rawRecord of recoveredBatch) {
      const record = normalizeRecord(rawRecord);

      const key = [
        record.month,
        record.day,
        record.year,
        record.title.toLowerCase(),
      ].join("|");

      if (!uniqueRecords.has(key)) {
        uniqueRecords.set(key, record);
      }
    }

    let created = 0;
    let skipped = 0;

    for (const record of uniqueRecords.values()) {
      const existing = await HistoryEvent.findOne({
        month: record.month,
        day: record.day,
        year: record.year,
        title: record.title,
      }).lean();

      if (existing) {
        skipped++;
        continue;
      }

      await HistoryEvent.create(record);
      created++;
    }

    const total = await HistoryEvent.countDocuments();

    const needsReview = await HistoryEvent.countDocuments({
      "verification.status": "needs_review",
    });

    const approved = await HistoryEvent.countDocuments({
      "verification.status": "approved",
    });

    const active = await HistoryEvent.countDocuments({
      "archive.status": "active",
    });

    const instagram = await HistoryEvent.countDocuments({
      "archive.status": "instagram",
    });

    const used = await HistoryEvent.countDocuments({
      "archive.status": "used",
    });

    return NextResponse.json({
      success: true,
      message: "Recovered research batch seeded safely.",
      sourceRecords: recoveredBatch.length,
      uniqueSeedRecords: uniqueRecords.size,
      created,
      skipped,
      databaseTotal: total,
      lifecycleTotals: {
        needsReview,
        approved,
        active,
        instagram,
        used,
      },
    });
  } catch (error) {
    console.error("HISTORY SEED FAILED:", error);

    return NextResponse.json(
      {
        error: "Failed to seed history",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
