"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function QualityPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function runCheck() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/history/quality");

      if (!response.ok) {
        throw new Error("Failed to run quality check");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message || "Failed to run quality check");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runCheck();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Different Years. Same Detroit.
            </p>

            <h1 className="mt-1 text-3xl font-bold">Archive Quality Control</h1>

            <p className="mt-2 text-zinc-600">V1 database integrity check.</p>
          </div>

          <nav className="flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              History Archive
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
          </nav>
        </header>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
            Checking archive...
          </div>
        )}

        {!loading && data && (
          <>
            <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
              <Summary label="Total Records" value={data.summary.total} />

              <Summary
                label="Duplicate Dates"
                value={data.summary.duplicateDates}
                warning
              />

              <Summary
                label="Duplicate Titles"
                value={data.summary.duplicateTitles}
                warning
              />

              <Summary
                label="Missing Sources"
                value={data.summary.missingSources}
                warning
              />

              <Summary
                label="Needs Review"
                value={data.summary.needsReview}
                warning
              />

              <Summary
                label="Incomplete Approved"
                value={data.summary.incompleteApproved}
                warning
              />

              <Summary
                label="Missing Description"
                value={data.summary.missingDescription}
                warning
              />

              <Summary
                label="Missing Significance"
                value={data.summary.missingSignificance}
                warning
              />

              <Summary
                label="Missing Category"
                value={data.summary.missingCategory}
                warning
              />

              <Summary label="Rejected" value={data.summary.rejected} warning />
            </section>

            <section className="space-y-6">
              <IssueSection
                title="Duplicate Dates"
                description="Multiple records share the same month, day, and year."
                items={data.duplicateDates}
                render={(item) => (
                  <div>
                    <p className="font-semibold">
                      {item.date} — {item.count} records
                    </p>

                    <RecordList records={item.records} />
                  </div>
                )}
              />

              <IssueSection
                title="Duplicate Titles"
                description="Potential duplicate historical records."
                items={data.duplicateTitles}
                render={(item) => (
                  <div>
                    <p className="font-semibold">{item.title}</p>

                    <RecordList records={item.records} />
                  </div>
                )}
              />

              <SimpleIssueSection
                title="Missing Sources"
                items={data.missingSources}
              />

              <SimpleIssueSection
                title="Missing Significance"
                items={data.missingSignificance}
              />

              <SimpleIssueSection
                title="Missing Description"
                items={data.missingDescription}
              />

              <SimpleIssueSection
                title="Missing Category"
                items={data.missingCategory}
              />

              <SimpleIssueSection
                title="Needs Review"
                items={data.needsReview}
              />

              <SimpleIssueSection title="Rejected" items={data.rejected} />

              <SimpleIssueSection
                title="Incomplete Approved Records"
                items={data.incompleteApproved}
              />
            </section>

            <button
              type="button"
              onClick={runCheck}
              className="mt-8 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Run Check Again
            </button>
          </>
        )}
      </div>
    </main>
  );
}

function Summary({ label, value, warning = false }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-bold ${
          warning && value > 0 ? "text-red-600" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function IssueSection({ title, description, items, render }) {
  const hasIssues = items?.length > 0;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>

          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        </div>

        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold">
          {items?.length || 0}
        </span>
      </div>

      {!hasIssues ? (
        <CleanState />
      ) : (
        <div className="mt-5 space-y-4">
          {items.map((item, index) => (
            <div
              key={`${title}-${index}`}
              className="rounded-lg border border-zinc-200 p-4"
            >
              {render(item)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SimpleIssueSection({ title, items }) {
  return (
    <IssueSection
      title={title}
      description="Records requiring attention."
      items={items}
      render={(item) => (
        <div>
          <p className="font-semibold">{item.title}</p>

          <p className="mt-1 text-sm text-zinc-500">{item.date}</p>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-md border border-zinc-200 px-2 py-1 text-xs">
              {item.verification}
            </span>

            <span className="rounded-md border border-zinc-200 px-2 py-1 text-xs">
              {item.archive}
            </span>
          </div>
        </div>
      )}
    />
  );
}

function RecordList({ records }) {
  return (
    <div className="mt-3 space-y-2">
      {records.map((record) => (
        <div key={record.id} className="rounded-md bg-zinc-50 p-3">
          <p className="text-sm font-medium">{record.title}</p>

          <p className="mt-1 text-xs text-zinc-500">
            {record.date || `${record.year}`} · {record.verification} ·{" "}
            {record.archive}
          </p>
        </div>
      ))}
    </div>
  );
}

function CleanState() {
  return (
    <div className="mt-5 rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">
      ✓ No issues found.
    </div>
  );
}
