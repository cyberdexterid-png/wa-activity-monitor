import type { ActivityEvent, Contact } from "./types";

/**
 * DEMO DATA — clearly flagged source: "demo" on every event, and demo
 * contact ids start with "demo-". This data is simulated for previewing the
 * UI. It is NOT real WhatsApp activity.
 *
 * A fixed-seed generator keeps the demo stable across re-seeds.
 */

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEMO_CONTACTS: Contact[] = [
  {
    id: "demo-1",
    name: "Amaya Perera",
    phone: "+94 77 000 0001",
    consentStatus: "granted",
    notes: "Demo contact — consent granted for preview purposes.",
  },
  {
    id: "demo-2",
    name: "Nimal Fernando",
    phone: "+94 71 000 0002",
    consentStatus: "pending",
    notes: "Demo contact — consent still pending; manual logging blocked.",
  },
];

/** ~30 realistic demo events across the last 14 days. */
export function generateDemoEvents(now: Date = new Date()): ActivityEvent[] {
  const rand = mulberry32(20261025);
  const events: ActivityEvent[] = [];
  let n = 0;

  const push = (
    contactId: string,
    type: "online" | "offline",
    at: Date,
    note: string
  ) => {
    events.push({
      id: `demo-ev-${n++}`,
      contactId,
      type,
      observedAt: at.toISOString(),
      source: "demo",
      note,
    });
  };

  for (const contact of DEMO_CONTACTS) {
    // 14 days of history; 1-2 sessions per day, sessions 20-140 min.
    for (let d = 13; d >= 0; d--) {
      const day = new Date(now);
      day.setDate(day.getDate() - d);
      day.setHours(0, 0, 0, 0);
      const sessionsToday = d === 0 ? 1 : 1 + Math.floor(rand() * 2);
      for (let s = 0; s < sessionsToday; s++) {
        const startHour = 7 + Math.floor(rand() * 13); // 07:00-19:00
        const startMin = Math.floor(rand() * 60);
        const duration = 20 + Math.floor(rand() * 120);
        const on = new Date(day);
        on.setHours(startHour, startMin, 0, 0);
        const off = new Date(on.getTime() + duration * 60000);
        if (on.getTime() > now.getTime()) continue;
        push(contact.id, "online", on, "Demo session start");
        if (off.getTime() <= now.getTime()) {
          push(contact.id, "offline", off, "Demo session end");
        }
      }
    }
  }

  return events.sort((a, b) => a.observedAt.localeCompare(b.observedAt));
}
