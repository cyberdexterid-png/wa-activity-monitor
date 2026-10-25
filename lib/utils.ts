import type { ActivityEvent } from "./types";

/** Format an ISO timestamp as a readable date, e.g. "Oct 25, 2026". */
export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format an ISO timestamp as a time, e.g. "09:41 AM". */
export function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "Oct 25, 2026, 09:41 AM" */
export function fmtDateTime(iso: string): string {
  return `${fmtDate(iso)}, ${fmtTime(iso)}`;
}

/** Minutes between two ISO timestamps (never negative). */
export function minutesBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(ms / 60000));
}

/** "1h 24m" / "45m" / "0m" */
export function fmtMinutes(total: number): string {
  if (total <= 0) return "0m";
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Relative label like "5m ago", "2h ago", "3d ago". */
export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "just now";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/** Events for one contact, oldest first. */
export function sortedEvents(
  events: ActivityEvent[],
  contactId: string
): ActivityEvent[] {
  return events
    .filter((e) => e.contactId === contactId)
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt));
}

/**
 * Count observed online sessions: an "online" event that follows an "offline"
 * event, or the first event if it is "online" (session already in progress
 * when observation began).
 */
export function countSessions(events: ActivityEvent[]): number {
  const sorted = [...events].sort((a, b) =>
    a.observedAt.localeCompare(b.observedAt)
  );
  let count = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].type === "online" && (i === 0 || sorted[i - 1].type === "offline")) {
      count++;
    }
  }
  return count;
}

/**
 * Total online minutes inside a time window. Completed online→offline pairs
 * count fully; an open session (last event online) counts up to `now`.
 */
export function onlineMinutesInWindow(
  events: ActivityEvent[],
  windowStart: Date,
  now: Date
): number {
  const sorted = [...events]
    .filter((e) => new Date(e.observedAt).getTime() >= windowStart.getTime())
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  let total = 0;
  let openSince: string | null = null;
  for (const e of sorted) {
    if (e.type === "online" && !openSince) openSince = e.observedAt;
    if (e.type === "offline" && openSince) {
      total += minutesBetween(openSince, e.observedAt);
      openSince = null;
    }
  }
  if (openSince) total += minutesBetween(openSince, now.toISOString());
  return total;
}

/** Sessions per day for the last `days` days (oldest → newest). */
export function sessionsPerDay(
  events: ActivityEvent[],
  days: number,
  now: Date
): { label: string; date: string; sessions: number }[] {
  const out: { label: string; date: string; sessions: number }[] = [];
  const sorted = [...events].sort((a, b) =>
    a.observedAt.localeCompare(b.observedAt)
  );
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const dayKey = day.toISOString().slice(0, 10);
    const dayEvents = sorted.filter(
      (e) => e.observedAt.slice(0, 10) === dayKey
    );
    out.push({
      label: day.toLocaleDateString(undefined, { weekday: "short" }),
      date: dayKey,
      sessions: countSessions(dayEvents),
    });
  }
  return out;
}

/** Build a CSV string for a list of events (with contact names resolved). */
export function eventsToCsv(
  events: ActivityEvent[],
  contactName: (id: string) => string
): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = [
    "contact_name,event_type,observed_at,source,note",
    ...[...events]
      .sort((a, b) => b.observedAt.localeCompare(a.observedAt))
      .map((e) =>
        [
          esc(contactName(e.contactId)),
          e.type,
          e.observedAt,
          e.source,
          esc(e.note || ""),
        ].join(",")
      ),
  ];
  return rows.join("\n");
}

/** Trigger a real file download in the browser. */
export function downloadTextFile(
  filename: string,
  text: string,
  mime = "text/csv;charset=utf-8"
): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Loose phone check: optional +, digits, spaces, dashes, parens; 7–15 digits. */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return false;
  return /^[+()\d\s-]+$/.test(phone.trim());
}
