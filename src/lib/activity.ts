export type ActivityType =
  | "analysis_run"
  | "quote_created"
  | "email_sent"
  | "sms_sent"
  | "meeting_booked"
  | "meeting_rescheduled"
  | "meeting_reminder_scheduled"
  | "renewal_scheduled"
  | "document_uploaded"
  | "document_summarised"
  | "status_changed"
  | "note_added"
  | "claim_notified"
  | "policy_issued";

export type ActivityActor = "ai" | "operator" | "customer";

export interface ActivityEvent {
  id: string;
  leadId: string;
  at: string;
  type: ActivityType;
  actor: ActivityActor;
  summary: string;
  data?: Record<string, unknown>;
}

const KEY = "momo:activity";

export function loadActivity(): ActivityEvent[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as ActivityEvent[];
  } catch {
    return [];
  }
}

export function saveActivity(events: ActivityEvent[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(events));
  } catch {
    // ignore
  }
}

export function logActivity(event: Omit<ActivityEvent, "id" | "at"> & { at?: string }): ActivityEvent {
  const all = loadActivity();
  const e: ActivityEvent = {
    id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    at: event.at ?? new Date().toISOString(),
    leadId: event.leadId,
    type: event.type,
    actor: event.actor,
    summary: event.summary,
    data: event.data,
  };
  all.unshift(e);
  saveActivity(all);
  return e;
}

export function activityForLead(leadId: string): ActivityEvent[] {
  return loadActivity().filter((e) => e.leadId === leadId);
}
