"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  downloadTextFile,
  eventsToCsv,
  fmtDate,
  fmtTime,
} from "@/lib/utils";

type Filter = "daily" | "weekly" | "monthly" | "all";
const PAGE_SIZE = 10;

const FILTER_DAYS: Record<Filter, number | null> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  all: null,
};

export default function HistoryPage() {
  const { ready, contacts, events } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const contactName = (id: string) =>
    contacts.find((c) => c.id === id)?.name ?? "Unknown contact";

  const filtered = useMemo(() => {
    const now = Date.now();
    const days = FILTER_DAYS[filter];
    const q = search.trim().toLowerCase();
    return events
      .filter((e) => {
        if (days !== null) {
          const ageDays = (now - new Date(e.observedAt).getTime()) / 86400000;
          if (ageDays > days) return false;
        }
        if (q && !contactName(e.contactId).toLowerCase().includes(q)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.observedAt.localeCompare(a.observedAt));
  }, [events, filter, search, contacts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  function onFilterChange(f: Filter) {
    setFilter(f);
    setPage(1);
  }

  function onSearchChange(v: string) {
    setSearch(v);
    setPage(1);
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
      <h1 className="text-2xl font-bold text-white">Activity History</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Chronological timeline of observed status changes. “Demo” rows are
        simulated; “Manual” rows are observations you logged yourself.
      </p>

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Time filter">
          {(["daily", "weekly", "monthly", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFilterChange(f)}
              aria-pressed={filter === f}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize focus:outline-none focus-visible:ring-2 focus-visible:ring-wa ${
                filter === f
                  ? "bg-wa text-black"
                  : "border border-white/10 bg-white/5 text-zinc-300"
              }`}
            >
              {f === "daily"
                ? "Today"
                : f === "weekly"
                  ? "Last 7 days"
                  : f === "monthly"
                    ? "Last 30 days"
                    : "All time"}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="history-search" className="sr-only">
              Search by contact name
            </label>
            <input
              id="history-search"
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by contact name…"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-wa"
            />
          </div>
          <button
            type="button"
            onClick={() =>
              downloadTextFile(
                "wa-activity-history.csv",
                eventsToCsv(filtered, contactName)
              )
            }
            disabled={filtered.length === 0}
            className="rounded-xl border border-wa/40 bg-wa/10 px-4 py-2.5 text-sm font-semibold text-wa transition hover:bg-wa/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-wa disabled:opacity-40"
          >
            ⬇ Export CSV ({filtered.length})
          </button>
        </div>
      </div>

      {/* Timeline */}
      {pageItems.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
          <p className="font-medium text-zinc-200">No events yet</p>
          <p className="mt-1 text-sm text-zinc-400">
            Events appear here once demo data is shown or you log an observed
            status change.
          </p>
        </div>
      ) : (
        <ol className="mt-6 space-y-3">
          {pageItems.map((e) => (
            <li
              key={e.id}
              className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
            >
              <span
                aria-hidden="true"
                className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                  e.type === "online" ? "bg-wa" : "bg-zinc-500"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">
                  {contactName(e.contactId)}{" "}
                  <span className="font-normal capitalize text-zinc-400">
                    went {e.type}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {fmtDate(e.observedAt)} · {fmtTime(e.observedAt)}
                </p>
                {e.note && (
                  <p className="mt-1 truncate text-xs text-zinc-500">
                    {e.note}
                  </p>
                )}
              </div>
              <span
                className={`h-fit shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                  e.source === "demo"
                    ? "bg-yellow-400/15 text-yellow-200"
                    : "bg-wa/15 text-wa"
                }`}
              >
                {e.source}
              </span>
            </li>
          ))}
        </ol>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-wa disabled:opacity-40"
          >
            ← Previous
          </button>
          <p className="text-sm text-zinc-400" role="status">
            Page {safePage} of {totalPages} · {filtered.length} event
            {filtered.length === 1 ? "" : "s"}
          </p>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-wa disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
