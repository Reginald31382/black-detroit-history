"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import AdminNav from "@/components/AdminNav";

const months = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function InstagramPage() {
  const [events, setEvents] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [caption, setCaption] = useState("");
  const [images, setImages] = useState([]);

  const [imageUrl, setImageUrl] = useState("");
  const [imageCredit, setImageCredit] = useState("");
  const [imageRights, setImageRights] = useState("");

  const [scheduledFor, setScheduledFor] = useState("");

  async function loadQueue() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/history?archive=instagram");

      if (!response.ok) {
        throw new Error("Failed to load Instagram queue");
      }

      const data = await response.json();
      const queue = data.events || [];

      setEvents(queue);

      if (!selectedId && queue.length > 0) {
        selectEvent(queue[0]);
      }
    } catch (err) {
      setError(err.message || "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  function selectEvent(event) {
    setSelectedId(event._id);

    setCaption(event.instagram?.caption || buildCaption(event));

    setImages(event.images || []);

    setScheduledFor(
      event.instagram?.scheduledFor
        ? toLocalDateTime(event.instagram.scheduledFor)
        : "",
    );
  }

  const selectedEvent = useMemo(
    () => events.find((event) => event._id === selectedId) || null,
    [events, selectedId],
  );

  async function savePost() {
    if (!selectedEvent) return;

    try {
      setSaving(true);
      setError("");

      const payload = {
        images: images.map((image) => ({
          url: image.url,
          credit: image.credit || "",
          rights: image.rights || "",
        })),
        instagram: {
          status:
            selectedEvent.instagram?.status === "published"
              ? "published"
              : scheduledFor
                ? "scheduled"
                : "queued",
          caption: caption.trim(),
          scheduledFor: scheduledFor
            ? new Date(scheduledFor).toISOString()
            : null,
        },
      };

      console.log("SAVING INSTAGRAM POST:", payload);

      const response = await fetch(`/api/history/${selectedEvent._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      console.log("SAVE RESPONSE:", {
        status: response.status,
        data,
      });

      if (!response.ok) {
        throw new Error(
          data.error || data.details || "Failed to save Instagram post",
        );
      }

      setEvents((current) =>
        current.map((event) => (event._id === data._id ? data : event)),
      );

      selectEvent(data);

      alert(`Saved to MongoDB.\n\nImage count: ${data.images?.length || 0}`);
    } catch (err) {
      console.error("SAVE FAILED:", err);

      setError(err.message || "Failed to save Instagram post");
    } finally {
      setSaving(false);
    }
  }

  async function publishToInstagram() {
    if (!selectedEvent) return;

    const confirmed = window.confirm(
      "Publish this approved post to the Detroit Black History Instagram account?",
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/instagram/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: selectedEvent._id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Instagram publishing failed");
      }

      alert("Published successfully to Instagram.");

      await loadQueue();

      setSelectedId("");
      setCaption("");
      setImages([]);
      setScheduledFor("");
    } catch (err) {
      setError(err.message || "Instagram publishing failed");
    } finally {
      setSaving(false);
    }
  }

  async function markPublished() {
    if (!selectedEvent) return;

    const postId = window.prompt(
      "Enter the Instagram post ID or URL (optional):",
    );

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `/api/history/${selectedEvent._id}/archive`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "used",
            postId: postId || "",
            publishedAt: new Date().toISOString(),
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to mark post as published");
      }

      await loadQueue();

      setSelectedId("");
      setCaption("");
      setImages([]);
      setScheduledFor("");
    } catch (err) {
      setError(err.message || "Failed to mark post as published");
    } finally {
      setSaving(false);
    }
  }

  async function sendBack() {
    if (!selectedEvent) return;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `/api/history/${selectedEvent._id}/archive`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "active",
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to return event");
      }

      await loadQueue();

      setSelectedId("");
      setCaption("");
      setImages([]);
      setScheduledFor("");
    } catch (err) {
      setError(err.message || "Failed to return event");
    } finally {
      setSaving(false);
    }
  }

  function addImage() {
    if (!imageUrl.trim()) return;

    setImages((current) => [
      ...current,
      {
        url: imageUrl.trim(),
        credit: imageCredit.trim(),
        rights: imageRights.trim(),
      },
    ]);

    setImageUrl("");
    setImageCredit("");
    setImageRights("");
  }

  function removeImage(index) {
    setImages((current) =>
      current.filter((_, imageIndex) => imageIndex !== index),
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-100 p-8">
        <div className="mx-auto max-w-7xl rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
          Loading Instagram queue...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-900">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Different Years. Same Detroit.
            </p>

            <h1 className="mt-1 text-3xl font-bold">Instagram Queue</h1>

            <p className="mt-2 text-zinc-600">
              Prepare approved history records for publication.
            </p>
          </div>

          <AdminNav />
        </header>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
            <h2 className="text-lg font-semibold">Instagram queue is empty</h2>

            <p className="mt-2 text-sm text-zinc-500">
              Approved archive records will appear here when they are moved into
              the Instagram queue.
            </p>

            <Link
              href="/admin"
              className="mt-5 inline-block rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Open History Archive
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            {/* QUEUE */}
            <aside className="rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-200 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Queue</h2>

                  <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold">
                    {events.length}
                  </span>
                </div>
              </div>

              <div className="max-h-[720px] overflow-y-auto">
                {events.map((event) => {
                  const selected = event._id === selectedId;

                  return (
                    <button
                      key={event._id}
                      type="button"
                      onClick={() => selectEvent(event)}
                      className={`w-full border-b border-zinc-100 p-4 text-left transition ${
                        selected ? "bg-zinc-100" : "hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-500">
                          {months[event.month]} {event.day}
                        </span>

                        <InstagramStatus
                          status={event.instagram?.status || "queued"}
                        />
                      </div>

                      <h3 className="mt-2 line-clamp-2 text-sm font-semibold">
                        {event.title}
                      </h3>

                      <p className="mt-1 text-xs text-zinc-500">{event.year}</p>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* EDITOR */}
            {selectedEvent && (
              <section className="space-y-6">
                {/* EVENT */}
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold">
                      {months[selectedEvent.month]} {selectedEvent.day},{" "}
                      {selectedEvent.year}
                    </span>

                    <InstagramStatus
                      status={selectedEvent.instagram?.status || "queued"}
                    />
                  </div>

                  <h2 className="mt-3 text-2xl font-bold">
                    {selectedEvent.title}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-zinc-600">
                    {selectedEvent.description}
                  </p>

                  <div className="mt-4 rounded-lg bg-zinc-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Significance
                    </p>

                    <p className="mt-1 text-sm leading-6">
                      {selectedEvent.significance}
                    </p>
                  </div>
                </div>

                {/* CAPTION */}
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Instagram Caption</h2>

                    <span className="text-xs text-zinc-500">
                      {caption.length} characters
                    </span>
                  </div>

                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={12}
                    className="mt-4 w-full rounded-lg border border-zinc-300 p-4 text-sm leading-6 outline-none focus:border-zinc-500"
                    placeholder="Write the Instagram caption..."
                  />

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setCaption(buildCaption(selectedEvent))}
                      className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
                    >
                      Rebuild Caption
                    </button>
                  </div>
                </div>

                {/* IMAGES */}
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <h2 className="font-semibold">Images</h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Add image URLs and record the source, credit, and rights
                    information.
                  </p>

                  <div className="mt-4 grid gap-3">
                    <input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Image URL"
                      className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    />

                    <input
                      value={imageCredit}
                      onChange={(e) => setImageCredit(e.target.value)}
                      placeholder="Image credit"
                      className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    />

                    <input
                      value={imageRights}
                      onChange={(e) => setImageRights(e.target.value)}
                      placeholder="Rights / usage note"
                      className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    />

                    <button
                      type="button"
                      onClick={addImage}
                      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                    >
                      Add Image
                    </button>
                  </div>

                  {images.length > 0 && (
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {images.map((image, index) => (
                        <div
                          key={`${image.url}-${index}`}
                          className="overflow-hidden rounded-lg border border-zinc-200"
                        >
                          <img
                            src={image.url}
                            alt=""
                            className="aspect-square w-full object-cover"
                          />

                          <div className="p-3">
                            {image.credit && (
                              <p className="text-xs font-medium">
                                Credit: {image.credit}
                              </p>
                            )}

                            {image.rights && (
                              <p className="mt-1 text-xs text-zinc-500">
                                Rights: {image.rights}
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="mt-3 text-xs font-semibold text-red-600 hover:text-red-800"
                            >
                              Remove Image
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* PREVIEW */}
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <h2 className="font-semibold">Instagram Preview</h2>

                  <div className="mx-auto mt-5 max-w-md overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                    <div className="flex items-center gap-3 border-b border-zinc-100 p-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold">
                        BD
                      </div>

                      <div>
                        <p className="text-sm font-semibold">
                          Black Detroit History
                        </p>

                        <p className="text-xs text-zinc-500">
                          Detroit, Michigan
                        </p>
                      </div>
                    </div>

                    {images[0]?.url ? (
                      <img
                        src={images[0].url}
                        alt=""
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-zinc-100 text-sm text-zinc-400">
                        No image selected
                      </div>
                    )}

                    <div className="p-4">
                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {caption}
                      </p>
                    </div>
                  </div>
                </div>

                {/* SCHEDULE */}
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <h2 className="font-semibold">Publishing</h2>

                  <label className="mt-4 block text-sm font-medium">
                    Schedule for
                  </label>

                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="mt-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  />

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={savePost}
                      className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Instagram Post"}
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={markPublished}
                      className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
                    >
                      Mark Published / Used
                    </button>

                    <button
                      type="button"
                      disabled={
                        saving ||
                        !selectedEvent ||
                        !caption.trim() ||
                        !images[0]?.url
                      }
                      onClick={publishToInstagram}
                      className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {saving ? "Publishing..." : "Publish to Instagram"}
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={sendBack}
                      className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
                    >
                      Send Back to Archive
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function buildCaption(event) {
  const date = `${months[event.month]} ${event.day}, ${event.year}`;

  const people =
    event.people?.length > 0 ? `\n\nPeople: ${event.people.join(", ")}` : "";

  const organizations =
    event.organizations?.length > 0
      ? `\n\nOrganizations: ${event.organizations.join(", ")}`
      : "";

  return `ON THIS DAY IN BLACK DETROIT HISTORY

${date}

${event.title}

${event.description}

Why it matters:
${event.significance}${people}${organizations}

Different Years. Same Detroit.

#BlackDetroitHistory #DetroitHistory #BlackHistory #Detroit`;
}

function toLocalDateTime(value) {
  const date = new Date(value);

  const pad = (number) => String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function InstagramStatus({ status }) {
  const labels = {
    not_ready: "Not Ready",
    queued: "Queued",
    scheduled: "Scheduled",
    published: "Published",
    failed: "Failed",
  };

  return (
    <span className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium">
      {labels[status] || status}
    </span>
  );
}
