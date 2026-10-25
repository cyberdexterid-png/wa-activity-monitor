"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/history", label: "Activity History", icon: "🕘" },
  { href: "/notifications", label: "Notifications", icon: "🔔" },
  { href: "/contacts", label: "Contacts", icon: "👥" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1 p-3">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-wa ${
              active
                ? "bg-wa/15 text-wa ring-1 ring-wa/40"
                : "text-zinc-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span aria-hidden="true" className="text-lg">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/10 bg-ink/90 px-4 py-3 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-lg text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-wa"
        >
          ☰
        </button>
        <span className="text-base font-bold text-white">
          WA <span className="text-wa">Activity Monitor</span>
        </span>
      </div>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-black/30 md:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-lg font-bold leading-tight text-white">
            WA <span className="text-wa">Activity Monitor</span>
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Consent-based activity log
          </p>
        </div>
        <NavLinks />
        <div className="mt-auto p-4 text-xs leading-relaxed text-zinc-500">
          No WhatsApp connection. Data is demo data or manually logged with
          consent only.
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="flex h-full w-72 flex-col bg-zinc-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Navigation menu"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <p className="text-base font-bold text-white">
                WA <span className="text-wa">Activity Monitor</span>
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-wa"
              >
                ✕
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
