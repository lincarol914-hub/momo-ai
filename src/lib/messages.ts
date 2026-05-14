import type { Lead } from "./leads";
import type { Quote } from "./pricing";
import { formatGBP } from "./pricing";

export type MessageChannel = "email" | "sms";
export type MessageStatus = "queued" | "sent" | "failed";
export type MessageTemplate =
  | "welcome_with_quote"
  | "meeting_confirmation"
  | "follow_up_no_reply"
  | "renewal_reminder"
  | "claims_acknowledgement"
  | "custom";

export interface Message {
  id: string;
  leadId: string;
  channel: MessageChannel;
  to: string;
  at: string;
  subject?: string;
  body: string;
  template: MessageTemplate;
  status: MessageStatus;
}

const KEY = "momo:messages";

export function loadMessages(): Message[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as Message[];
  } catch {
    return [];
  }
}

export function saveMessages(msgs: Message[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(msgs));
  } catch {
    // ignore
  }
}

export function queueMessage(m: Omit<Message, "id" | "at" | "status"> & { status?: MessageStatus }): Message {
  const all = loadMessages();
  const msg: Message = {
    id: `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    status: m.status ?? "sent", // simulated send - swap with real ESP later
    ...m,
  };
  all.unshift(msg);
  saveMessages(all);
  return msg;
}

export function messagesForLead(leadId: string): Message[] {
  return loadMessages().filter((m) => m.leadId === leadId);
}

export function renderWelcomeWithQuote(lead: Lead, quote: Quote): { subject: string; body: string } {
  const first = lead.contactName.split(" ")[0] || "there";
  const essentials = quote.lines.filter((l) => l.priority === "Essential").slice(0, 4);
  const linesText = essentials
    .map((l) => `  • ${l.productLabel} - ${formatGBP(l.annualPremium)}/yr (${l.insurer}, limit ${formatGBP(l.limit)})`)
    .join("\n");

  return {
    subject: `${lead.companyName} · your Momo cover plan (${formatGBP(quote.totalAnnualPremium)}/yr)`,
    body: [
      `Hi ${first},`,
      "",
      `Thanks for running an analysis with Momo. Our AI underwriter has put together an initial cover plan for ${lead.companyName} based on what you told us.`,
      "",
      `Total indicative premium: ${formatGBP(quote.totalAnnualPremium)} per year (${formatGBP(quote.totalMonthlyPremium)}/month).`,
      "",
      "Essential cover we'd put in place first:",
      linesText || "  • Standard cover for your sector.",
      "",
      `Quote reference: ${quote.id} - valid until ${new Date(quote.validUntil).toLocaleDateString()}.`,
      "",
      `We've also pencilled in a 30-minute review call to walk you through it (see calendar invite).`,
      "",
      "Reply to this email if you'd like to bind cover or change anything.",
      "",
      "Best,",
      "Momo Autopilot",
    ].join("\n"),
  };
}

export function renderMeetingConfirmation(lead: Lead, when: Date): { subject: string; body: string } {
  return {
    subject: `Confirmed: Momo review call with ${lead.companyName}`,
    body: [
      `Hi ${lead.contactName.split(" ")[0] || "there"},`,
      "",
      `Your insurance review is confirmed for ${when.toLocaleString()}.`,
      "We'll send a calendar invite separately. If the time doesn't work, reply and we'll reschedule.",
      "",
      "Best,",
      "Momo Autopilot",
    ].join("\n"),
  };
}

export function renderFollowUp(lead: Lead): { subject: string; body: string } {
  return {
    subject: `Quick nudge - ${lead.companyName}`,
    body: [
      `Hi ${lead.contactName.split(" ")[0] || "there"},`,
      "",
      "Just checking in on the insurance plan we sent over. Happy to answer any questions or tweak limits / deductibles.",
      "If you'd like to move forward, reply and we'll bind cover from the date you choose.",
      "",
      "Best,",
      "Momo Autopilot",
    ].join("\n"),
  };
}

export function renderRenewalReminder(lead: Lead, renewalDate: Date): { subject: string; body: string } {
  return {
    subject: `Renewal coming up - ${lead.companyName}`,
    body: [
      `Hi ${lead.contactName.split(" ")[0] || "there"},`,
      "",
      `Your renewal is approaching on ${renewalDate.toLocaleDateString()}. We're already preparing your submission so there's no last-minute scramble.`,
      "You'll get an updated quote two weeks before renewal - reply if there's anything material that's changed.",
      "",
      "Best,",
      "Momo Autopilot",
    ].join("\n"),
  };
}
