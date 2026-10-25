"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div>
        <p className="font-medium text-white">{label}</p>
        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
          checked ? "bg-wa" : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function NotificationsPage() {
  const { ready, prefs, setPrefs } = useStore();
  const [permission, setPermission] = useState<string>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported"
  );
  const [message, setMessage] = useState<string | null>(null);

  async function enableBrowserNotifications() {
    if (!("Notification" in window)) {
      setMessage("This browser does not support notifications.");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      setPrefs({ browserNotifications: true });
      setMessage("Browser notifications enabled.");
    } else {
      setPrefs({ browserNotifications: false });
      setMessage("Permission was not granted — notifications stay off.");
    }
  }

  function sendTest() {
    if (!("Notification" in window)) {
      setMessage("This browser does not support notifications.");
      return;
    }
    if (Notification.permission !== "granted") {
      setMessage("Grant browser permission first, then test again.");
      return;
    }
    new Notification("WA Activity Monitor", {
      body: "Test notification — this is how a status alert will look.",
    });
    setMessage("Test notification sent.");
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
      <h1 className="text-2xl font-bold text-white">Notifications</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Alerts fire only for status changes you log manually — never for
        fabricated events.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <Toggle
          checked={prefs.browserNotifications}
          onChange={(v) => {
            if (v) {
              void enableBrowserNotifications();
            } else {
              setPrefs({ browserNotifications: false });
            }
          }}
          label="Browser notifications"
          description="When you log a status change manually, show a real browser notification. Requires browser permission."
        />

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <p className="text-sm text-zinc-400">
            Browser permission status:{" "}
            <span className="font-semibold text-zinc-200">{permission}</span>
          </p>
          <button
            type="button"
            onClick={sendTest}
            className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-wa"
          >
            Send test notification
          </button>
        </div>

        <Toggle
          checked={prefs.emailAlerts}
          onChange={(v) => setPrefs({ emailAlerts: v })}
          label="Email alerts"
          description="Store your preference and address. Email delivery is NOT wired — this app uses no paid email service, so no email will actually be sent."
        />

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <label
            htmlFor="alert-email"
            className="mb-1 block text-xs font-medium text-zinc-300"
          >
            Email address for alerts (stored locally only)
          </label>
          <input
            id="alert-email"
            type="email"
            value={prefs.emailAddress}
            onChange={(e) => setPrefs({ emailAddress: e.target.value })}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-wa"
          />
          <p className="mt-2 text-xs leading-relaxed text-amber-200/80">
            Note: email alerts are a settings preference only. No email is
            sent by this app — wiring a real sender would require a paid
            service, which this project deliberately avoids.
          </p>
        </div>

        {message && (
          <p role="status" className="text-sm text-wa">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
