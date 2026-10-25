import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ActivityEvent, Contact } from "./types";

/**
 * OPTIONAL Supabase integration — completely inert unless both env vars are set:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * When unconfigured, every helper below returns null / a clear "not configured"
 * result and the app runs in local mode (localStorage). Auth is never faked.
 */

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );
  }
  return client;
}

export async function getSessionEmail(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  return data.session.user.email ?? null;
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ ok: boolean; message: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "Supabase is not configured." };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Signed in." };
}

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<{ ok: boolean; message: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "Supabase is not configured." };
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, message: error.message };
  return {
    ok: true,
    message: "Account created. Check your email to confirm, then sign in.",
  };
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  if (supabase) await supabase.auth.signOut();
}

/* ---- Table CRUD (tables defined in supabase/schema.sql) ---- */

function toContactRow(c: Contact) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    consent_status: c.consentStatus,
    notes: c.notes,
  };
}

function fromContactRow(row: Record<string, unknown>): Contact {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    phone: String(row.phone ?? ""),
    consentStatus: (row.consent_status as Contact["consentStatus"]) ?? "pending",
    notes: String(row.notes ?? ""),
  };
}

function toEventRow(e: ActivityEvent) {
  return {
    id: e.id,
    contact_id: e.contactId,
    type: e.type,
    observed_at: e.observedAt,
    source: e.source,
    note: e.note,
  };
}

function fromEventRow(row: Record<string, unknown>): ActivityEvent {
  return {
    id: String(row.id),
    contactId: String(row.contact_id),
    type: (row.type as ActivityEvent["type"]) ?? "offline",
    observedAt: String(row.observed_at),
    source: (row.source as ActivityEvent["source"]) ?? "manual",
    note: String(row.note ?? ""),
  };
}

export async function fetchContacts(): Promise<Contact[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromContactRow);
}

export async function fetchEvents(): Promise<ActivityEvent[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("activity_events")
    .select("*")
    .order("observed_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromEventRow);
}

export async function insertContactRow(c: Contact): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("contacts").insert(toContactRow(c));
  if (error) throw new Error(error.message);
}

export async function deleteContactRow(id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function insertEventRow(e: ActivityEvent): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("activity_events").insert(toEventRow(e));
  if (error) throw new Error(error.message);
}
