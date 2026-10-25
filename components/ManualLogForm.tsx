"use client";

import { useState, type FormEvent } from "react";
import { useStore } from "@/lib/store";
import type { EventType } from "@/lib/types";

/**
 * Consent-based manual log: only contacts with consentStatus "granted"
 * can be logged. The user records a status change they personally observed.
 */
export default function ManualLogForm() {
  const { contacts, addEvent } = useStore();
  const granted = contacts.filter((c) => c.consentStatus === "granted");
  const [contactId, setContactId] = useState("");
  const [type, setType] = useState<EventType>("online");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  if (granted.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <h2 className="text-base font-semibold text-white">
          Log observed status
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          No contacts with granted consent yet. Add a contact on the{" "}
          <a href="/contacts" className="text-wa underline">
            Contacts
          </a>{" "}
          page and set their consent status to “granted” to enable manual
          logging.
        </p>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!contactId) {
      setMessage({ ok: false, text: "Please choose a contact." });
      return;
    }
    setBusy(true);
    const res = await addEvent(contactId, type, note, "manual");
    setBusy(false);
    if (res.ok) {
      setMessage({ ok: true, text: "Status logged successfully." });
      setNote("");
    } else {
      setMessage({ ok: false, text: res.message ?? "Could not log status." });
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
    >
      <h2 className="text-base font-semibold text-white">
        Log observed status
      </h2>
      <p className="mt-1 text-xs text-zinc-400">
        Record a status change you personally observed, for a contact who gave
        consent. This is a manual note — not a WhatsApp connection.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <div>
          <label
            htmlFor="log-contact"
            className="mb-1 block text-xs font-medium text-zinc-300"
          >
            Contact (consent granted only)
          </label>
          <select
            id="log-contact"
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-wa"
          >
            <option value="">— Choose a contact —</option>
            {granted.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="mb-1 text-xs font-medium text-zinc-300">
            Observed status
          </legend>
          <div className="flex gap-2" role="radiogroup" aria-label="Observed status">
            {(["online", "offline"] as EventType[]).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={type === t}
                onClick={() => setType(t)}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium capitalize focus:outline-none focus-visible:ring-2 focus-visible:ring-wa ${
                  type === t
                    ? t === "online"
                      ? "border-wa/60 bg-wa/15 text-wa"
                      : "border-zinc-400/60 bg-zinc-400/10 text-zinc-200"
                    : "border-white/10 bg-white/5 text-zinc-400"
                }`}
              >
                {t === "online" ? "🟢 Online" : "⚫ Offline"}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="log-note"
            className="mb-1 block text-xs font-medium text-zinc-300"
          >
            Note (optional)
          </label>
          <input
            id="log-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder="e.g. saw them come online during our chat"
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-wa"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-wa px-4 py-2.5 text-sm font-semibold text-black transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
        >
          {busy ? "Saving…" : "Log status now"}
        </button>

        {message && (
          <p
            role="status"
            className={`text-sm ${
              message.ok ? "text-wa" : "text-red-400"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
