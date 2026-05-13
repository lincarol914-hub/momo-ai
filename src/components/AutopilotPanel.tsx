import { useMemo, useState } from "react";
import {
  Sparkles, CheckCircle2, CalendarCheck, Mail, ShieldCheck, ExternalLink,
  Clock, Cog, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AutopilotResult } from "@/lib/workflow";
import { formatGBP } from "@/lib/pricing";
import { googleCalendarUrl, downloadICS, suggestSlots } from "@/lib/scheduler";
import { upsertLead, type Lead } from "@/lib/leads";
import { logActivity } from "@/lib/activity";
import { queueMessage, renderMeetingConfirmation } from "@/lib/messages";
import { PaymentSetup } from "./PaymentSetup";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AutopilotPanel({
  result,
  onChange,
}: {
  result: AutopilotResult;
  onChange?: (next: AutopilotResult) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [lead, setLead] = useState<Lead>(result.lead);
  const [meetingAt, setMeetingAt] = useState<Date>(new Date(result.meeting.at));
  const slots = useMemo(() => suggestSlots(lead.urgency), [lead.urgency]);

  const { quote, messages, renewalScheduledAt } = result;

  const reschedule = (when: Date) => {
    const updated: Lead = {
      ...lead,
      meeting: {
        at: when.toISOString(),
        durationMinutes: result.meeting.durationMinutes,
        topic: `Insurance review with ${lead.companyName}`,
      },
    };
    upsertLead(updated);
    setLead(updated);
    setMeetingAt(when);
    logActivity({
      leadId: lead.id,
      type: "meeting_rescheduled",
      actor: "customer",
      summary: `Customer moved meeting to ${when.toLocaleString()}.`,
      data: { at: when.toISOString() },
    });
    const confirm = renderMeetingConfirmation(updated, when);
    queueMessage({
      leadId: lead.id,
      channel: "email",
      to: lead.email,
      subject: confirm.subject,
      body: confirm.body,
      template: "meeting_confirmation",
    });
    toast.success(`Meeting moved to ${when.toLocaleString()}. New confirmation sent.`);
    onChange?.({ ...result, lead: updated, meeting: { at: when.toISOString(), durationMinutes: result.meeting.durationMinutes } });
  };

  const downloadInvite = () => downloadICS(lead, meetingAt, result.meeting.durationMinutes);

  const steps: Array<{ icon: typeof CheckCircle2; label: string; detail: string }> = [
    {
      icon: ShieldCheck,
      label: "Risk analysis generated",
      detail: `${lead.urgency} urgency · risk score ${lead.riskScore}/100.`,
    },
    {
      icon: Sparkles,
      label: "Cover plan priced",
      detail: `${quote.lines.length} products, ${formatGBP(quote.totalAnnualPremium)}/yr (${formatGBP(quote.totalMonthlyPremium)}/mo). Quote ${quote.id}.`,
    },
    {
      icon: CalendarCheck,
      label: "Review call booked",
      detail: `${meetingAt.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} (30 min).`,
    },
    {
      icon: Mail,
      label: "Welcome email sent",
      detail: `Cover plan and meeting details delivered to ${lead.email}.`,
    },
    renewalScheduledAt
      ? {
          icon: Clock,
          label: "Renewal reminder scheduled",
          detail: `We'll email you 30 days before your next renewal.`,
        }
      : {
          icon: Clock,
          label: "Renewal tracker on standby",
          detail: `Add a renewal date and we'll start preparing your submission 30 days out.`,
        },
  ];

  return (
    <div className="rounded-3xl border border-accent/30 bg-gradient-to-b from-accent/[0.06] to-card p-8 md:p-10 shadow-elev">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <Sparkles className="h-3 w-3" /> Momo Autopilot
          </div>
          <h3 className="mt-4 font-display text-3xl text-ink leading-tight">
            We've taken care of the next five steps.
          </h3>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Your file is open, your quote is priced, your meeting is booked, and your inbox should already have everything.
            Below is what Autopilot did. Anything you want to change, just say.
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Total annual premium</div>
          <div className="mt-1 font-display text-3xl text-ink">{formatGBP(quote.totalAnnualPremium)}</div>
          <div className="text-xs text-muted-foreground font-mono">{formatGBP(quote.totalMonthlyPremium)} / month</div>
        </div>
      </div>

      <ul className="mt-8 grid md:grid-cols-2 gap-3">
        {steps.map((s) => (
          <li key={s.label} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <s.icon className="h-4 w-4" />
            </span>
            <div>
              <div className="text-sm font-medium text-ink flex items-center gap-2">
                {s.label}
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.detail}</div>
            </div>
          </li>
        ))}
      </ul>

      {/* Quote breakdown */}
      <div className="mt-8 rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Your cover plan</div>
            <div className="mt-1 font-display text-lg text-ink">{quote.id}</div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>Valid until {new Date(quote.validUntil).toLocaleDateString()}</div>
            <div>Status: <span className="text-ink font-medium">{quote.status}</span></div>
          </div>
        </div>
        <div className="divide-y divide-border">
          {quote.lines.map((l) => (
            <div key={l.productKey} className="p-5 grid md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-base text-ink">{l.productLabel}</span>
                  <span
                    className={cn(
                      "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold",
                      l.priority === "Essential"
                        ? "bg-accent text-accent-foreground"
                        : l.priority === "Recommended"
                        ? "bg-ink text-paper"
                        : "bg-secondary text-ink"
                    )}
                  >
                    {l.priority}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{l.description}</div>
                <div className="mt-2 text-[11px] font-mono text-muted-foreground">via {l.insurer}</div>
              </div>
              <div className="md:col-span-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground">Limit</div>
                  <div className="text-ink font-mono">{formatGBP(l.limit)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Excess</div>
                  <div className="text-ink font-mono">{formatGBP(l.deductible)}</div>
                </div>
              </div>
              <div className="md:col-span-2 text-xs text-muted-foreground leading-relaxed">{l.whyPriced}</div>
              <div className="md:col-span-2 text-right">
                <div className="font-display text-lg text-ink">{formatGBP(l.annualPremium)}</div>
                <div className="text-[11px] text-muted-foreground font-mono">/yr · {formatGBP(l.monthlyPremium)}/mo</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between p-5 border-t border-border bg-secondary/40">
          <div className="text-sm text-muted-foreground">
            Total premium — indicative, subject to underwriter review.
          </div>
          <div className="font-display text-2xl text-ink">{formatGBP(quote.totalAnnualPremium)}<span className="text-base text-muted-foreground">/yr</span></div>
        </div>
      </div>

      {/* Meeting controls */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Your review call</div>
            <div className="mt-1 font-display text-lg text-ink">
              {meetingAt.toLocaleString(undefined, { weekday: "long", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button asChild variant="outline" size="sm">
              <a href={googleCalendarUrl(lead, meetingAt, result.meeting.durationMinutes)} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> Add to Google Calendar
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={downloadInvite}>
              <CalendarCheck className="h-4 w-4" /> Download .ics
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Reschedule
            </Button>
          </div>
        </div>
        {expanded && (
          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            {slots.map((s) => {
              const active = s.start.getTime() === meetingAt.getTime();
              return (
                <button
                  key={s.start.toISOString()}
                  type="button"
                  onClick={() => reschedule(s.start)}
                  className={cn(
                    "text-left rounded-xl border p-4 transition-all",
                    active ? "border-accent bg-accent/10" : "border-border hover:border-accent/40"
                  )}
                >
                  <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {s.start.toLocaleDateString(undefined, { weekday: "long" })}
                  </div>
                  <div className="mt-1 font-display text-base text-ink">{s.label}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment & policy binding */}
      <div className="mt-6">
        <PaymentSetup lead={lead} quote={quote} />
      </div>

      {/* Message log preview */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-2">
          <Cog className="h-3.5 w-3.5" /> Autopilot activity
        </div>
        <ul className="mt-3 space-y-2">
          {messages.map((m) => (
            <li key={m.id} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-ink">
                <Mail className="h-3 w-3" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-ink truncate">{m.subject || m.template}</div>
                <div className="text-xs text-muted-foreground">
                  {m.status === "queued" ? "Scheduled" : "Sent"} to {m.to} · {new Date(m.at).toLocaleString()}
                </div>
              </div>
              <span className={cn(
                "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold",
                m.status === "queued" ? "bg-secondary text-ink" : "bg-success/10 text-success"
              )}>
                {m.status}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 text-xs text-muted-foreground leading-relaxed">
        Premiums shown are AI-generated indicative quotes. A licensed broker reviews and confirms every bind. Cover is subject to
        insurer appetite, underwriting and policy wording.
      </p>
    </div>
  );
}
