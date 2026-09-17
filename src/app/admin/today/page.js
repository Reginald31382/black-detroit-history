"use client";

import { useEffect, useState } from "react";
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

export default function TodayPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  useEffect(() => {
    loadToday();
  }, []);

  async function loadToday(month = "", day = "") {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const params = new URLSearchParams();

      if (month) params.set("month", month);
      if (day) params.set("day", day);

      const query = params.toString();

      const response = await fetch(
        `/api/history/today${query ? `?${query}` : ""}`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load today's history");
      }

      setEvents(data.events || []);
      setDate(data.date || null);

      setSelectedMonth(String(data.date.month));
      setSelectedDay(String(data.date.day));
    } catch (err) {
      setError(err.message || "Failed to load today's history");
    } finally {
      setLoading(false);
    }
  }

  async function sendToInstagram(eventId) {
    try {
      setMovingId(eventId);
      setError("");
      setMessage("");

      const response = await fetch(`/api/history/${eventId}/archive`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "instagram",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to move event to Instagram queue",
        );
      }

      window.location.replace("/admin/instagram");
    } catch (err) {
      console.error("SEND TO INSTAGRAM FAILED:", err);

      setError(err.message || "Failed to move event to Instagram queue");
    } finally {
      setMovingId(null);
    }
  }

  async function sendAllToInstagram() {
    if (events.length === 0) return;

    const confirmed = window.confirm(
      `Prepare all ${events.length} event${
        events.length === 1 ? "" : "s"
      } for Instagram?`,
    );

    if (!confirmed) return;

    try {
      setMovingId("all");
      setError("");
      setMessage("");

      for (const event of events) {
        const response = await fetch(`/api/history/${event._id}/archive`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "instagram",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Failed to prepare ${event.title}`);
        }
      }

      window.location.replace("/admin/instagram");
    } catch (err) {
      console.error("PREPARE ALL FAILED:", err);

      setError(err.message || "Failed to prepare all events");
    } finally {
      setMovingId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-100 p-8">
        <div className="mx-auto max-w-6xl rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
          Loading today's Black Detroit history...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Different Years. A Different Detroit.
            </p>

            <h1 className="mt-1 text-3xl font-bold">On This Day</h1>

            {date && (
              <div className="mt-4 flex flex-wrap items-end gap-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Month
                  </label>

                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                  >
                    {months.slice(1).map((monthName, index) => (
                      <option key={monthName} value={index + 1}>
                        {monthName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Day
                  </label>

                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                  >
                    {Array.from({ length: 31 }, (_, index) => index + 1).map(
                      (dayNumber) => (
                        <option key={dayNumber} value={dayNumber}>
                          {dayNumber}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => loadToday(selectedMonth, selectedDay)}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  View Date
                </button>

                <button
                  type="button"
                  onClick={() => loadToday()}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
                >
                  Today
                </button>
              </div>
            )}
          </div>

          <AdminNav />
        </header>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {message}
          </div>
        )}

        {events.length > 0 && (
          <div className="mb-6 flex justify-end">
            <button
              type="button"
              disabled={movingId === "all"}
              onClick={sendAllToInstagram}
              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {movingId === "all"
                ? "Preparing All..."
                : `Prepare All ${events.length} for Instagram`}
            </button>
          </div>
        )}

        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
            <div className="mx-auto max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Research Needed
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                No approved active records for this date
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                There is currently no approved historical record available for
                this Detroit date.
              </p>

              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href="/admin/intake"
                  className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Add Research Lead
                </Link>

                <Link
                  href="/admin"
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
                >
                  Search Archive
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {events.map((event) => (
              <article
                key={event._id}
                className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
              >
                {event.images?.[0]?.url ? (
                  <img
                    src={event.images[0].url}
                    alt=""
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-zinc-100 text-sm text-zinc-400">
                    No image
                  </div>
                )}

                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold">
                      {months[event.month]} {event.day}, {event.year}
                    </span>

                    <span className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium">
                      {event.category}
                    </span>
                  </div>

                  <h2 className="mt-4 text-xl font-bold">{event.title}</h2>

                  <p className="mt-3 text-sm leading-6 text-zinc-600">
                    {event.description}
                  </p>

                  <div className="mt-4 rounded-lg bg-zinc-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Why it matters
                    </p>

                    <p className="mt-1 text-sm leading-6">
                      {event.significance}
                    </p>
                  </div>

                  {event.people?.length > 0 && (
                    <p className="mt-4 text-sm">
                      <strong>People:</strong> {event.people.join(", ")}
                    </p>
                  )}

                  {event.organizations?.length > 0 && (
                    <p className="mt-2 text-sm">
                      <strong>Organizations:</strong>{" "}
                      {event.organizations.join(", ")}
                    </p>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/admin`}
                      className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
                    >
                      View Archive
                    </Link>

                    <button
                      type="button"
                      disabled={movingId === event._id}
                      onClick={() => sendToInstagram(event._id)}
                      className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {movingId === event._id
                        ? "Preparing..."
                        : "Prepare for Instagram"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
