"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function InstagramStatusPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function checkConnection() {
    try {
      setLoading(true);

      const response = await fetch("/api/instagram/status", {
        cache: "no-store",
      });

      const result = await response.json();

      setData(result);
    } catch (error) {
      setData({
        connected: false,
        error: "Could not reach Instagram connection endpoint.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-900">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <Link
            href="/admin/instagram"
            className="text-sm font-medium text-zinc-500 hover:text-black"
          >
            ← Instagram Queue
          </Link>

          <h1 className="mt-4 text-3xl font-bold">Instagram Connection</h1>

          <p className="mt-2 text-zinc-600">
            Verify the Detroit Black History Instagram connection before
            publishing.
          </p>
        </header>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          {loading && (
            <p className="text-sm text-zinc-500">Checking connection...</p>
          )}

          {!loading && data?.connected && (
            <>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Connection
                </p>

                <p className="mt-1 text-lg font-bold">Connected</p>

                {data.account?.username && (
                  <p className="mt-2 text-sm text-zinc-600">
                    @{data.account.username}
                  </p>
                )}

                {data.account?.name && (
                  <p className="mt-1 text-sm text-zinc-600">
                    {data.account.name}
                  </p>
                )}

                <p className="mt-3 break-all text-xs text-zinc-500">
                  Account ID: {data.account?.id}
                </p>
              </div>

              <div className="mt-6 rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">
                The server can communicate with the configured Instagram
                account.
              </div>
            </>
          )}

          {!loading && !data?.connected && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-5">
              <p className="font-semibold text-red-800">
                Instagram connection failed
              </p>

              <p className="mt-2 text-sm text-red-700">
                {data?.error || "Unknown Instagram connection error."}
              </p>

              {data?.details && (
                <pre className="mt-4 overflow-x-auto rounded-md bg-white p-3 text-xs text-red-700">
                  {JSON.stringify(data.details, null, 2)}
                </pre>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={checkConnection}
            disabled={loading}
            className="mt-6 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Check Connection Again
          </button>
        </section>
      </div>
    </main>
  );
}
