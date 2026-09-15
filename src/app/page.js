"use client";
import { useEffect, useState } from "react";
export default function Home() {
  const [data, setData] = useState({ events: [], date: {} });
  useEffect(() => {
    fetch("/api/history/today")
      .then((r) => r.json())
      .then(setData);
  }, []);
  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest">
          On This Day in Black Detroit History
        </p>
        <h1 className="text-4xl font-bold">Different Years. Same Detroit.</h1>
      </header>
      <p className="mb-6">
        {data.date?.month}/{data.date?.day}
      </p>
      <div className="grid gap-5">
        {data.events.map((e) => (
          <article key={e._id} className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-2 text-sm">
              {e.year} · {e.category}
            </div>
            <h2 className="text-2xl font-bold">{e.title}</h2>
            <p className="mt-3">{e.description}</p>
            <p className="mt-3 text-sm text-zinc-600">{e.significance}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
