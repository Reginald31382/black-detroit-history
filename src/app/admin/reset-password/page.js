"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedToken = sessionStorage.getItem("bdh_password_reset_token");

    if (storedToken) {
      setToken(storedToken);
    } else {
      setError("No valid password reset session was found.");
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!token) {
        throw new Error(
          "Your password reset session is missing or has expired.",
        );
      }

      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to reset password.");
      }

      sessionStorage.removeItem("bdh_password_reset_token");

      setSuccess(data.message || "Password reset successfully.");

      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Unable to reset password.");
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

        <h1 className="mt-2 text-3xl font-bold">Create New Password</h1>

        <p className="mt-2 text-sm text-zinc-500">
          Choose a new password for your administrator account.
        </p>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="newPassword"
                className="mb-2 block text-sm font-medium"
              >
                New Password
              </label>

              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={12}
                autoComplete="new-password"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 outline-none focus:border-zinc-600"
              />

              <p className="mt-2 text-xs text-zinc-500">
                Minimum 12 characters.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium"
              >
                Confirm New Password
              </label>

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={12}
                autoComplete="new-password"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 outline-none focus:border-zinc-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full cursor-pointer rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>
        )}

        {success && (
          <Link
            href="/admin/login"
            className="mt-6 block w-full rounded-lg bg-black px-4 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Return to Admin Login
          </Link>
        )}

        {!success && (
          <div className="mt-6 border-t border-zinc-200 pt-6">
            <Link
              href="/admin/login"
              className="text-sm font-medium text-zinc-700 hover:text-black"
            >
              ← Back to Admin Login
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
