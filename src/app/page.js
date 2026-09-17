"use client";

import { useEffect, useState } from "react";
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

export default function Home() {
  const [data, setData] = useState({
    events: [],
    date: {},
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadToday() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/history/today", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load today's history");
        }

        setData(result);
      } catch (err) {
        console.error("PUBLIC HISTORY LOAD FAILED:", err);

        setError(err.message || "Failed to load today's history");
      } finally {
        setLoading(false);
      }
    }

    loadToday();
  }, []);

  const dateLabel =
    data.date?.month && data.date?.day
      ? `${months[data.date.month]} ${data.date.day}`
      : "";

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-10 text-zinc-900">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
            On This Day in Black Detroit History
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
            Different Years. A Different Detroit.
          </h1>

          {dateLabel && (
            <p className="mt-4 text-lg font-medium text-zinc-600">
              {dateLabel}
            </p>
          )}
        </header>

        {loading && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 shadow-sm">
            Loading today's Black Detroit history...
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && data.events.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Research Needed
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              No history recorded for today yet.
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-500">
              Check back as the archive grows. New Detroit Black history records
              are researched, verified, and added to the archive continuously.
            </p>
          </div>
        )}

        {!loading && !error && data.events.length > 0 && (
          <div className="grid gap-6">
            {data.events.map((event) => (
              <article
                key={event._id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
              >
                {event.images?.[0]?.url ? (
                  <img
                    src={event.images[0].url}
                    alt=""
                    className="aspect-[16/9] w-full object-cover"
                  />
                ) : null}

                <div className="p-6 md:p-8">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold">
                      {event.year}
                    </span>

                    <span className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium">
                      {event.category}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                    {event.title}
                  </h2>

                  <p className="mt-4 text-base leading-7 text-zinc-700">
                    {event.description}
                  </p>

                  <div className="mt-6 rounded-xl bg-zinc-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                      Why It Matters
                    </p>

                    <p className="mt-2 text-sm leading-6 text-zinc-700">
                      {event.significance}
                    </p>
                  </div>

                  {event.people?.length > 0 && (
                    <div className="mt-5 text-sm">
                      <span className="font-semibold">People:</span>{" "}
                      {event.people.join(", ")}
                    </div>
                  )}

                  {event.organizations?.length > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="font-semibold">Organizations:</span>{" "}
                      {event.organizations.join(", ")}
                    </div>
                  )}

                  {event.location?.neighborhood && (
                    <div className="mt-5 text-xs text-zinc-500">
                      Detroit location: {event.location.neighborhood}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="mt-12 text-center">
          <Link
            href="/admin/login"
            className="cursor-pointer text-[10px] text-zinc-100 transition-colors hover:text-zinc-300"
          >
            Admin
          </Link>
        </div>
      </div>
    </main>
  );
}
