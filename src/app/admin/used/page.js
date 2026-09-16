"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function UsedHistoryPage() {
  const [events, setEvents] = useState([]);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUsedHistory() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("archive", "used");

      if (month) params.set("month", month);
      if (year) params.set("year", year);

      const response = await fetch(`/api/history?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to load used history");
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      setError(err.message || "Failed to load used history");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsedHistory();
  }, [month, year]);

  const years = useMemo(() => {
    return [...new Set(events.map((event) => event.year))].sort(
      (a, b) => b - a,
    );
  }, [events]);

  function resetFilters() {
    setMonth("");
    setYear("");
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

            <h1 className="mt-1 text-3xl font-bold">Used History</h1>

            <p className="mt-2 text-zinc-600">
              Published records remain here as part of the permanent archive.
            </p>
          </div>

          <AdminNav />
        </header>

        {/* SUMMARY */}
        <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryCard label="Published Records" value={events.length} />

          <SummaryCard
            label="With Captions"
            value={
              events.filter((event) => event.instagram?.caption?.trim()).length
            }
          />

          <SummaryCard
            label="With Images"
            value={events.filter((event) => event.images?.length > 0).length}
          />

          <SummaryCard label="Years Represented" value={years.length} />
        </section>

        {/* FILTERS */}
        <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Used History Filters</h2>

            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-medium text-zinc-500 hover:text-black"
            >
              Reset
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All Months</option>

              {months.slice(1).map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
            Loading used history...
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && events.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
            <h2 className="text-lg font-semibold">No published history yet</h2>

            <p className="mt-2 text-sm text-zinc-500">
              Records will remain here after they are published.
            </p>
          </div>
        )}

        {/* USED RECORDS */}
        {!loading && events.length > 0 && (
          <div className="space-y-5">
            {events.map((event) => (
              <UsedEvent key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function UsedEvent({ event }) {
  const publishedAt = event.instagram?.publishedAt
    ? new Date(event.instagram.publishedAt).toLocaleString()
    : event.archive?.usedAt
      ? new Date(event.archive.usedAt).toLocaleString()
      : "Date not recorded";

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="grid lg:grid-cols-[220px_1fr]">
        {/* IMAGE */}
        <div className="bg-zinc-100">
          {event.images?.[0]?.url ? (
            <img
              src={event.images[0].url}
              alt=""
              className="h-full min-h-[220px] w-full object-cover"
            />
          ) : (
            <div className="flex min-h-[220px] items-center justify-center text-sm text-zinc-400">
              No image
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold">
              {months[event.month]} {event.day}, {event.year}
            </span>

            <span className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium">
              Published
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-bold">{event.title}</h2>

          <p className="mt-3 text-sm leading-6 text-zinc-600">
            {event.description}
          </p>

          <div className="mt-5 rounded-lg bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Instagram Caption
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
              {event.instagram?.caption || "No caption saved."}
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <InfoItem label="Published" value={publishedAt} />

            <InfoItem
              label="Category"
              value={event.category || "Not recorded"}
            />

            <InfoItem label="Image Count" value={event.images?.length || 0} />

            <InfoItem
              label="Post ID"
              value={
                event.instagram?.postId ||
                event.archive?.usedPostId ||
                "Not recorded"
              }
            />
          </div>

          {/* SOURCES */}
          {event.sources?.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Sources
              </p>

              <div className="flex flex-wrap gap-2">
                {event.sources.map((source, index) => (
                  <a
                    key={`${source.url}-${index}`}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
                  >
                    {source.title || "Source"}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm">{value}</p>
    </div>
  );
}
