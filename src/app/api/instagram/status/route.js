import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import HistoryEvent from "@/models/HistoryEvent";

const API_VERSION = process.env.INSTAGRAM_API_VERSION || "v26.0";

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;

const GRAPH_URL = `https://graph.instagram.com/${API_VERSION}`;

async function instagramRequest(path, options = {}) {
  const url = `${GRAPH_URL}${path}`;

  console.log("INSTAGRAM API REQUEST:", {
    method: options.method || "GET",
    url: url.replace(/access_token=[^&]+/, "access_token=REDACTED"),
  });

  const response = await fetch(url, {
    ...options,
    cache: "no-store",
  });

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = {
      rawResponse: text,
    };
  }

  console.log("INSTAGRAM API RESPONSE:", {
    status: response.status,
    data,
  });

  if (!response.ok) {
    const error = new Error(
      data?.error?.message ||
        data?.error?.error_user_msg ||
        data?.rawResponse ||
        `Instagram API returned HTTP ${response.status}`,
    );

    error.status = response.status;
    error.apiResponse = data;

    throw error;
  }

  return data;
}

export async function POST(request) {
  try {
    await connectDB();

    if (!ACCESS_TOKEN) {
      return NextResponse.json(
        {
          error: "INSTAGRAM_ACCESS_TOKEN is not configured",
        },
        { status: 500 },
      );
    }

    if (!INSTAGRAM_ACCOUNT_ID) {
      return NextResponse.json(
        {
          error: "INSTAGRAM_ACCOUNT_ID is not configured",
        },
        { status: 500 },
      );
    }

    const body = await request.json();

    const eventId = body.eventId;

    if (!eventId) {
      return NextResponse.json(
        {
          error: "eventId is required",
        },
        { status: 400 },
      );
    }

    const event = await HistoryEvent.findById(eventId);

    if (!event) {
      return NextResponse.json(
        {
          error: "History event not found",
        },
        { status: 404 },
      );
    }

    // Safety: only approved Instagram-queue records
    // can be published.
    if (event.verification?.status !== "approved") {
      return NextResponse.json(
        {
          error: "Only approved records can be published",
        },
        { status: 400 },
      );
    }

    if (event.archive?.status !== "instagram") {
      return NextResponse.json(
        {
          error: "Record must be in the Instagram queue before publishing",
        },
        { status: 400 },
      );
    }

    if (!["queued", "scheduled", "failed"].includes(event.instagram?.status)) {
      return NextResponse.json(
        {
          error: "Record is not ready for publishing",
        },
        { status: 400 },
      );
    }

    const image = event.images?.find((item) => item?.url?.trim());

    if (!image) {
      return NextResponse.json(
        {
          error: "This record does not have an image URL",
        },
        { status: 400 },
      );
    }

    const caption =
      event.instagram?.caption?.trim() ||
      `${event.title}\n\n${event.description}`;

    // Mark as queued before sending to Instagram.
    event.instagram.status = "queued";
    await event.save();

    /*
     * STEP 1
     * Create Instagram media container.
     */
    const containerParams = new URLSearchParams({
      image_url: image.url,
      caption,
      access_token: ACCESS_TOKEN,
    });

    const container = await instagramRequest(
      `/${INSTAGRAM_ACCOUNT_ID}/media?${containerParams.toString()}`,
      {
        method: "POST",
      },
    );

    const containerId = container.id;

    if (!containerId) {
      throw new Error("Instagram did not return a container ID");
    }

    /*
     * STEP 2
     * Wait for Instagram to finish processing
     * the media container.
     */
    let status = null;

    for (let attempt = 0; attempt < 12; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const statusParams = new URLSearchParams({
        fields: "status_code,status",
        access_token: ACCESS_TOKEN,
      });

      status = await instagramRequest(
        `/${containerId}?${statusParams.toString()}`,
      );

      if (status.status_code === "FINISHED") {
        break;
      }

      if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
        throw new Error(
          status.status || `Instagram container failed: ${status.status_code}`,
        );
      }
    }

    if (status?.status_code !== "FINISHED") {
      throw new Error(
        "Instagram media is still processing. Try publishing again shortly.",
      );
    }

    /*
     * STEP 3
     * Publish the container.
     */
    const publishParams = new URLSearchParams({
      creation_id: containerId,
      access_token: ACCESS_TOKEN,
    });

    const published = await instagramRequest(
      `/${INSTAGRAM_ACCOUNT_ID}/media_publish?${publishParams.toString()}`,
      {
        method: "POST",
      },
    );

    if (!published.id) {
      throw new Error("Instagram did not return a published media ID");
    }

    /*
     * STEP 4
     * Move the BDH record to USED.
     */
    const now = new Date();

    event.archive.status = "used";
    event.archive.usedAt = now;
    event.archive.usedPostId = published.id;

    event.instagram.status = "published";
    event.instagram.publishedAt = now;
    event.instagram.postId = published.id;

    await event.save();

    return NextResponse.json({
      success: true,
      message: "History event published to Instagram",
      eventId: event._id,
      containerId,
      instagramPostId: published.id,
    });
  } catch (error) {
    console.error("INSTAGRAM PUBLISH FAILED:", {
      message: error.message,
      status: error.status,
      apiResponse: error.apiResponse,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        error: error.message || "Failed to publish to Instagram",
        details: error.apiResponse || null,
      },
      {
        status: error.status || 500,
      },
    );
  }
}
