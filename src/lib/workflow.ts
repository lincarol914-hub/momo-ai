import type { AnalysisInput, Report } from "./analyzer";
import {
  type Lead,
  createLeadFromAnalysis,
  loadLeads,
  upsertLead,
} from "./leads";
import { buildQuote, upsertQuote, type Quote } from "./pricing";
import {
  queueMessage,
  renderMeetingConfirmation,
  renderRenewalReminder,
  renderWelcomeWithQuote,
  type Message,
} from "./messages";
import { logActivity } from "./activity";
import { suggestSlots } from "./scheduler";

export interface AutopilotResult {
  lead: Lead;
  quote: Quote;
  messages: Message[];
  meeting: { at: string; durationMinutes: number };
  renewalScheduledAt?: string;
}

// Runs the full autonomous workflow after a customer submits an analysis.
// Order matters: lead → quote → meeting → emails → renewal → activity.
export function runAutopilot(input: AnalysisInput, report: Report): AutopilotResult {
  // 1. Lead
  let lead = createLeadFromAnalysis(input, report);
  upsertLead(lead);
  logActivity({
    leadId: lead.id,
    type: "analysis_run",
    actor: "customer",
    summary: `Analysis submitted by ${lead.contactName} (${lead.email}).`,
  });

  // 2. AI underwriter generates a quote
  const quote = buildQuote(lead);
  upsertQuote(quote);
  logActivity({
    leadId: lead.id,
    type: "quote_created",
    actor: "ai",
    summary: `Generated quote ${quote.id} with ${quote.lines.length} lines totalling £${quote.totalAnnualPremium.toLocaleString()}/yr.`,
    data: { quoteId: quote.id, total: quote.totalAnnualPremium },
  });

  // 3. AI scheduler auto-books a meeting (top slot by urgency)
  const slots = suggestSlots(lead.urgency);
  const slot = slots[0];
  const meetingAt = slot.start.toISOString();
  lead = {
    ...lead,
    status: "meeting-booked",
    meeting: {
      at: meetingAt,
      durationMinutes: slot.durationMinutes,
      topic: `Insurance review with ${lead.companyName}`,
    },
  };
  upsertLead(lead);
  logActivity({
    leadId: lead.id,
    type: "meeting_booked",
    actor: "ai",
    summary: `Auto-booked 30-minute review for ${slot.label} based on ${lead.urgency} urgency.`,
    data: { at: meetingAt },
  });

  // 4. Autopilot sends a welcome email with the quote, and a meeting confirmation
  const messages: Message[] = [];
  const welcome = renderWelcomeWithQuote(lead, quote);
  messages.push(
    queueMessage({
      leadId: lead.id,
      channel: "email",
      to: lead.email,
      subject: welcome.subject,
      body: welcome.body,
      template: "welcome_with_quote",
    })
  );
  logActivity({
    leadId: lead.id,
    type: "email_sent",
    actor: "ai",
    summary: `Sent welcome email with quote ${quote.id} to ${lead.email}.`,
  });

  const confirm = renderMeetingConfirmation(lead, slot.start);
  messages.push(
    queueMessage({
      leadId: lead.id,
      channel: "email",
      to: lead.email,
      subject: confirm.subject,
      body: confirm.body,
      template: "meeting_confirmation",
    })
  );
  logActivity({
    leadId: lead.id,
    type: "email_sent",
    actor: "ai",
    summary: `Sent meeting confirmation to ${lead.email}.`,
  });

  // 5. Schedule a renewal reminder if we have a renewal date
  let renewalScheduledAt: string | undefined;
  if (input.renewalDate) {
    const renewal = new Date(input.renewalDate);
    if (!Number.isNaN(renewal.getTime())) {
      const remindAt = new Date(renewal.getTime() - 30 * 24 * 60 * 60 * 1000);
      renewalScheduledAt = remindAt.toISOString();
      const renewalEmail = renderRenewalReminder(lead, renewal);
      // queued - not sent today
      messages.push(
        queueMessage({
          leadId: lead.id,
          channel: "email",
          to: lead.email,
          subject: renewalEmail.subject,
          body: renewalEmail.body,
          template: "renewal_reminder",
          status: "queued",
        })
      );
      logActivity({
        leadId: lead.id,
        type: "renewal_scheduled",
        actor: "ai",
        summary: `Renewal reminder scheduled for ${remindAt.toLocaleDateString()} (30 days before ${renewal.toLocaleDateString()}).`,
        data: { sendAt: renewalScheduledAt },
      });
    }
  }

  // 6. Final meeting reminder hook (we'd send 24h before - log the intent)
  logActivity({
    leadId: lead.id,
    type: "meeting_reminder_scheduled",
    actor: "ai",
    summary: `Reminder scheduled 24h before the review (${slot.label}).`,
  });

  return {
    lead,
    quote,
    messages,
    meeting: { at: meetingAt, durationMinutes: slot.durationMinutes },
    renewalScheduledAt,
  };
}

// AI document review - runs when policy docs are uploaded. Mocks a summary
// based on filename so the UX behaves like a real reviewer.
export function reviewUploadedDocument(filename: string): {
  headline: string;
  flags: string[];
  gaps: string[];
} {
  const name = filename.toLowerCase();
  const flags: string[] = [];
  const gaps: string[] = [];
  let headline = "Standard wording detected. No immediate red flags.";
  if (name.includes("cyber")) {
    headline = "Cyber wording detected.";
    flags.push("Sub-limits for social engineering may be capped at £100k.");
    gaps.push("Check whether business interruption waiting period exceeds 12 hours.");
  }
  if (name.includes("pi") || name.includes("indemnity")) {
    headline = "Professional indemnity wording detected.";
    flags.push("Aggregate vs each-and-every-claim basis should be confirmed.");
    gaps.push("US/Canada jurisdiction clause not yet verified.");
  }
  if (name.includes("d&o") || name.includes("directors")) {
    headline = "D&O wording detected.";
    flags.push("Side A standalone limit not visible from filename.");
    gaps.push("Confirm investigation costs trigger.");
  }
  if (flags.length === 0) {
    flags.push("Wording type not identified from filename - full review pending.");
    gaps.push("Submit document to underwriter for line-by-line review.");
  }
  return { headline, flags, gaps };
}

// Operator command - re-runs autopilot for an existing lead (e.g. after edits).
export function regenerateQuoteForLead(leadId: string): Quote | null {
  const lead = loadLeads().find((l) => l.id === leadId);
  if (!lead) return null;
  const q = buildQuote(lead);
  upsertQuote(q);
  logActivity({
    leadId: lead.id,
    type: "quote_created",
    actor: "operator",
    summary: `Quote re-generated by operator. New total £${q.totalAnnualPremium.toLocaleString()}/yr.`,
    data: { quoteId: q.id },
  });
  return q;
}
