"use client";

import { useState, type FormEvent } from "react";
import { useStore } from "@/lib/store";

export default function SettingsPage() {
  const {
    ready,
    prefs,
    setPrefs,
    dataSource,
    supabaseConfigured,
    supabaseUser,
    lastError,
    clearAllData,
    signIn,
    signUp,
    signOut,
  } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  async function onAuth(
    e: FormEvent,
    mode: "signin" | "signup"
  ) {
    e.preventDefault();
    setAuthMessage(null);
    if (!email.trim() || password.length < 6) {
      setAuthMessage("Enter a valid email and a password of 6+ characters.");
      return;
    }
    setAuthBusy(true);
    const res =
      mode === "signin"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
    setAuthBusy(false);
    setAuthMessage(res.message);
    if (res.ok && mode === "signin") {
      setEmail("");
      setPassword("");
    }
  }

  if (!ready) {
    return (
      <div className="py-20 text-center text-zinc-400" role="status">
        Loading…
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Settings</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Control what data this app shows and where it is stored.
      </p>

      {lastError && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300"
        >
          {lastError}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {/* Demo mode */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-white">Demo mode</h2>
              <p className="mt-1 text-sm text-zinc-400">
                When on, the app shows simulated demo contacts and events so
                you can preview every screen. When off, only your own manually
                logged data is shown.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.demoMode}
              aria-label="Demo mode"
              onClick={() => setPrefs({ demoMode: !prefs.demoMode })}
              className={`relative h-7 w-12 shrink-0 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                prefs.demoMode ? "bg-wa" : "bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                  prefs.demoMode ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </section>

        {/* Data source */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <h2 className="font-semibold text-white">Data source</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Current source:{" "}
            <span className="font-semibold text-white">
              {dataSource === "supabase"
                ? "Supabase (PostgreSQL)"
                : "Local — browser localStorage"}
            </span>
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            {supabaseConfigured
              ? "Supabase environment variables are set. Sign in below to sync with your Supabase project."
              : "Supabase is not configured (no NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). The app runs fully in local mode — no account, no keys, no cost."}
          </p>

          {supabaseConfigured && (
            <div className="mt-4">
              {supabaseUser ? (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm text-zinc-200">
                    Signed in as{" "}
                    <span className="font-semibold">{supabaseUser}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-wa"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <form className="flex flex-col gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="auth-email"
                        className="mb-1 block text-xs font-medium text-zinc-300"
                      >
                        Email
                      </label>
                      <input
                        id="auth-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-wa"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="auth-password"
                        className="mb-1 block text-xs font-medium text-zinc-300"
                      >
                        Password
                      </label>
                      <input
                        id="auth-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="6+ characters"
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-wa"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={authBusy}
                      onClick={(e) => void onAuth(e, "signin")}
                      className="rounded-xl bg-wa px-4 py-2.5 text-sm font-semibold text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
                    >
                      {authBusy ? "Working…" : "Sign in"}
                    </button>
                    <button
                      type="button"
                      disabled={authBusy}
                      onClick={(e) => void onAuth(e, "signup")}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-wa disabled:opacity-50"
                    >
                      Create account
                    </button>
                  </div>
                  {authMessage && (
                    <p role="status" className="text-sm text-zinc-300">
                      {authMessage}
                    </p>
                  )}
                </form>
              )}
            </div>
          )}
        </section>

        {/* Danger zone */}
        <section className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5 backdrop-blur">
          <h2 className="font-semibold text-white">Data</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Clear all local data and restore the demo dataset. This does not
            delete anything from Supabase if you are signed in.
          </p>
          {confirmClear ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  clearAllData();
                  setConfirmClear(false);
                }}
                className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Yes, clear all local data
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-wa"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="mt-3 rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-2.5 text-sm font-semibold text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              Clear all data
            </button>
          )}
        </section>

        {/* About / limitations */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <h2 className="font-semibold text-white">
            About &amp; honest limitations
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-300">
            <li>
              <strong className="text-white">
                WhatsApp provides no official API for tracking another
                person&apos;s online/offline status.
              </strong>{" "}
              Any app claiming live WhatsApp presence tracking is either
              scraping (against WhatsApp&apos;s terms, and a ban risk) or
              faking it. This app does neither.
            </li>
            <li>
              This app has <strong className="text-white">no WhatsApp
              connection at all</strong>: no QR pairing, no passwords, no
              auth codes, no session cookies, no scraping. It never asks for
              your WhatsApp credentials.
            </li>
            <li>
              Data comes from exactly two sources:{" "}
              <strong className="text-white">(1) Demo mode</strong> —
              simulated data, bannered on every page;{" "}
              <strong className="text-white">(2) Manual log</strong> —
              status changes you personally observed, only for contacts
              whose consent status is “granted”.
            </li>
            <li>
              Email alerts are a stored preference only — no email is sent,
              because sending email requires a paid service. Browser
              notifications are real and work locally.
            </li>
            <li>
              Everything here runs free: local mode needs nothing; the
              optional Supabase free tier and Vercel hobby tier need no
              payment card.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
