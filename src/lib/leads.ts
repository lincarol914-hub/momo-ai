// Tiny localStorage-backed lead store used as a CRM placeholder.
export type LeadType =
  | "insurance_analysis"
  | "contact"
  | "broker"
  | "investor"
  | "partner";

export type LeadStatus =
  | "New"
  | "Reviewed"
  | "Contacted"
  | "Call booked"
  | "Sent to Momo Growth OS"
  | "Sent to Momo Risk OS"
  | "Sent to Momo Acquire OS"
  | "Closed";

export const LEAD_STATUSES: LeadStatus[] = [
  "New",
  "Reviewed",
  "Contacted",
  "Call booked",
  "Sent to Momo Growth OS",
  "Sent to Momo Risk OS",
  "Sent to Momo Acquire OS",
  "Closed",
];

export interface Lead {
  id: string;
  type: LeadType;
  createdAt: string;
  status: LeadStatus;
  owner?: string;
  notes?: string;
  // Display
  name?: string;
  company?: string;
  email?: string;
  // Scoring
  leadScore?: number; // 0–100
  urgency?: "Low" | "Medium" | "High";
  nextAction?: string;
  // Free payload
  payload: Record<string, unknown>;
}

const KEY = "atlas.leads.v1";

function read(): Lead[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Lead[];
  } catch {
    return [];
  }
}

function write(leads: Lead[]) {
  localStorage.setItem(KEY, JSON.stringify(leads));
  window.dispatchEvent(new CustomEvent("atlas:leads-updated"));
}

export function getLeads(): Lead[] {
  return read().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function saveLead(lead: Omit<Lead, "id" | "createdAt" | "status"> & { status?: LeadStatus }): Lead {
  const leads = read();
  const full: Lead = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: lead.status ?? "New",
    ...lead,
  };
  leads.push(full);
  write(leads);
  return full;
}

export function updateLead(id: string, patch: Partial<Lead>) {
  const leads = read().map((l) => (l.id === id ? { ...l, ...patch } : l));
  write(leads);
}

export function deleteLead(id: string) {
  write(read().filter((l) => l.id !== id));
}

export function clearLeads() {
  write([]);
}
