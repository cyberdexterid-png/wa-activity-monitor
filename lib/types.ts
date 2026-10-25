export type ConsentStatus = "granted" | "pending" | "revoked";

export interface Contact {
  id: string;
  name: string;
  phone: string;
  consentStatus: ConsentStatus;
  notes: string;
}

export type EventType = "online" | "offline";
export type EventSource = "manual" | "demo";

export interface ActivityEvent {
  id: string;
  contactId: string;
  type: EventType;
  observedAt: string; // ISO string
  source: EventSource;
  note: string;
}

export interface Prefs {
  demoMode: boolean;
  browserNotifications: boolean;
  emailAlerts: boolean;
  emailAddress: string;
}

export type DataSource = "local" | "supabase";

/** Demo contacts use ids prefixed with "demo-" so they can be hidden when demo mode is off. */
export function isDemoContact(contact: Contact): boolean {
  return contact.id.startsWith("demo-");
}
