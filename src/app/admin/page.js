"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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

const verificationOptions = [
  ["", "All Verification"],
  ["draft", "Draft"],
  ["needs_review", "Needs Review"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
];

const archiveOptions = [
  ["active", "Active Archive"],
  ["instagram", "Instagram Queue"],
  ["used", "Used History"],
  ["all", "All Records"],
];

export default function AdminPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [verification, setVerification] = useState("");
  const [archive, setArchive] = useState("active");

  const [actionId, setActionId] = useState("");

  async function loadEvents() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (month) params.set("month", month);
      if (day) params.set("day", day);
      if (year) params.set("year", year);
      if (verification) params.set("verification", verification);

      params.set("archive", archive);

      const response = await fetch(`/api/history?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to load archive");
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      setError(err.message || "Failed to load archive");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, [month, day, year, verification, archive]);

  async function updateArchiveStatus(id, status) {
    try {
      setActionId(id);

      const response = await fetch(`/api/history/${id}/archive`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update record");
      }

      await loadEvents();
    } catch (err) {
      alert(err.message || "Failed to update record");
    } finally {
      setActionId("");
    }
  }

  async function updateVerification(id, status) {
    try {
      setActionId(id);

      const response = await fetch(`/api/history/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verification: {
            status,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update verification");
      }

      await loadEvents();
    } catch (err) {
      alert(err.message || "Failed to update verification");
    } finally {
      setActionId("");
    }
  }

  const counts = useMemo(() => {
    return {
      total: events.length,

      approved: events.filter(
        (event) => event.verification?.status === "approved",
      ).length,

      needsReview: events.filter(
        (event) => event.verification?.status === "needs_review",
      ).length,

      draft: events.filter((event) => event.verification?.status === "draft")
        .length,

      rejected: events.filter(
        (event) => event.verification?.status === "rejected",
      ).length,

      active: events.filter((event) => event.archive?.status === "active")
        .length,

      instagram: events.filter((event) => event.archive?.status === "instagram")
        .length,

      used: events.filter((event) => event.archive?.status === "used").length,
    };
  }, [events]);

  function resetFilters() {
    setMonth("");
    setDay("");
    setYear("");
    setVerification("");
    setArchive("active");
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-900">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Different Years. Same Detroit.
            </p>

            <h1 className="mt-1 text-3xl font-bold">Black Detroit History</h1>

            <p className="mt-2 text-zinc-600">Archive Management — Version 1</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Public Page
            </Link>

            <Link
              href="/admin/instagram"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Instagram Queue
            </Link>

            <Link
              href="/admin/used"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Used History
            </Link>
            <Link
              href="/admin/quality"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Quality Control
            </Link>
            <Link
              href="/admin/intake"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Research Intake
            </Link>
          </div>
        </div>

        {/* ARCHIVE COUNTS */}
        <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          <StatCard label="Showing" value={counts.total} />

          <StatCard label="Approved" value={counts.approved} />

          <StatCard label="Needs Review" value={counts.needsReview} />

          <StatCard label="Draft" value={counts.draft} />

          <StatCard label="Active" value={counts.active} />

          <StatCard label="Instagram" value={counts.instagram} />

          <StatCard label="Used" value={counts.used} />
        </section>

        {/* FILTERS */}
        <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Archive Filters</h2>

            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-medium text-zinc-500 hover:text-black"
            >
              Reset
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
              min="1"
              max="31"
              placeholder="Day"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />

            <input
              type="number"
              placeholder="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />

            <select
              value={verification}
              onChange={(e) => setVerification(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              {verificationOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={archive}
              onChange={(e) => setArchive(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              {archiveOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
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
            Loading archive...
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && events.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
            <h2 className="font-semibold">No records found</h2>

            <p className="mt-2 text-sm text-zinc-500">
              Try changing the filters.
            </p>
          </div>
        )}

        {/* RECORDS */}
        {!loading && events.length > 0 && (
          <div className="space-y-4">
            {events.map((event) => (
              <HistoryCard
                key={event._id}
                event={event}
                actionId={actionId}
                onArchive={updateArchiveStatus}
                onVerification={updateVerification}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </div>

      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function HistoryCard({ event, actionId, onArchive, onVerification }) {
  const busy = actionId === event._id;

  const verificationStatus = event.verification?.status || "draft";

  const archiveStatus = event.archive?.status || "active";

  const instagramStatus = event.instagram?.status || "not_ready";

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
        {/* MAIN INFO */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold">
              {months[event.month]} {event.day}, {event.year}
            </span>

            <StatusBadge status={verificationStatus} />

            <ArchiveBadge status={archiveStatus} />
          </div>

          <h2 className="mt-3 text-xl font-bold">{event.title}</h2>

          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {event.description}
          </p>

          {event.significance && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Significance
              </p>

              <p className="mt-1 text-sm leading-6 text-zinc-700">
                {event.significance}
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500">
            {event.category && (
              <span className="rounded-full border border-zinc-200 px-2 py-1">
                {event.category}
              </span>
            )}

            {event.people?.length > 0 && (
              <span className="rounded-full border border-zinc-200 px-2 py-1">
                {event.people.length} people
              </span>
            )}

            {event.sources?.length > 0 && (
              <span className="rounded-full border border-zinc-200 px-2 py-1">
                {event.sources.length} sources
              </span>
            )}

            {event.images?.length > 0 && (
              <span className="rounded-full border border-zinc-200 px-2 py-1">
                {event.images.length} images
              </span>
            )}
          </div>

          {/* SOURCES */}
          {event.sources?.length > 0 && (
            <div className="mt-4">
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

        {/* CONTROLS */}
        <div className="w-full lg:w-64">
          <div className="rounded-lg bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Verification
            </p>

            <select
              value={verificationStatus}
              disabled={busy}
              onChange={(e) => onVerification(event._id, e.target.value)}
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="needs_review">Needs Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Archive
            </p>

            <div className="mt-2 space-y-2">
              {archiveStatus === "active" && (
                <>
                  <button
                    type="button"
                    disabled={busy || verificationStatus !== "approved"}
                    onClick={() => onArchive(event._id, "instagram")}
                    className="w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Approve for Instagram
                  </button>

                  {verificationStatus !== "approved" && (
                    <p className="text-xs text-zinc-500">
                      Record must be approved before it can enter the Instagram
                      queue.
                    </p>
                  )}
                </>
              )}

              {archiveStatus === "instagram" && (
                <>
                  <Link
                    href={`/admin/instagram?event=${event._id}`}
                    className="block w-full rounded-md bg-black px-3 py-2 text-center text-sm font-medium text-white hover:bg-zinc-800"
                  >
                    Prepare Instagram Post
                  </Link>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onArchive(event._id, "used")}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-40"
                  >
                    Mark Used
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onArchive(event._id, "active")}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-40"
                  >
                    Send Back to Archive
                  </button>
                </>
              )}

              {archiveStatus === "used" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onArchive(event._id, "active")}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-40"
                >
                  Return to Active
                </button>
              )}
            </div>

            <div className="mt-4 border-t border-zinc-200 pt-4">
              <p className="text-xs text-zinc-500">Instagram status</p>

              <p className="mt-1 text-sm font-medium">
                {formatStatus(instagramStatus)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }) {
  const labels = {
    draft: "Draft",
    needs_review: "Needs Review",
    approved: "Approved",
    rejected: "Rejected",
  };

  return (
    <span className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium">
      {labels[status] || status}
    </span>
  );
}

function ArchiveBadge({ status }) {
  const labels = {
    active: "Active",
    instagram: "Instagram",
    used: "Used",
  };

  return (
    <span className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium">
      {labels[status] || status}
    </span>
  );
}

function formatStatus(status) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
