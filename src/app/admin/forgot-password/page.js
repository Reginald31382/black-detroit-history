"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState(["", "", ""]);

  const [step, setStep] = useState(1);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);

  async function startRecovery(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      /*
       * We need the questions first.
       *
       * Send only the username and ask the API
       * to return the questions.
       */
      const response = await fetch("/api/admin/forgot-password/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to start password recovery.");
      }

      setQuestions(data.questions);
      setStep(2);
    } catch (err) {
      setError(err.message || "Unable to start password recovery.");
    } finally {
      setLoading(false);
    }
  }

  function updateAnswer(index, value) {
    setAnswers((current) => {
      const updated = [...current];
      updated[index] = value;
      return updated;
    });
  }

  async function submitAnswers(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          answers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAttemptsRemaining(data.attemptsRemaining ?? attemptsRemaining);

        throw new Error(data.error || "Incorrect recovery answers.");
      }

      /*
       * Keep the token out of the visible page.
       * Store it temporarily in sessionStorage so it
       * survives navigation to the reset page.
       */
      sessionStorage.setItem("bdh_password_reset_token", data.resetToken);

      window.location.replace("/admin/reset-password");
    } catch (err) {
      setError(err.message || "Unable to verify recovery answers.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
          Black Detroit History
        </p>

        <h1 className="mt-2 text-3xl font-bold">Reset Admin Password</h1>

        <p className="mt-2 text-sm text-zinc-500">
          {step === 1
            ? "Enter your admin username to begin."
            : "Answer all three security questions."}
        </p>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={startRecovery} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium"
              >
                Admin Username
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 outline-none focus:border-zinc-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Loading..." : "Continue"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={submitAnswers} className="mt-6 space-y-6">
            {questions.map((question, index) => (
              <div key={question}>
                <label
                  htmlFor={`answer-${index}`}
                  className="mb-2 block text-sm font-medium"
                >
                  {index + 1}. {question}
                </label>

                <input
                  id={`answer-${index}`}
                  type="text"
                  value={answers[index]}
                  onChange={(e) => updateAnswer(index, e.target.value)}
                  required
                  autoComplete="off"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 outline-none focus:border-zinc-600"
                />
              </div>
            ))}

            <p className="text-xs text-zinc-500">
              You have {attemptsRemaining} recovery attempt
              {attemptsRemaining === 1 ? "" : "s"} remaining.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify Answers"}
            </button>
          </form>
        )}

        <div className="mt-6 border-t border-zinc-200 pt-6">
          <Link
            href="/admin/login"
            className="text-sm font-medium text-zinc-700 hover:text-black"
          >
            ← Back to Admin Login
          </Link>
        </div>
      </div>
    </main>
  );
}
