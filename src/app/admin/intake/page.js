"use client";

import { useState } from "react";
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

const categories = [
  "Civil Rights",
  "Music",
  "Business",
  "Education",
  "Politics",
  "Sports",
  "Arts & Culture",
  "Labor",
  "Community",
  "Military",
  "Media",
  "Other",
];

export default function ResearchIntakePage() {
  const [form, setForm] = useState({
    month: "",
    day: "",
    year: "",
    title: "",
    description: "",
    significance: "",
    category: "Other",
    people: "",
    organizations: "",
    neighborhood: "",
    address: "",
    sourceTitle: "",
    sourceUrl: "",
    sourceNotes: "",
    verificationNotes: "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const sources = [];

      if (form.sourceUrl.trim()) {
        sources.push({
          title: form.sourceTitle.trim() || "Source",
          url: form.sourceUrl.trim(),
          notes: form.sourceNotes.trim(),
        });
      }

      const response = await fetch("/api/history/intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          month: Number(form.month),
          day: Number(form.day),
          year: Number(form.year),

          title: form.title,

          description: form.description,

          significance: form.significance,

          category: form.category,

          people: splitList(form.people),

          organizations: splitList(form.organizations),

          location: {
            neighborhood: form.neighborhood,
            address: form.address,
          },

          sources,

          verification: {
            notes: form.verificationNotes,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add historical lead");
      }

      window.location.replace("/admin/quality");

      setForm({
        month: "",
        day: "",
        year: "",
        title: "",
        description: "",
        significance: "",
        category: "Other",
        people: "",
        organizations: "",
        neighborhood: "",
        address: "",
        sourceTitle: "",
        sourceUrl: "",
        sourceNotes: "",
        verificationNotes: "",
      });
    } catch (err) {
      setError(err.message || "Failed to add historical lead");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-900">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Different Years. A Different Detroit.
            </p>

            <h1 className="mt-1 text-3xl font-bold">Research Intake</h1>

            <p className="mt-2 text-zinc-600">
              Add a historical lead to the V1 archive.
            </p>
          </div>

          <AdminNav />
        </header>

        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Research rule</h2>

          <p className="mt-2 text-sm leading-6 text-zinc-600">
            New records enter as <strong>Needs Review</strong>. They remain in
            the active archive until the historical date, Detroit connection,
            details, and sources have been checked.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-lg border border-zinc-300 bg-white p-4 text-sm font-medium">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-6">
          {/* DATE */}
          <Section title="Historical Date">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Month" required>
                <select
                  required
                  value={form.month}
                  onChange={(e) => update("month", e.target.value)}
                  className="input"
                >
                  <option value="">Select month</option>

                  {months.slice(1).map((name, index) => (
                    <option key={name} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Day" required>
                <input
                  required
                  type="number"
                  min="1"
                  max="31"
                  value={form.day}
                  onChange={(e) => update("day", e.target.value)}
                  className="input"
                />
              </Field>

              <Field label="Year" required>
                <input
                  required
                  type="number"
                  value={form.year}
                  onChange={(e) => update("year", e.target.value)}
                  className="input"
                />
              </Field>
            </div>
          </Section>

          {/* EVENT */}
          <Section title="Historical Event">
            <Field label="Title" required>
              <input
                required
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="What happened?"
                className="input"
              />
            </Field>

            <Field label="Description" required>
              <textarea
                required
                rows={6}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Describe what happened."
                className="input"
              />
            </Field>

            <Field label="Significance" required>
              <textarea
                required
                rows={5}
                value={form.significance}
                onChange={(e) => update("significance", e.target.value)}
                placeholder="Why does this matter to Black Detroit history?"
                className="input"
              />
            </Field>

            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="input"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>
          </Section>

          {/* PEOPLE */}
          <Section title="People & Organizations">
            <Field label="People" hint="Separate names with commas.">
              <input
                value={form.people}
                onChange={(e) => update("people", e.target.value)}
                placeholder="Person 1, Person 2"
                className="input"
              />
            </Field>

            <Field
              label="Organizations"
              hint="Separate organizations with commas."
            >
              <input
                value={form.organizations}
                onChange={(e) => update("organizations", e.target.value)}
                placeholder="Organization 1, Organization 2"
                className="input"
              />
            </Field>
          </Section>

          {/* LOCATION */}
          <Section title="Detroit Location">
            <Field label="Neighborhood">
              <input
                value={form.neighborhood}
                onChange={(e) => update("neighborhood", e.target.value)}
                placeholder="Neighborhood"
                className="input"
              />
            </Field>

            <Field label="Address">
              <input
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Street address, if known"
                className="input"
              />
            </Field>
          </Section>

          {/* SOURCE */}
          <Section title="Source">
            <Field label="Source Title">
              <input
                value={form.sourceTitle}
                onChange={(e) => update("sourceTitle", e.target.value)}
                placeholder="Detroit Historical Society, newspaper, archive, etc."
                className="input"
              />
            </Field>

            <Field label="Source URL">
              <input
                type="url"
                value={form.sourceUrl}
                onChange={(e) => update("sourceUrl", e.target.value)}
                placeholder="https://..."
                className="input"
              />
            </Field>

            <Field label="Source Notes">
              <textarea
                rows={4}
                value={form.sourceNotes}
                onChange={(e) => update("sourceNotes", e.target.value)}
                placeholder="What does this source establish?"
                className="input"
              />
            </Field>
          </Section>

          {/* REVIEW */}
          <Section title="Review Notes">
            <Field
              label="Verification Notes"
              hint="Record what still needs to be checked."
            >
              <textarea
                rows={5}
                value={form.verificationNotes}
                onChange={(e) => update("verificationNotes", e.target.value)}
                placeholder="Exact date needs confirmation; source establishes event but not date; Detroit connection needs additional documentation..."
                className="input"
              />
            </Field>
          </Section>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Adding Lead..." : "Add Historical Lead"}
            </button>

            <Link
              href="/admin"
              className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold hover:bg-zinc-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #d4d4d8;
          background: white;
          padding: 0.65rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }

        .input:focus {
          border-color: #71717a;
        }
      `}</style>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-semibold">{title}</h2>

      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({ label, required = false, hint, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>

      {children}

      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function splitList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
