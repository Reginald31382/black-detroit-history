import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import HistoryEvent from "@/models/HistoryEvent";

const API_VERSION = process.env.INSTAGRAM_API_VERSION || "v26.0";

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;

const GRAPH_URL = `https://graph.instagram.com/${API_VERSION}`;

async function instagramRequest(path, body = null, method = "GET") {
  const response = await fetch(`${GRAPH_URL}${path}`, {
    method,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      ...(body
        ? {
            "Content-Type": "application/json",
          }
        : {}),
    },
    ...(body
      ? {
          body: JSON.stringify(body),
        }
      : {}),
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
  let stage = "starting";

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

    if (!body.eventId) {
      return NextResponse.json(
        {
          error: "eventId is required",
        },
        { status: 400 },
      );
    }

    const event = await HistoryEvent.findById(body.eventId);

    if (!event) {
      return NextResponse.json(
        {
          error: "History event not found",
        },
        { status: 404 },
      );
    }

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

    const image = event.images?.find((item) => item?.url && item.url.trim());

    if (!image) {
      return NextResponse.json(
        {
          error: "No image URL exists in MongoDB for this record",
        },
        { status: 400 },
      );
    }

    const caption = event.instagram?.caption?.trim();

    if (!caption) {
      return NextResponse.json(
        {
          error: "No Instagram caption exists in MongoDB",
        },
        { status: 400 },
      );
    }

    /*
     * STEP 1
     * Create Instagram media container.
     */

    stage = "creating_media_container";

    const container = await instagramRequest(
      `/${INSTAGRAM_ACCOUNT_ID}/media`,
      {
        image_url: image.url,
        caption,
      },
      "POST",
    );

    const containerId = container?.id;

    if (!containerId) {
      throw new Error("Instagram did not return a media container ID");
    }

    /*
     * STEP 2
     * Poll container status.
     */

    stage = "checking_media_status";

    let statusData = null;

    for (let attempt = 0; attempt < 15; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      statusData = await instagramRequest(
        `/${containerId}?fields=status_code,status`,
      );

      if (statusData.status_code === "FINISHED") {
        break;
      }

      if (
        statusData.status_code === "ERROR" ||
        statusData.status_code === "EXPIRED"
      ) {
        const error = new Error(
          statusData.status ||
            `Instagram media container failed: ${statusData.status_code}`,
        );

        error.status = 400;
        error.apiResponse = statusData;

        throw error;
      }
    }

    if (statusData?.status_code !== "FINISHED") {
      const error = new Error(
        `Instagram media container did not finish. Status: ${
          statusData?.status_code || "unknown"
        }`,
      );

      error.status = 400;
      error.apiResponse = statusData;

      throw error;
    }

    /*
     * STEP 3
     * Publish the container.
     */

    stage = "publishing_media";

    const published = await instagramRequest(
      `/${INSTAGRAM_ACCOUNT_ID}/media_publish`,
      {
        creation_id: containerId,
      },
      "POST",
    );

    if (!published?.id) {
      throw new Error("Instagram did not return a published media ID");
    }

    /*
     * STEP 4
     * Mark BDH record as used.
     */

    stage = "saving_published_record";

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
      message: "Published successfully to Instagram",
      instagramPostId: published.id,
      containerId,
    });
  } catch (error) {
    console.error("INSTAGRAM PUBLISH FAILED", {
      stage,
      message: error.message,
      status: error.status,
      apiResponse: error.apiResponse,
    });

    return NextResponse.json(
      {
        error: error.message || "Instagram publishing failed",
        stage,
        instagramResponse: error.apiResponse || null,
      },
      {
        status: error.status || 502,
      },
    );
  }
}
