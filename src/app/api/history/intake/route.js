import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import HistoryEvent from "@/models/HistoryEvent";

const CATEGORIES = [
  "Civil Rights",
  "Music",
  "Business",
  "Education",
  "Politics",
  "Sports",
  "Arts & Culture",
  "Labor",
  "Community",
  "Military",
  "Media",
  "Other",
];

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    if (!body.month || !body.day || !body.year) {
      return NextResponse.json(
        {
          error: "month, day, and year are required",
        },
        { status: 400 },
      );
    }

    if (!body.title?.trim()) {
      return NextResponse.json(
        {
          error: "title is required",
        },
        { status: 400 },
      );
    }

    if (body.category && !CATEGORIES.includes(body.category)) {
      return NextResponse.json(
        {
          error: "Invalid category",
        },
        { status: 400 },
      );
    }

    /*
     * Prevent accidental duplicate intake records.
     */
    const existing = await HistoryEvent.findOne({
      month: Number(body.month),
      day: Number(body.day),
      year: Number(body.year),
      title: body.title.trim(),
    }).lean();

    if (existing) {
      return NextResponse.json(
        {
          error: "This history record already exists",
          existingId: existing._id,
        },
        { status: 409 },
      );
    }

    /*
     * Intake records begin as research leads.
     *
     * They are NOT automatically approved.
     * They are NOT placed in the Instagram queue.
     */
    const event = await HistoryEvent.create({
      month: Number(body.month),
      day: Number(body.day),
      year: Number(body.year),

      title: body.title.trim(),

      description:
        body.description?.trim() ||
        "Historical lead requiring further research.",

      significance:
        body.significance?.trim() || "Significance requires further research.",

      category: body.category || "Other",

      people: Array.isArray(body.people) ? body.people : [],

      organizations: Array.isArray(body.organizations)
        ? body.organizations
        : [],

      location: {
        address: body.location?.address || "",
        neighborhood: body.location?.neighborhood || "",
      },

      sources: Array.isArray(body.sources) ? body.sources : [],

      images: Array.isArray(body.images) ? body.images : [],

      verification: {
        status: "needs_review",
        notes:
          body.verification?.notes ||
          "New historical lead. Verify date, details, Detroit connection, and sources before approval.",
      },

      archive: {
        status: "active",
        notes: "Entered through research intake.",
      },

      instagram: {
        status: "not_ready",
        caption: "",
        scheduledFor: null,
        publishedAt: null,
        postId: "",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Historical lead added to the active archive for review.",
        event,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to add historical lead",
        details: error.message,
      },
      { status: 400 },
    );
  }
}
