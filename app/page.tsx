"use client";

import { useMemo, useState } from "react";
import BarChart from "@/components/BarChart";
import ManualLogForm from "@/components/ManualLogForm";
import StatusDot, { type Status } from "@/components/StatusDot";
import { useStore } from "@/lib/store";
import {
  countSessions,
  fmtDateTime,
  fmtMinutes,
  onlineMinutesInWindow,
  sessionsPerDay,
  sortedEvents,
  timeAgo,
} from "@/lib/utils";

function Glass({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur">
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const { ready, contacts, events, lastError } = useStore();
  const [selectedId, setSelectedId] = useState<string>("");

  const selected =
    contacts.find((c) => c.id === selectedId) ?? contacts[0] ?? null;

  const contactEvents = useMemo(
    () => (selected ? sortedEvents(events, selected.id) : []),
    [events, selected]
  );

  const latest = contactEvents[contactEvents.length - 1];
  const status: Status = !latest
    ? "unknown"
    : latest.type === "online"
      ? "online"
      : "offline";

  const now = useMemo(() => new Date(), []);
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayEvents = useMemo(
    () =>
      contactEvents.filter(
        (e) => new Date(e.observedAt).getTime() >= todayStart.getTime()
      ),
    [contactEvents, todayStart]
  );

  const todayMinutes = onlineMinutesInWindow(contactEvents, todayStart, now);
  const totalSessions = countSessions(contactEvents);
  const todaySessions = countSessions(todayEvents);
  const chart = sessionsPerDay(contactEvents, 7, now);

  if (!ready) {
    return (
      <div className="py-20 text-center text-zinc-400" role="status">
        Loading…
      </div>
    );
  }

  if (!selected) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-zinc-300 backdrop-blur">
          <p className="font-medium">No contacts yet.</p>
          <p className="mt-1 text-sm text-zinc-400">
            Add a contact on the{" "}
            <a href="/contacts" className="text-wa underline">
              Contacts
            </a>{" "}
            page, or turn demo mode on in{" "}
            <a href="/settings" className="text-wa underline">
              Settings
            </a>{" "}
            to preview with demo data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Status shown only from demo data or observations you logged
            yourself.
          </p>
        </div>
        <div>
          <label htmlFor="contact-select" className="sr-only">
            Select contact
          </label>
          <select
            id="contact-select"
            value={selected.id}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-wa"
          >
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {lastError && (
        <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {lastError}
        </p>
      )}

      {/* Status card */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Glass>
          <div className="flex items-center gap-3">
            <StatusDot status={status} size="lg" />
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-400">
                Current status
              </p>
              <p className="text-xl font-bold capitalize text-white">
                {status}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-zinc-400">
            {selected.name} · {selected.phone || "no phone saved"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Consent:{" "}
            <span className="font-semibold capitalize text-zinc-300">
              {selected.consentStatus}
            </span>
          </p>
        </Glass>

        <Glass>
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            Last status change
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {latest ? fmtDateTime(latest.observedAt) : "No events yet"}
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            {latest ? `${timeAgo(latest.observedAt)} · ${latest.source}` : "—"}
          </p>
        </Glass>

        <Glass>
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            Total online sessions
          </p>
          <p className="mt-2 text-3xl font-bold text-white">
            {totalSessions}
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Observed online periods
          </p>
        </Glass>

        <Glass>
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            Today
          </p>
          <p className="mt-2 text-3xl font-bold text-white">
            {fmtMinutes(todayMinutes)}
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            {todaySessions} session{todaySessions === 1 ? "" : "s"} today
          </p>
        </Glass>
      </div>

      {/* Chart + manual log */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Glass>
          <h2 className="text-base font-semibold text-white">
            Sessions per day (last 7 days)
          </h2>
          <div className="mt-4">
            {contactEvents.length === 0 ? (
              <p className="py-10 text-center text-sm text-zinc-400">
                No events yet — the chart appears once activity is logged.
              </p>
            ) : (
              <BarChart data={chart} />
            )}
          </div>
        </Glass>
        <ManualLogForm />
      </div>
    </div>
  );
}
