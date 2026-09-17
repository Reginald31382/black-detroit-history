"use client";

import Link from "next/link";

export default function AdminNav() {
  async function logout() {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      });
    } finally {
      window.location.replace("/admin/login");
    }
  }

  return (
    <nav className="flex flex-wrap gap-2">
      <Link
        href="/admin"
        className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
      >
        History Archive
      </Link>

      <Link
        href="/admin/then-and-now"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
      >
        Then &amp; Now
      </Link>

      <Link
        href="/admin/today"
        className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
      >
        On This Day
      </Link>

      <Link
        href="/admin/intake"
        className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
      >
        Research Intake
      </Link>

      <Link
        href="/admin/quality"
        className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
      >
        Quality Control
      </Link>

      <Link
        href="/admin/instagram"
        className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
      >
        Instagram Queue
      </Link>

      <Link
        href="/admin/used"
        className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
      >
        Used History
      </Link>

      <button
        type="button"
        onClick={logout}
        className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 cursor-pointer"
      >
        Log Out
      </button>
    </nav>
  );
}
