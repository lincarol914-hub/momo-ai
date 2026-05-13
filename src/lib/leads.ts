import type { AnalysisInput, Report } from "./analyzer";

export type LeadStatus = "new" | "contacted" | "meeting-booked" | "won" | "lost";

export interface MeetingBooking {
  at: string;
  durationMinutes: number;
  topic: string;
}

export interface Lead {
  id: string;
  createdAt: string;
  companyName: string;
  contactName: string;
  email: string;
  country: string;
  industry: string;
  website?: string;
  riskScore: number;
  leadScore: number;
  urgency: "Low" | "Medium" | "High";
  essentialProducts: string[];
  nextAction: string;
  status: LeadStatus;
  notes: string;
  meeting?: MeetingBooking;
  lastContactedAt?: string;
  rawInput: AnalysisInput;
  rawReport: Report;
}

const KEY = "momo:leads";

export function loadLeads(): Lead[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Lead[]) : [];
  } catch {
    return [];
  }
}

export function saveLeads(leads: Lead[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(leads));
  } catch {
    // storage may be unavailable; ignore
  }
}

export function upsertLead(lead: Lead) {
  const all = loadLeads();
  const i = all.findIndex((l) => l.id === lead.id);
  if (i >= 0) all[i] = lead;
  else all.unshift(lead);
  saveLeads(all);
  return all;
}

export function deleteLead(id: string) {
  const all = loadLeads().filter((l) => l.id !== id);
  saveLeads(all);
  return all;
}

export function createLeadFromAnalysis(input: AnalysisInput, report: Report): Lead {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    createdAt: new Date().toISOString(),
    companyName: input.companyName,
    contactName: input.contactName,
    email: input.email,
    country: input.country,
    industry: input.industry,
    website: input.website,
    riskScore: report.scoring.riskScore,
    leadScore: report.scoring.leadScore,
    urgency: report.scoring.urgency,
    essentialProducts: report.products
      .filter((p) => p.priority === "Essential")
      .map((p) => p.label),
    nextAction: report.scoring.nextAction,
    status: "new",
    notes: "",
    rawInput: input,
    rawReport: report,
  };
}
