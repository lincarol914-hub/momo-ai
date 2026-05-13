import type { Lead } from "./leads";

// AI-style assistant. Today this is deterministic (templates + heuristics) so it
// works offline. The function shapes are designed to be swappable with a real
// model call later — keep the inputs/outputs stable.

export interface DraftedEmail {
  subject: string;
  body: string;
}

export function draftFollowUpEmail(lead: Lead): DraftedEmail {
  const first = lead.contactName.split(" ")[0] || "there";
  const subject =
    lead.urgency === "High"
      ? `${lead.companyName} · time-sensitive insurance review`
      : `${lead.companyName} · your Momo insurance analysis`;

  const products =
    lead.essentialProducts.slice(0, 4).map((p) => `  • ${p}`).join("\n") ||
    "  • Standard cover for your sector.";

  const urgencyLine =
    lead.urgency === "High"
      ? "Your profile flagged a high-urgency score, so I'd suggest a short call this week to walk through the priorities."
      : lead.urgency === "Medium"
      ? "There's no rush, but the next couple of weeks would be a good time to review options before any renewals tighten."
      : "Happy to set up a relaxed walk-through in the next month or so.";

  const meetingLine = lead.meeting
    ? `Looking forward to our chat on ${new Date(lead.meeting.at).toLocaleString()}.`
    : `If you'd like to book a slot, you can do it here: https://momo.ai/contact?company=${encodeURIComponent(lead.companyName)}&email=${encodeURIComponent(lead.email)}&topic=insurance-review`;

  const body = [
    `Hi ${first},`,
    "",
    `Thanks for running an analysis with Momo. Based on what you shared about ${lead.companyName} (${lead.industry}${lead.country ? `, ${lead.country}` : ""}), a few things stood out:`,
    "",
    "Essential cover we'd prioritise:",
    products,
    "",
    urgencyLine,
    "",
    meetingLine,
    "",
    "Best,",
    "The Momo team",
  ].join("\n");

  return { subject, body };
}

export function mailtoLink(lead: Lead, email: DraftedEmail): string {
  return `mailto:${lead.email}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
}

export interface PipelineInsight {
  totalLeads: number;
  byUrgency: { high: number; medium: number; low: number };
  topIndustries: Array<{ industry: string; count: number }>;
  unconnectedHighUrgency: number;
  averageRiskScore: number;
  meetingsBooked: number;
  suggestedActions: string[];
}

export function pipelineInsights(leads: Lead[]): PipelineInsight {
  const total = leads.length;
  const byUrgency = {
    high: leads.filter((l) => l.urgency === "High").length,
    medium: leads.filter((l) => l.urgency === "Medium").length,
    low: leads.filter((l) => l.urgency === "Low").length,
  };

  const industryCounts = new Map<string, number>();
  for (const l of leads) industryCounts.set(l.industry, (industryCounts.get(l.industry) ?? 0) + 1);
  const topIndustries = Array.from(industryCounts.entries())
    .map(([industry, count]) => ({ industry, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const unconnectedHighUrgency = leads.filter((l) => l.urgency === "High" && l.status === "new").length;
  const meetingsBooked = leads.filter((l) => l.status === "meeting-booked").length;
  const averageRiskScore = total
    ? Math.round(leads.reduce((acc, l) => acc + l.riskScore, 0) / total)
    : 0;

  const actions: string[] = [];
  if (unconnectedHighUrgency > 0) {
    actions.push(
      `Contact ${unconnectedHighUrgency} high-urgency lead${unconnectedHighUrgency === 1 ? "" : "s"} that haven't been followed up.`
    );
  }
  if (meetingsBooked > 0) {
    actions.push(
      `${meetingsBooked} review call${meetingsBooked === 1 ? " is" : "s are"} on the calendar — prep notes the day before.`
    );
  }
  const week = 7 * 24 * 60 * 60 * 1000;
  const stale = leads.filter(
    (l) => l.status === "contacted" && l.lastContactedAt && Date.now() - Date.parse(l.lastContactedAt) > week
  ).length;
  if (stale > 0) {
    actions.push(`${stale} contacted lead${stale === 1 ? "" : "s"} haven't replied in over a week — consider a nudge.`);
  }
  if (!actions.length && total > 0) actions.push("All leads are on track. Good time to refine intake questions.");
  if (!total) actions.push("No leads yet. Share the analysis page to start capturing prospects.");

  return {
    totalLeads: total,
    byUrgency,
    topIndustries,
    unconnectedHighUrgency,
    averageRiskScore,
    meetingsBooked,
    suggestedActions: actions,
  };
}

// Heuristic "hot lead" score (0–100): combines lead score, urgency, freshness,
// and whether they handle sensitive data / sell to the US.
export function hotLeadScore(lead: Lead): number {
  let score = lead.leadScore * 0.6 + lead.riskScore * 0.25;
  if (lead.urgency === "High") score += 10;
  if (lead.urgency === "Medium") score += 4;
  const ageDays = (Date.now() - Date.parse(lead.createdAt)) / (24 * 60 * 60 * 1000);
  if (ageDays < 1) score += 6;
  else if (ageDays < 3) score += 3;
  else if (ageDays > 14) score -= 5;
  if (lead.rawInput.sellsToUS) score += 3;
  if (lead.rawInput.handlesSensitiveData) score += 3;
  if (lead.status === "meeting-booked") score += 5;
  if (lead.status === "won") score = 100;
  if (lead.status === "lost") score = Math.min(score, 20);
  return Math.max(0, Math.min(100, Math.round(score)));
}
