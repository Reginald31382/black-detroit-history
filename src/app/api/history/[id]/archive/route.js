import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import HistoryEvent from "@/models/HistoryEvent";

const ARCHIVE_STATUSES = ["active", "instagram", "used"];

export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!ARCHIVE_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid archive status" },
        { status: 400 },
      );
    }

    const event = await HistoryEvent.findById(id);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const verification = event.verification?.status || "draft";

    /*
     * ACTIVE
     *
     * Record is back in the research/archive pool.
     */
    if (status === "active") {
      event.archive.status = "active";
      event.instagram.status = "not_ready";

      await event.save();

      return NextResponse.json(event.toObject());
    }

    /*
     * INSTAGRAM QUEUE
     *
     * Only approved historical records can enter
     * the Instagram workflow.
     */
    if (status === "instagram") {
      if (verification !== "approved") {
        return NextResponse.json(
          {
            error: "Only approved records can enter the Instagram queue",
          },
          { status: 400 },
        );
      }

      event.archive.status = "instagram";

      event.archive.approvedForInstagramAt =
        event.archive.approvedForInstagramAt || new Date();

      /*
       * Don't destroy an existing scheduled/failed state
       * when moving an already queued record.
       */
      if (!["scheduled", "failed"].includes(event.instagram.status)) {
        event.instagram.status = "queued";
      }

      await event.save();

      return NextResponse.json(event.toObject());
    }

    /*
     * USED
     *
     * Used means the Instagram post has actually been
     * published. It is never deleted from MongoDB.
     */
    if (status === "used") {
      if (verification !== "approved") {
        return NextResponse.json(
          {
            error: "Only approved records can be marked used",
          },
          { status: 400 },
        );
      }

      event.archive.status = "used";

      event.archive.usedAt = event.archive.usedAt || new Date();

      event.instagram.status = "published";

      event.instagram.publishedAt = body.publishedAt
        ? new Date(body.publishedAt)
        : event.instagram.publishedAt || new Date();

      if (body.postId) {
        event.archive.usedPostId = body.postId;
        event.instagram.postId = body.postId;
      }

      await event.save();

      return NextResponse.json(event.toObject());
    }

    return NextResponse.json(
      { error: "Unsupported archive status" },
      { status: 400 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to update archive status",
        details: error.message,
      },
      { status: 400 },
    );
  }
}
