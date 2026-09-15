import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import HistoryEvent from "@/models/HistoryEvent";

const VERIFICATION_STATUSES = ["draft", "needs_review", "approved", "rejected"];

const ARCHIVE_STATUSES = ["active", "instagram", "used"];

const INSTAGRAM_STATUSES = [
  "not_ready",
  "queued",
  "scheduled",
  "published",
  "failed",
];

export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    const existing = await HistoryEvent.findById(id);

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    /*
     * Lifecycle protection:
     *
     * verification.status controls whether the
     * historical record is ready for publication.
     *
     * archive.status controls where the record lives.
     *
     * instagram.status controls publication state.
     */

    if (
      body.verification?.status &&
      !VERIFICATION_STATUSES.includes(body.verification.status)
    ) {
      return NextResponse.json(
        { error: "Invalid verification status" },
        { status: 400 },
      );
    }

    if (
      body.archive?.status &&
      !ARCHIVE_STATUSES.includes(body.archive.status)
    ) {
      return NextResponse.json(
        { error: "Invalid archive status" },
        { status: 400 },
      );
    }

    if (
      body.instagram?.status &&
      !INSTAGRAM_STATUSES.includes(body.instagram.status)
    ) {
      return NextResponse.json(
        { error: "Invalid Instagram status" },
        { status: 400 },
      );
    }

    const nextVerification =
      body.verification?.status || existing.verification?.status || "draft";

    const nextArchive =
      body.archive?.status || existing.archive?.status || "active";

    const nextInstagram =
      body.instagram?.status || existing.instagram?.status || "not_ready";

    /*
     * Approved is required before entering Instagram.
     */
    if (nextArchive === "instagram" && nextVerification !== "approved") {
      return NextResponse.json(
        {
          error: "Only approved records can enter the Instagram queue",
        },
        { status: 400 },
      );
    }

    /*
     * Instagram records must have an Instagram status
     * that is actually usable by the queue.
     */
    if (
      nextArchive === "instagram" &&
      !["queued", "scheduled", "failed"].includes(nextInstagram)
    ) {
      return NextResponse.json(
        {
          error: "Instagram queue records must be queued, scheduled, or failed",
        },
        { status: 400 },
      );
    }

    /*
     * Used records represent published history.
     */
    if (nextArchive === "used" && nextInstagram !== "published") {
      return NextResponse.json(
        {
          error: "Used records must have Instagram status published",
        },
        { status: 400 },
      );
    }

    /*
     * Keep active archive records out of the Instagram
     * publication lifecycle.
     */
    if (nextArchive === "active" && nextInstagram !== "not_ready") {
      return NextResponse.json(
        {
          error: "Active archive records must have Instagram status not_ready",
        },
        { status: 400 },
      );
    }

    /*
     * Prevent a rejected record from being published.
     */
    if (
      nextVerification === "rejected" &&
      ["instagram", "used"].includes(nextArchive)
    ) {
      return NextResponse.json(
        {
          error: "Rejected records cannot be published",
        },
        { status: 400 },
      );
    }

    /*
     * Prevent direct publication of a record that has
     * never been approved.
     */
    if (nextArchive === "used" && nextVerification !== "approved") {
      return NextResponse.json(
        {
          error: "Only approved records can be marked used",
        },
        { status: 400 },
      );
    }

    const update = {
      ...body,
      verification: {
        ...(existing.verification?.toObject?.() || existing.verification || {}),
        ...(body.verification || {}),
      },
      archive: {
        ...(existing.archive?.toObject?.() || existing.archive || {}),
        ...(body.archive || {}),
      },
      instagram: {
        ...(existing.instagram?.toObject?.() || existing.instagram || {}),
        ...(body.instagram || {}),
      },
    };

    /*
     * Lifecycle timestamps.
     */
    if (
      nextArchive === "instagram" &&
      existing.archive?.status !== "instagram"
    ) {
      update.archive.approvedForInstagramAt = new Date();
    }

    if (nextArchive === "used" && existing.archive?.status !== "used") {
      update.archive.usedAt = new Date();
    }

    if (nextInstagram === "published" && !update.instagram.publishedAt) {
      update.instagram.publishedAt = new Date();
    }

    const event = await HistoryEvent.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    return NextResponse.json(event);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to update event",
        details: error.message,
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const event = await HistoryEvent.findById(id);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    /*
     * Published/used history should never be deleted
     * through the normal admin workflow.
     */
    if (event.archive?.status === "used") {
      return NextResponse.json(
        {
          error: "Used history records cannot be deleted",
        },
        { status: 400 },
      );
    }

    await HistoryEvent.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to delete event",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
