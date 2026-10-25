"use client";

import { useStore } from "@/lib/store";

/** Shown on every page while demo mode is on. */
export default function DemoBanner() {
  const { ready, prefs } = useStore();
  if (!ready || !prefs.demoMode) return null;
  return (
    <div
      role="note"
      className="sticky top-0 z-40 border-b border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-center text-xs font-semibold text-yellow-200 sm:text-sm"
    >
      DEMO DATA — not real WhatsApp activity. Turn demo mode off in Settings
      to see only your own manually logged data.
    </div>
  );
}
