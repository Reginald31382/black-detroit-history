"use client";
import { useEffect, useState } from "react";
export default function Used() {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    fetch("/api/history?status=used")
      .then((r) => r.json())
      .then(setEvents);
  }, []);
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-bold">Used Data</h1>
      <p className="mt-2 mb-6 text-zinc-600">
        Previously published/used records remain searchable and preserved.
      </p>
      <div className="grid gap-4">
        {events.map((e) => (
          <article key={e._id} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">
              {e.month}/{e.day}/{e.year} · Used{" "}
              {e.lifecycle?.usedAt
                ? new Date(e.lifecycle.usedAt).toLocaleDateString()
                : ""}
            </p>
            <h2 className="text-xl font-bold">{e.title}</h2>
            <p className="mt-2">{e.description}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
