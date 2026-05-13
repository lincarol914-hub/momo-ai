import type { Lead } from "./leads";

export interface Slot {
  start: Date;
  durationMinutes: number;
  label: string;
}

function rollToBusinessDay(d: Date): Date {
  const r = new Date(d);
  while (r.getDay() === 0 || r.getDay() === 6) r.setDate(r.getDate() + 1);
  return r;
}

function atHour(d: Date, hour: number): Date {
  const r = new Date(d);
  r.setHours(hour, 0, 0, 0);
  return r;
}

// AI-style scheduling heuristic: urgency drives how soon and how dense the suggestions are.
export function suggestSlots(urgency: "Low" | "Medium" | "High"): Slot[] {
  const now = new Date();
  const config: Array<{ days: number; hour: number }> =
    urgency === "High"
      ? [
          { days: 1, hour: 10 },
          { days: 2, hour: 14 },
          { days: 3, hour: 11 },
        ]
      : urgency === "Medium"
      ? [
          { days: 3, hour: 10 },
          { days: 7, hour: 14 },
          { days: 10, hour: 16 },
        ]
      : [
          { days: 7, hour: 11 },
          { days: 14, hour: 14 },
          { days: 21, hour: 10 },
        ];

  return config.map(({ days, hour }) => {
    let d = new Date(now);
    d.setDate(d.getDate() + days);
    d = rollToBusinessDay(d);
    d = atHour(d, hour);
    return {
      start: d,
      durationMinutes: 30,
      label: d.toLocaleString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      }),
    };
  });
}

function fmtICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function buildICS(lead: Lead, start: Date, durationMinutes = 30): string {
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Momo AI//Insurance Review//EN",
    "BEGIN:VEVENT",
    `UID:${lead.id}@momo.ai`,
    `DTSTAMP:${fmtICSDate(new Date())}`,
    `DTSTART:${fmtICSDate(start)}`,
    `DTEND:${fmtICSDate(end)}`,
    `SUMMARY:Momo · Insurance review with ${escapeICS(lead.companyName)}`,
    `DESCRIPTION:${escapeICS(
      `Insurance review call with ${lead.contactName}. Risk score ${lead.riskScore}/100. Urgency: ${lead.urgency}.`
    )}`,
    `ATTENDEE;CN=${escapeICS(lead.contactName)}:mailto:${lead.email}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function escapeICS(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function downloadICS(lead: Lead, start: Date, durationMinutes = 30) {
  const ics = buildICS(lead, start, durationMinutes);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const slug = lead.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  a.href = url;
  a.download = `momo-${slug || "review"}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function googleCalendarUrl(lead: Lead, start: Date, durationMinutes = 30): string {
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Momo · Insurance review with ${lead.companyName}`,
    dates: `${fmtICSDate(start)}/${fmtICSDate(end)}`,
    details: `Insurance review call with ${lead.contactName}. Risk score ${lead.riskScore}/100. Urgency: ${lead.urgency}.`,
    add: lead.email,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
