"use client";

import { useState } from "react";
import AdminNav from "@/components/AdminNav";

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

export default function ThenAndNowPage() {
  const [form, setForm] = useState({
    month: "",
    day: "",
    title: "",
    category: "Community",

    address: "",
    neighborhood: "",

    thenYear: "",
    thenDescription: "",
    thenImageUrl: "",
    thenImageCredit: "",
    thenImageRights: "",
    thenSourceTitle: "",
    thenSourceUrl: "",
    thenSourceNotes: "",

    nowYear: "",
    nowDescription: "",
    nowImageUrl: "",
    nowImageCredit: "",
    nowImageRights: "",
    nowSourceTitle: "",
    nowSourceUrl: "",
    nowSourceNotes: "",

    changes: "",
    continuity: "",

    people: "",
    organizations: "",

    reviewNotes: "",
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

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (!form.month || !form.day) {
        throw new Error("Feature month and day are required.");
      }

      if (!form.title.trim()) {
        throw new Error("Title is required.");
      }

      if (!form.thenYear) {
        throw new Error("Then year is required.");
      }

      if (!form.nowYear) {
        throw new Error("Now year is required.");
      }

      if (!form.thenImageUrl.trim()) {
        throw new Error("Add a historical image URL.");
      }

      if (!form.nowImageUrl.trim()) {
        throw new Error("Add a current image URL.");
      }

      const response = await fetch("/api/history/intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentType: "then_and_now",

          month: Number(form.month),
          day: Number(form.day),

          /*
           * Then & Now records use the feature
           * date rather than an historical event date.
           *
           * Use the historical year here so the
           * existing HistoryEvent schema remains
           * compatible.
           */
          year: Number(form.thenYear),

          title: form.title.trim(),

          description: form.thenDescription.trim(),

          significance: form.changes.trim() || "Detroit Then & Now comparison.",

          category: form.category,

          people: form.people
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),

          organizations: form.organizations
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),

          location: {
            address: form.address.trim(),

            neighborhood: form.neighborhood.trim(),
          },

          images: [
            {
              url: form.thenImageUrl.trim(),

              credit: form.thenImageCredit.trim(),

              rights: form.thenImageRights.trim(),
            },
          ],

          sources: form.thenSourceUrl
            ? [
                {
                  title: form.thenSourceTitle.trim() || "Historical source",

                  url: form.thenSourceUrl.trim(),

                  notes: form.thenSourceNotes.trim(),
                },
              ]
            : [],

          thenAndNow: {
            then: {
              year: Number(form.thenYear),

              description: form.thenDescription.trim(),

              images: [
                {
                  url: form.thenImageUrl.trim(),

                  credit: form.thenImageCredit.trim(),

                  rights: form.thenImageRights.trim(),
                },
              ],

              sources: form.thenSourceUrl
                ? [
                    {
                      title: form.thenSourceTitle.trim() || "Historical source",

                      url: form.thenSourceUrl.trim(),

                      notes: form.thenSourceNotes.trim(),
                    },
                  ]
                : [],
            },

            now: {
              year: Number(form.nowYear),

              description: form.nowDescription.trim(),

              images: [
                {
                  url: form.nowImageUrl.trim(),

                  credit: form.nowImageCredit.trim(),

                  rights: form.nowImageRights.trim(),
                },
              ],

              sources: form.nowSourceUrl
                ? [
                    {
                      title: form.nowSourceTitle.trim() || "Current source",

                      url: form.nowSourceUrl.trim(),

                      notes: form.nowSourceNotes.trim(),
                    },
                  ]
                : [],
            },

            changes: form.changes.trim(),

            continuity: form.continuity.trim(),
          },

          verification: {
            notes:
              form.reviewNotes.trim() ||
              "New Then & Now record. Verify historical location, dates, image credits, current location, and sources before approval.",
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.details || "Failed to create Then & Now record.",
        );
      }

      setMessage("Then & Now record added for review.");

      setForm({
        month: "",
        day: "",
        title: "",
        category: "Community",

        address: "",
        neighborhood: "",

        thenYear: "",
        thenDescription: "",
        thenImageUrl: "",
        thenImageCredit: "",
        thenImageRights: "",
        thenSourceTitle: "",
        thenSourceUrl: "",
        thenSourceNotes: "",

        nowYear: "",
        nowDescription: "",
        nowImageUrl: "",
        nowImageCredit: "",
        nowImageRights: "",
        nowSourceTitle: "",
        nowSourceUrl: "",
        nowSourceNotes: "",

        changes: "",
        continuity: "",

        people: "",
        organizations: "",

        reviewNotes: "",
      });
    } catch (err) {
      console.error("THEN AND NOW INTAKE FAILED:", err);

      setError(err.message || "Failed to create Then & Now record.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-900">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Different Years. A Different Detroit.
          </p>

          <h1 className="mt-1 text-3xl font-bold">Detroit Then &amp; Now</h1>

          <p className="mt-2 text-zinc-600">
            Document a Detroit place, institution, street, neighborhood, or
            landmark across time.
          </p>

          <div className="mt-5">
            <AdminNav />
          </div>
        </header>

        {message && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* FEATURE */}

          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Feature</h2>

            <p className="mt-1 text-sm text-zinc-500">
              The date this Then &amp; Now feature will appear in the archive.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Month"
                value={form.month}
                onChange={(value) => update("month", value)}
                type="number"
                placeholder="9"
              />

              <Field
                label="Day"
                value={form.day}
                onChange={(value) => update("day", value)}
                type="number"
                placeholder="17"
              />
            </div>

            <div className="mt-4">
              <Field
                label="Title"
                value={form.title}
                onChange={(value) => update("title", value)}
                placeholder="Hastings Street: Then and Now"
              />
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium">Category</label>

              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* LOCATION */}

          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Detroit Location</h2>

            <div className="mt-4 space-y-4">
              <Field
                label="Address"
                value={form.address}
                onChange={(value) => update("address", value)}
                placeholder="Hastings Street at Lafayette Avenue"
              />

              <Field
                label="Neighborhood"
                value={form.neighborhood}
                onChange={(value) => update("neighborhood", value)}
                placeholder="Black Bottom"
              />
            </div>
          </section>

          {/* THEN */}

          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">THEN</h2>

            <div className="mt-4 space-y-4">
              <Field
                label="Historical Year"
                value={form.thenYear}
                onChange={(value) => update("thenYear", value)}
                type="number"
                placeholder="1959"
              />

              <TextArea
                label="Historical Description"
                value={form.thenDescription}
                onChange={(value) => update("thenDescription", value)}
                placeholder="Describe what this location was like and its importance to Black Detroit."
              />

              <Field
                label="Historical Image URL"
                value={form.thenImageUrl}
                onChange={(value) => update("thenImageUrl", value)}
                placeholder="https://..."
              />

              <Field
                label="Historical Image Credit"
                value={form.thenImageCredit}
                onChange={(value) => update("thenImageCredit", value)}
                placeholder="Detroit Historical Society / Photographer"
              />

              <Field
                label="Historical Image Rights"
                value={form.thenImageRights}
                onChange={(value) => update("thenImageRights", value)}
                placeholder="Rights / usage information"
              />

              <Field
                label="Historical Source Title"
                value={form.thenSourceTitle}
                onChange={(value) => update("thenSourceTitle", value)}
                placeholder="Source title"
              />

              <Field
                label="Historical Source URL"
                value={form.thenSourceUrl}
                onChange={(value) => update("thenSourceUrl", value)}
                placeholder="https://..."
              />

              <TextArea
                label="Historical Source Notes"
                value={form.thenSourceNotes}
                onChange={(value) => update("thenSourceNotes", value)}
                placeholder="What does this source establish?"
              />
            </div>
          </section>

          {/* NOW */}

          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">NOW</h2>

            <div className="mt-4 space-y-4">
              <Field
                label="Current Year"
                value={form.nowYear}
                onChange={(value) => update("nowYear", value)}
                type="number"
                placeholder="2026"
              />

              <TextArea
                label="Current Description"
                value={form.nowDescription}
                onChange={(value) => update("nowDescription", value)}
                placeholder="Describe what occupies the location today and what remains or has changed."
              />

              <Field
                label="Current Image URL"
                value={form.nowImageUrl}
                onChange={(value) => update("nowImageUrl", value)}
                placeholder="https://..."
              />

              <Field
                label="Current Image Credit"
                value={form.nowImageCredit}
                onChange={(value) => update("nowImageCredit", value)}
                placeholder="Photographer / source"
              />

              <Field
                label="Current Image Rights"
                value={form.nowImageRights}
                onChange={(value) => update("nowImageRights", value)}
                placeholder="Rights / usage information"
              />

              <Field
                label="Current Source Title"
                value={form.nowSourceTitle}
                onChange={(value) => update("nowSourceTitle", value)}
                placeholder="Source title"
              />

              <Field
                label="Current Source URL"
                value={form.nowSourceUrl}
                onChange={(value) => update("nowSourceUrl", value)}
                placeholder="https://..."
              />

              <TextArea
                label="Current Source Notes"
                value={form.nowSourceNotes}
                onChange={(value) => update("nowSourceNotes", value)}
                placeholder="What does this source establish?"
              />
            </div>
          </section>

          {/* COMPARISON */}

          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">What Changed?</h2>

            <div className="mt-4 space-y-4">
              <TextArea
                label="Changes"
                value={form.changes}
                onChange={(value) => update("changes", value)}
                placeholder="Explain the major physical, social, economic, or cultural changes."
              />

              <TextArea
                label="What Remains"
                value={form.continuity}
                onChange={(value) => update("continuity", value)}
                placeholder="What remains connected to the historical place or community?"
              />
            </div>
          </section>

          {/* PEOPLE */}

          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              People &amp; Organizations
            </h2>

            <div className="mt-4 space-y-4">
              <Field
                label="People"
                value={form.people}
                onChange={(value) => update("people", value)}
                placeholder="Names separated by commas"
              />

              <Field
                label="Organizations"
                value={form.organizations}
                onChange={(value) => update("organizations", value)}
                placeholder="Organizations separated by commas"
              />
            </div>
          </section>

          {/* REVIEW */}

          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Verification</h2>

            <TextArea
              label="Review Notes"
              value={form.reviewNotes}
              onChange={(value) => update("reviewNotes", value)}
              placeholder="What still needs to be verified?"
            />
          </section>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Add Then & Now to Archive"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
      />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder = "" }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-zinc-300 p-3 text-sm leading-6 outline-none focus:border-zinc-500"
      />
    </div>
  );
}
