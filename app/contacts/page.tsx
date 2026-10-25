"use client";

import { useState, type FormEvent } from "react";
import { useStore } from "@/lib/store";
import type { ConsentStatus } from "@/lib/types";
import { isValidPhone } from "@/lib/utils";

const CONSENT_META: Record<
  ConsentStatus,
  { label: string; classes: string; hint: string }
> = {
  granted: {
    label: "Granted",
    classes: "bg-wa/15 text-wa",
    hint: "Manual logging allowed",
  },
  pending: {
    label: "Pending",
    classes: "bg-amber-400/15 text-amber-200",
    hint: "Awaiting their confirmation",
  },
  revoked: {
    label: "Revoked",
    classes: "bg-red-400/15 text-red-300",
    hint: "Logging blocked",
  },
};

export default function ContactsPage() {
  const { ready, allContacts, prefs, addContact, removeContact, setConsent } =
    useStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setFormConsent] = useState<ConsentStatus>("pending");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formOk, setFormOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const shown = prefs.demoMode
    ? allContacts
    : allContacts.filter((c) => !c.id.startsWith("demo-"));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormOk(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Name is required.");
      return;
    }
    if (trimmedName.length > 80) {
      setFormError("Name must be 80 characters or fewer.");
      return;
    }
    if (phone.trim() && !isValidPhone(phone.trim())) {
      setFormError(
        "Phone looks invalid — use digits with an optional + prefix (7–15 digits)."
      );
      return;
    }
    setBusy(true);
    const res = await addContact({
      name: trimmedName,
      phone: phone.trim(),
      consentStatus: consent,
      notes: notes.trim().slice(0, 300),
    });
    setBusy(false);
    if (res.ok) {
      setFormOk(`Contact “${trimmedName}” added.`);
      setName("");
      setPhone("");
      setNotes("");
      setFormConsent("pending");
    } else {
      setFormError(res.message ?? "Could not add contact.");
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
      <h1 className="text-2xl font-bold text-white">Contacts</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Add contacts only with their knowledge. The consent badge controls
        whether manual logging is allowed — “granted” only.
      </p>

      {/* Add form */}
      <form
        onSubmit={onSubmit}
        className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
      >
        <h2 className="text-base font-semibold text-white">Add a contact</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="contact-name"
              className="mb-1 block text-xs font-medium text-zinc-300"
            >
              Name *
            </label>
            <input
              id="contact-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              required
              placeholder="e.g. Amaya Perera"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-wa"
            />
          </div>
          <div>
            <label
              htmlFor="contact-phone"
              className="mb-1 block text-xs font-medium text-zinc-300"
            >
              Phone (optional)
            </label>
            <input
              id="contact-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+94 77 123 4567"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-wa"
            />
          </div>
          <div>
            <label
              htmlFor="contact-consent"
              className="mb-1 block text-xs font-medium text-zinc-300"
            >
              Monitoring permission
            </label>
            <select
              id="contact-consent"
              value={consent}
              onChange={(e) => setFormConsent(e.target.value as ConsentStatus)}
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-wa"
            >
              <option value="pending">Pending — awaiting confirmation</option>
              <option value="granted">Granted — they agreed</option>
              <option value="revoked">Revoked — do not monitor</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="contact-notes"
              className="mb-1 block text-xs font-medium text-zinc-300"
            >
              Notes (optional)
            </label>
            <input
              id="contact-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={300}
              placeholder="How consent was given…"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-wa"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="mt-4 rounded-xl bg-wa px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
        >
          {busy ? "Adding…" : "Add contact"}
        </button>
        {formError && (
          <p role="alert" className="mt-3 text-sm text-red-400">
            {formError}
          </p>
        )}
        {formOk && (
          <p role="status" className="mt-3 text-sm text-wa">
            {formOk}
          </p>
        )}
      </form>

      {/* List */}
      {shown.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
          <p className="font-medium text-zinc-200">No contacts yet</p>
          <p className="mt-1 text-sm text-zinc-400">
            Add your first contact above, or turn demo mode on in Settings to
            preview with demo contacts.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {shown.map((c) => {
            const meta = CONSENT_META[c.consentStatus];
            const isDemo = c.id.startsWith("demo-");
            return (
              <li
                key={c.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-white">
                      {c.name}
                      {isDemo && (
                        <span className="ml-2 rounded-full bg-yellow-400/15 px-2 py-0.5 text-[11px] font-semibold uppercase text-yellow-200">
                          Demo
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-sm text-zinc-400">
                      {c.phone || "No phone saved"}
                    </p>
                    {c.notes && (
                      <p className="mt-1 text-xs text-zinc-500">{c.notes}</p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.classes}`}
                    title={meta.hint}
                  >
                    {meta.label}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label htmlFor={`consent-${c.id}`} className="sr-only">
                    Change consent for {c.name}
                  </label>
                  <select
                    id={`consent-${c.id}`}
                    value={c.consentStatus}
                    onChange={(e) =>
                      void setConsent(c.id, e.target.value as ConsentStatus)
                    }
                    className="rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-xs text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-wa"
                  >
                    <option value="pending">Pending</option>
                    <option value="granted">Granted</option>
                    <option value="revoked">Revoked</option>
                  </select>
                  {confirmingId === c.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          void removeContact(c.id);
                          setConfirmingId(null);
                        }}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      >
                        Confirm remove
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-wa"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(c.id)}
                      className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-xs font-medium text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
