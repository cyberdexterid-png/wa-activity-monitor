"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEMO_CONTACTS, generateDemoEvents } from "./demo";
import {
  fetchContacts,
  fetchEvents,
  getSessionEmail,
  insertContactRow,
  insertEventRow,
  deleteContactRow,
  isSupabaseConfigured,
  signInWithEmail,
  signOut as supabaseSignOut,
  signUpWithEmail,
} from "./supabase";
import type {
  ActivityEvent,
  Contact,
  DataSource,
  EventType,
  Prefs,
} from "./types";
import { isDemoContact } from "./types";
import { uid } from "./utils";

const LS_KEY = "wa-activity-monitor-v1";

interface StoredState {
  contacts: Contact[];
  events: ActivityEvent[];
  prefs: Prefs;
}

const DEFAULT_PREFS: Prefs = {
  demoMode: true,
  browserNotifications: false,
  emailAlerts: false,
  emailAddress: "",
};

interface StoreValue {
  ready: boolean;
  contacts: Contact[]; // visible contacts (demo filtered by demoMode)
  allContacts: Contact[];
  events: ActivityEvent[]; // visible events
  allEvents: ActivityEvent[];
  prefs: Prefs;
  dataSource: DataSource;
  supabaseConfigured: boolean;
  supabaseUser: string | null;
  lastError: string | null;
  addContact: (
    input: Omit<Contact, "id">
  ) => Promise<{ ok: boolean; message?: string }>;
  removeContact: (id: string) => Promise<void>;
  setConsent: (
    id: string,
    status: Contact["consentStatus"]
  ) => Promise<void>;
  addEvent: (
    contactId: string,
    type: EventType,
    note: string,
    source: "manual"
  ) => Promise<{ ok: boolean; message?: string }>;
  setPrefs: (patch: Partial<Prefs>) => void;
  clearAllData: () => void;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  signUp: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  signOut: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

function readLocal(): StoredState | null {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredState;
    if (!Array.isArray(parsed.contacts) || !Array.isArray(parsed.events)) {
      return null;
    }
    return {
      contacts: parsed.contacts,
      events: parsed.events,
      prefs: { ...DEFAULT_PREFS, ...(parsed.prefs ?? {}) },
    };
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [dataSource, setDataSource] = useState<DataSource>("local");
  const [supabaseUser, setSupabaseUser] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const supabaseConfigured = isSupabaseConfigured();

  // Initial load: localStorage (or demo seed), then Supabase if signed in.
  useEffect(() => {
    const local = readLocal();
    if (local) {
      setContacts(local.contacts);
      setEvents(local.events);
      setPrefsState(local.prefs);
    } else {
      const seeded: StoredState = {
        contacts: DEMO_CONTACTS,
        events: generateDemoEvents(),
        prefs: DEFAULT_PREFS,
      };
      setContacts(seeded.contacts);
      setEvents(seeded.events);
      setPrefsState(seeded.prefs);
      try {
        window.localStorage.setItem(LS_KEY, JSON.stringify(seeded));
      } catch {
        /* storage unavailable — app still works in memory */
      }
    }
    setReady(true);

    if (supabaseConfigured) {
      getSessionEmail()
        .then(async (email) => {
          if (!email) return;
          setSupabaseUser(email);
          try {
            const [sc, se] = await Promise.all([
              fetchContacts(),
              fetchEvents(),
            ]);
            if (sc.length > 0 || se.length > 0) {
              setContacts(sc);
              setEvents(se);
            }
            setDataSource("supabase");
          } catch (e) {
            setLastError(
              `Supabase load failed (${e instanceof Error ? e.message : "unknown error"}). Showing local data. Run supabase/schema.sql in your project if tables are missing.`
            );
          }
        })
        .catch(() => {
          /* not signed in — local mode */
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist local snapshot on every change (after initial load).
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(
        LS_KEY,
        JSON.stringify({ contacts, events, prefs })
      );
    } catch {
      /* ignore */
    }
  }, [contacts, events, prefs, ready]);

  const visibleContacts = useMemo(
    () =>
      prefs.demoMode
        ? contacts
        : contacts.filter((c) => !isDemoContact(c)),
    [contacts, prefs.demoMode]
  );

  const visibleEvents = useMemo(() => {
    const ids = new Set(visibleContacts.map((c) => c.id));
    return events.filter(
      (e) =>
        ids.has(e.contactId) && (prefs.demoMode || e.source === "manual")
    );
  }, [events, visibleContacts, prefs.demoMode]);

  function fireBrowserNotification(contactName: string, type: EventType) {
    try {
      if (
        prefs.browserNotifications &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification("WA Activity Monitor", {
          body: `${contactName} is now ${type === "online" ? "Online" : "Offline"} (manually logged).`,
        });
      }
    } catch {
      /* notifications unavailable — not fatal */
    }
  }

  async function addContact(
    input: Omit<Contact, "id">
  ): Promise<{ ok: boolean; message?: string }> {
    const contact: Contact = { ...input, id: uid("c") };
    if (dataSource === "supabase") {
      try {
        await insertContactRow(contact);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Supabase insert failed.";
        setLastError(msg);
        return { ok: false, message: msg };
      }
    }
    setContacts((prev) => [...prev, contact]);
    return { ok: true };
  }

  async function removeContact(id: string): Promise<void> {
    if (dataSource === "supabase") {
      try {
        await deleteContactRow(id);
      } catch (e) {
        setLastError(e instanceof Error ? e.message : "Supabase delete failed.");
        return;
      }
    }
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setEvents((prev) => prev.filter((e) => e.contactId !== id));
  }

  async function setConsent(
    id: string,
    status: Contact["consentStatus"]
  ): Promise<void> {
    // Consent changes are kept local-only by design (privacy-sensitive).
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, consentStatus: status } : c))
    );
  }

  async function addEvent(
    contactId: string,
    type: EventType,
    note: string,
    source: "manual"
  ): Promise<{ ok: boolean; message?: string }> {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return { ok: false, message: "Contact not found." };
    if (contact.consentStatus !== "granted") {
      return {
        ok: false,
        message:
          "Manual logging is only allowed for contacts with consent status 'granted'.",
      };
    }
    const event: ActivityEvent = {
      id: uid("ev"),
      contactId,
      type,
      observedAt: new Date().toISOString(),
      source,
      note: note.trim(),
    };
    if (dataSource === "supabase") {
      try {
        await insertEventRow(event);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Supabase insert failed.";
        setLastError(msg);
        return { ok: false, message: msg };
      }
    }
    setEvents((prev) => [...prev, event]);
    fireBrowserNotification(contact.name, type);
    return { ok: true };
  }

  function setPrefs(patch: Partial<Prefs>) {
    setPrefsState((prev) => ({ ...prev, ...patch }));
  }

  function clearAllData() {
    try {
      window.localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
    setContacts(DEMO_CONTACTS);
    setEvents(generateDemoEvents());
    setPrefsState(DEFAULT_PREFS);
    setLastError(null);
  }

  async function signIn(email: string, password: string) {
    const res = await signInWithEmail(email, password);
    if (res.ok) {
      setSupabaseUser(email);
      try {
        const [sc, se] = await Promise.all([fetchContacts(), fetchEvents()]);
        if (sc.length > 0 || se.length > 0) {
          setContacts(sc);
          setEvents(se);
        }
        setDataSource("supabase");
      } catch (e) {
        setLastError(
          e instanceof Error ? e.message : "Supabase load failed."
        );
      }
    }
    return res;
  }

  async function signUp(email: string, password: string) {
    return signUpWithEmail(email, password);
  }

  async function signOut() {
    await supabaseSignOut();
    setSupabaseUser(null);
    setDataSource("local");
  }

  const value: StoreValue = {
    ready,
    contacts: visibleContacts,
    allContacts: contacts,
    events: visibleEvents,
    allEvents: events,
    prefs,
    dataSource,
    supabaseConfigured,
    supabaseUser,
    lastError,
    addContact,
    removeContact,
    setConsent,
    addEvent,
    setPrefs,
    clearAllData,
    signIn,
    signUp,
    signOut,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}
