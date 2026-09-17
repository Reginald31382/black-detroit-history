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

async function waitForContainer(containerId) {
  let statusData = null;

  for (let attempt = 0; attempt < 15; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    statusData = await instagramRequest(
      `/${containerId}?fields=status_code,status`,
    );

    if (statusData.status_code === "FINISHED") {
      return statusData;
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

  const error = new Error(
    `Instagram media container did not finish. Status: ${
      statusData?.status_code || "unknown"
    }`,
  );

  error.status = 400;
  error.apiResponse = statusData;

  throw error;
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

    const images = (event.images || [])
      .filter((item) => item?.url && item.url.trim())
      .slice(0, 10);

    if (images.length === 0) {
      return NextResponse.json(
        {
          error: "No image URLs exist in MongoDB for this record",
        },
        { status: 400 },
      );
    }

    if (images.length > 10) {
      return NextResponse.json(
        {
          error: "Instagram posts can contain a maximum of 10 images",
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
     * ONE IMAGE
     *
     * Standard Instagram image post.
     */

    if (images.length === 1) {
      stage = "creating_single_image_container";

      const container = await instagramRequest(
        `/${INSTAGRAM_ACCOUNT_ID}/media`,
        {
          image_url: images[0].url,
          caption,
        },
        "POST",
      );

      const containerId = container?.id;

      if (!containerId) {
        throw new Error("Instagram did not return a media container ID");
      }

      stage = "checking_single_image_status";

      await waitForContainer(containerId);

      stage = "publishing_single_image";

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
        imageCount: 1,
        postType: "single",
      });
    }

    /*
     * MULTIPLE IMAGES
     *
     * Instagram carousel workflow:
     *
     * 1. Create an individual IMAGE container
     *    for every image.
     *
     * 2. Wait for every child container
     *    to finish processing.
     *
     * 3. Create the CAROUSEL container
     *    using the child container IDs.
     *
     * 4. Wait for the carousel container.
     *
     * 5. Publish the carousel.
     */

    stage = "creating_carousel_image_containers";

    const childContainerIds = [];

    for (let index = 0; index < images.length; index++) {
      const image = images[index];

      const child = await instagramRequest(
        `/${INSTAGRAM_ACCOUNT_ID}/media`,
        {
          image_url: image.url,
          is_carousel_item: true,
        },
        "POST",
      );

      if (!child?.id) {
        throw new Error(
          `Instagram did not return a container ID for image ${index + 1}`,
        );
      }

      childContainerIds.push(child.id);
    }

    /*
     * Wait for each carousel child.
     */

    stage = "checking_carousel_image_status";

    for (let index = 0; index < childContainerIds.length; index++) {
      await waitForContainer(childContainerIds[index]);
    }

    /*
     * Create the parent carousel container.
     */

    stage = "creating_carousel_container";

    const carousel = await instagramRequest(
      `/${INSTAGRAM_ACCOUNT_ID}/media`,
      {
        media_type: "CAROUSEL",
        children: childContainerIds,
        caption,
      },
      "POST",
    );

    const carouselContainerId = carousel?.id;

    if (!carouselContainerId) {
      throw new Error("Instagram did not return a carousel container ID");
    }

    /*
     * Wait for carousel processing.
     */

    stage = "checking_carousel_status";

    await waitForContainer(carouselContainerId);

    /*
     * Publish carousel.
     */

    stage = "publishing_carousel";

    const published = await instagramRequest(
      `/${INSTAGRAM_ACCOUNT_ID}/media_publish`,
      {
        creation_id: carouselContainerId,
      },
      "POST",
    );

    if (!published?.id) {
      throw new Error("Instagram did not return a published carousel media ID");
    }

    /*
     * Mark BDH record as USED.
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
      message: "Carousel published successfully to Instagram",
      instagramPostId: published.id,
      containerId: carouselContainerId,
      childContainerIds,
      imageCount: images.length,
      postType: "carousel",
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
