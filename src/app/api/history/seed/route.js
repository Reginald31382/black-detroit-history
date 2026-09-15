import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import HistoryEvent from "@/models/HistoryEvent";

const VALID_VERIFICATION = ["draft", "needs_review", "approved", "rejected"];

const VALID_ARCHIVE = ["active", "instagram", "used"];

const VALID_INSTAGRAM = [
  "not_ready",
  "queued",
  "scheduled",
  "published",
  "failed",
];

function cleanInstagram(item) {
  const existing = item.instagram || {};

  return {
    status: VALID_INSTAGRAM.includes(existing.status)
      ? existing.status
      : "not_ready",

    caption: existing.caption || "",

    scheduledFor: existing.scheduledFor || null,

    publishedAt: existing.publishedAt || null,

    postId: existing.postId || "",
  };
}

function cleanVerification(item) {
  const status = item.verification?.status;

  return {
    status: VALID_VERIFICATION.includes(status) ? status : "draft",

    notes: item.verification?.notes || "",
  };
}

function cleanArchive(item) {
  const status = item.archive?.status;

  return {
    status: VALID_ARCHIVE.includes(status) ? status : "active",

    approvedForInstagramAt: item.archive?.approvedForInstagramAt || null,

    usedAt: item.archive?.usedAt || null,

    usedPostId: item.archive?.usedPostId || "",

    notes: item.archive?.notes || "",
  };
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        {
          error: "Seed payload must be an array of history records",
        },
        { status: 400 },
      );
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of body) {
      /*
       * Basic identity check.
       */
      if (!item.month || !item.day || !item.year || !item.title) {
        skipped++;
        continue;
      }

      /*
       * Use the same date + title identity that the
       * archive uses to prevent duplicate seed records.
       */
      const identity = {
        month: Number(item.month),
        day: Number(item.day),
        year: Number(item.year),
        title: item.title.trim(),
      };

      const existing = await HistoryEvent.findOne(identity);

      /*
       * IMPORTANT:
       *
       * Existing lifecycle data is preserved.
       *
       * Reseeding should update historical content,
       * sources, people, organizations, etc.
       *
       * It must NOT reset:
       *
       * - used records
       * - Instagram captions
       * - publication dates
       * - post IDs
       * - images
       * - queue state
       */
      if (existing) {
        const protectedData = {
          verification:
            existing.verification?.toObject?.() || existing.verification,

          archive: existing.archive?.toObject?.() || existing.archive,

          instagram: existing.instagram?.toObject?.() || existing.instagram,

          images: existing.images || [],
        };

        const update = {
          ...item,

          month: identity.month,
          day: identity.day,
          year: identity.year,
          title: identity.title,

          /*
           * Preserve lifecycle data.
           */
          verification: protectedData.verification,
          archive: protectedData.archive,
          instagram: protectedData.instagram,
          images: protectedData.images,
        };

        await HistoryEvent.findByIdAndUpdate(existing._id, update, {
          new: true,
          runValidators: true,
          overwrite: false,
        });

        updated++;
        continue;
      }

      /*
       * New records get clean initial lifecycle state.
       */
      const verification = cleanVerification(item);

      const archive = cleanArchive(item);
      const instagram = cleanInstagram(item);

      /*
       * Never allow a bad seed combination.
       */
      let finalArchive = archive;
      let finalInstagram = instagram;

      if (
        archive.status === "instagram" &&
        verification.status !== "approved"
      ) {
        finalArchive = {
          ...archive,
          status: "active",
        };

        finalInstagram = {
          ...instagram,
          status: "not_ready",
        };
      }

      if (archive.status === "used" && verification.status !== "approved") {
        finalArchive = {
          ...archive,
          status: "active",
        };

        finalInstagram = {
          ...instagram,
          status: "not_ready",
        };
      }

      if (
        finalArchive.status === "active" &&
        finalInstagram.status !== "not_ready"
      ) {
        finalInstagram = {
          ...finalInstagram,
          status: "not_ready",
        };
      }

      await HistoryEvent.create({
        ...item,

        month: identity.month,
        day: identity.day,
        year: identity.year,
        title: identity.title,

        verification,
        archive: finalArchive,
        instagram: finalInstagram,

        images: item.images || [],
      });

      created++;
    }

    const total = await HistoryEvent.countDocuments();

    return NextResponse.json({
      success: true,
      message: "Seed complete",
      created,
      updated,
      skipped,
      total,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Seed failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
