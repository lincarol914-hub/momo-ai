import { useEffect, useMemo, useState } from "react";
import {
  Lock, Mail, CalendarCheck, LogOut, Sparkles, Search, AlertTriangle, ShieldCheck,
  CreditCard, RefreshCw, XCircle, FileText, ChevronRight, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Disclaimer, Eyebrow } from "@/components/atlas/Bits";
import { type Lead, type LeadStatus, deleteLead, loadLeads, upsertLead } from "@/lib/leads";
import { formatGBP, loadQuotes, quoteByLead, type Quote } from "@/lib/pricing";
import { loadMessages, messagesForLead, queueMessage, type Message } from "@/lib/messages";
import { activityForLead, loadActivity, logActivity, type ActivityEvent } from "@/lib/activity";
import { cancelAtRenewal, loadPolicies, policyForLead, toggleAutoRenew, type Policy } from "@/lib/billing";
import { regenerateQuoteForLead } from "@/lib/workflow";
import { draftFollowUpEmail, hotLeadScore, mailtoLink, pipelineInsights } from "@/lib/aiAssistant";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ADMIN_PASSWORD = "Silverman99";
const SESSION_KEY = "momo:admin";

export default function Admin() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    try {
      setAuthed(sessionStorage.getItem(SESSION_KEY) === "1");
    } catch {
      // ignore
    }
  }, []);

  if (!authed) {
    return (
      <Gate
        onPass={() => {
          try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }
          setAuthed(true);
        }}
      />
    );
  }
  return (
    <Dashboard
      onLogout={() => {
        try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
        setAuthed(false);
      }}
    />
  );
}

function Gate({ onPass }: { onPass: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      setErr("");
      onPass();
    } else {
      setErr("Incorrect password.");
    }
  };
  return (
    <section className="section">
      <div className="container-atlas max-w-md">
        <Eyebrow>Operator</Eyebrow>
        <h1 className="mt-4 font-display text-4xl text-ink">Momo Backend</h1>
        <p className="mt-2 text-muted-foreground">Restricted area for the Momo team.</p>
        <form onSubmit={submit} className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
            {err && <p className="text-xs text-destructive">{err}</p>}
          </div>
          <Button type="submit" variant="atlas" className="w-full">
            <Lock className="h-4 w-4" /> Enter
          </Button>
        </form>
        <div className="mt-4">
          <Disclaimer>
            This page uses a single shared password and is intended for staging only. Move to per-user auth and a server-side
            datastore before production. Leads, quotes, policies and messages currently live in this browser's local storage.
          </Disclaimer>
        </div>
      </div>
    </section>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");

  const refresh = () => {
    setLeads(loadLeads());
    setPolicies(loadPolicies());
    setQuotes(loadQuotes());
    setMessages(loadMessages());
    setActivity(loadActivity());
  };

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    const lower = q.toLowerCase();
    return leads
      .filter((l) => (statusFilter === "all" ? true : l.status === statusFilter))
      .filter((l) => {
        if (!lower) return true;
        return (
          l.companyName.toLowerCase().includes(lower) ||
          l.email.toLowerCase().includes(lower) ||
          l.industry.toLowerCase().includes(lower) ||
          l.contactName.toLowerCase().includes(lower)
        );
      });
  }, [leads, q, statusFilter]);

  const selected = useMemo(() => leads.find((l) => l.id === selectedId) ?? null, [leads, selectedId]);
  const insights = useMemo(() => pipelineInsights(leads), [leads]);

  return (
    <>
      <section className="bg-navy-deep text-paper">
        <div className="container-atlas py-10 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-paper/60">Operator console</div>
            <h1 className="mt-1 font-display text-3xl text-paper">Momo Backend</h1>
            <p className="text-sm text-paper/65 mt-1">
              {leads.length} leads · {policies.filter((p) => p.status === "active").length} active policies · {formatGBP(
                policies.filter((p) => p.status === "active").reduce((acc, p) => acc + p.annualPremium, 0)
              )} GWP
            </p>
          </div>
          <Button variant="atlas-outline" size="sm" onClick={onLogout}><LogOut className="h-4 w-4" /> Log out</Button>
        </div>
      </section>

      <section className="section pt-10">
        <div className="container-atlas">
          <InsightsBar insights={insights} />

          <div className="mt-8 grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="p-3 border-b border-border space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search company, email, industry…"
                      className="pl-8"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LeadStatus | "all")}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="All statuses" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="meeting-booked">Meeting booked</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <ul className="max-h-[640px] overflow-y-auto divide-y divide-border">
                  {filtered.length === 0 && (
                    <li className="p-6 text-center text-sm text-muted-foreground">
                      No leads yet. Run an analysis from the customer page to populate this view.
                    </li>
                  )}
                  {filtered.map((l) => {
                    const hot = hotLeadScore(l);
                    const isActive = l.id === selectedId;
                    return (
                      <li key={l.id}>
                        <button
                          onClick={() => setSelectedId(l.id)}
                          className={cn(
                            "w-full text-left p-4 flex items-start gap-3 transition-colors",
                            isActive ? "bg-accent/5" : "hover:bg-secondary/40"
                          )}
                        >
                          <span className={cn(
                            "mt-1 h-2 w-2 rounded-full shrink-0",
                            l.urgency === "High" ? "bg-destructive" : l.urgency === "Medium" ? "bg-foreground" : "bg-success"
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-display text-sm text-ink truncate">{l.companyName}</span>
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{l.status}</span>
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{l.contactName} · {l.industry}</div>
                            <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                              <span>risk {l.riskScore}</span>
                              <span>·</span>
                              <span>hot {hot}</span>
                              <span>·</span>
                              <span>{new Date(l.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-7 xl:col-span-8">
              {selected ? (
                <LeadDetail
                  lead={selected}
                  policy={policyForLead(selected.id)}
                  quote={quoteByLead(selected.id)}
                  messages={messagesForLead(selected.id)}
                  activity={activityForLead(selected.id)}
                  onChange={refresh}
                  onDelete={() => { deleteLead(selected.id); setSelectedId(null); refresh(); }}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
                  <Sparkles className="h-6 w-6 text-foreground mx-auto" />
                  <h2 className="mt-3 font-display text-2xl text-ink">Pick a lead</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Select a lead on the left to see the AI-generated quote, the full activity timeline, autopilot messages, and the policy / payment state.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function InsightsBar({ insights }: { insights: ReturnType<typeof pipelineInsights> }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-foreground" /> AI pipeline insights
      </div>
      <div className="mt-4 grid md:grid-cols-4 gap-4">
        <Stat label="Leads" value={insights.totalLeads.toString()} />
        <Stat label="High urgency" value={insights.byUrgency.high.toString()} tone={insights.byUrgency.high > 0 ? "accent" : undefined} />
        <Stat label="Meetings booked" value={insights.meetingsBooked.toString()} />
        <Stat label="Avg risk" value={`${insights.averageRiskScore}/100`} />
      </div>
      {insights.suggestedActions.length > 0 && (
        <ul className="mt-5 space-y-1.5">
          {insights.suggestedActions.map((a) => (
            <li key={a} className="flex items-start gap-2 text-sm text-ink">
              <AlertTriangle className="h-3.5 w-3.5 text-foreground mt-0.5 shrink-0" /> {a}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "accent" }) {
  return (
    <div className={cn("rounded-lg border p-4", tone === "accent" ? "border-accent/30 bg-accent/5" : "border-border bg-background")}>
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl text-ink">{value}</div>
    </div>
  );
}

function LeadDetail({
  lead, policy, quote, messages, activity, onChange, onDelete,
}: {
  lead: Lead;
  policy?: Policy;
  quote?: Quote;
  messages: Message[];
  activity: ActivityEvent[];
  onChange: () => void;
  onDelete: () => void;
}) {
  const [notes, setNotes] = useState(lead.notes);
  const [status, setStatus] = useState<LeadStatus>(lead.status);

  useEffect(() => { setNotes(lead.notes); setStatus(lead.status); }, [lead.id]);

  const saveStatus = (next: LeadStatus) => {
    setStatus(next);
    const updated: Lead = { ...lead, status: next, lastContactedAt: next === "contacted" ? new Date().toISOString() : lead.lastContactedAt };
    upsertLead(updated);
    logActivity({ leadId: lead.id, type: "status_changed", actor: "operator", summary: `Status set to ${next}.` });
    onChange();
  };

  const saveNotes = () => {
    upsertLead({ ...lead, notes });
    logActivity({ leadId: lead.id, type: "note_added", actor: "operator", summary: `Operator added a note.` });
    toast.success("Notes saved.");
    onChange();
  };

  const sendDraftedFollowUp = () => {
    const draft = draftFollowUpEmail(lead);
    queueMessage({ leadId: lead.id, channel: "email", to: lead.email, subject: draft.subject, body: draft.body, template: "follow_up_no_reply" });
    logActivity({ leadId: lead.id, type: "email_sent", actor: "operator", summary: `Sent AI-drafted follow-up to ${lead.email}.` });
    toast.success("Follow-up logged as sent.");
    onChange();
  };

  const openInMail = () => {
    const draft = draftFollowUpEmail(lead);
    window.location.href = mailtoLink(lead, draft);
  };

  const regenerate = () => {
    const q = regenerateQuoteForLead(lead.id);
    if (q) { toast.success(`Quote re-generated: ${formatGBP(q.totalAnnualPremium)}/yr.`); onChange(); }
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="p-6 border-b border-border flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl text-ink">{lead.companyName}</h2>
          <div className="text-sm text-muted-foreground">{lead.contactName} · <a className="underline" href={`mailto:${lead.email}`}>{lead.email}</a></div>
          <div className="text-xs text-muted-foreground mt-1">{lead.industry} · {lead.country} · created {new Date(lead.createdAt).toLocaleString()}</div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={(v) => saveStatus(v as LeadStatus)}>
            <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="meeting-booked">Meeting booked</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={onDelete}><XCircle className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 p-6 border-b border-border">
        <Stat label="Risk score" value={`${lead.riskScore}/100`} tone={lead.riskScore >= 70 ? "accent" : undefined} />
        <Stat label="Lead score" value={`${lead.leadScore}/100`} />
        <Stat label="Hot lead" value={`${hotLeadScore(lead)}/100`} tone={hotLeadScore(lead) >= 70 ? "accent" : undefined} />
        <Stat label="Urgency" value={lead.urgency} tone={lead.urgency === "High" ? "accent" : undefined} />
      </div>

      {/* Quote */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">AI quote</div>
          <Button variant="ghost" size="sm" onClick={regenerate}><RefreshCw className="h-3.5 w-3.5" /> Re-price</Button>
        </div>
        {quote ? (
          <>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-display text-2xl text-ink">{formatGBP(quote.totalAnnualPremium)}</span>
              <span className="text-sm text-muted-foreground">/yr · {formatGBP(quote.totalMonthlyPremium)}/mo</span>
              <span className="ml-auto text-[11px] text-muted-foreground font-mono">{quote.id}</span>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {quote.lines.map((l) => (
                <li key={l.productKey} className="flex items-center justify-between">
                  <span className="text-ink">{l.productLabel} <span className="text-muted-foreground text-xs">via {l.insurer}</span></span>
                  <span className="font-mono text-xs">{formatGBP(l.annualPremium)} · limit {formatGBP(l.limit)}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No quote generated yet.</p>
        )}
      </div>

      {/* Policy */}
      <div className="p-6 border-b border-border">
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" /> Policy & payment
        </div>
        {policy ? (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="font-display text-lg text-ink">{policy.id}</span>
              <span className={cn(
                "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold",
                policy.status === "active" ? "bg-success/10 text-success" : "bg-secondary text-ink"
              )}>{policy.status}{policy.cancelAtRenewal ? " · cancelling" : ""}</span>
              <span className="text-muted-foreground">{formatGBP(policy.annualPremium)}/yr</span>
              <span className="text-muted-foreground">renews {new Date(policy.renewalDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span>
                {policy.payment.type === "card"
                  ? `${policy.payment.network} •••• ${policy.payment.identifier}`
                  : policy.payment.type === "bank"
                  ? `Bank ${policy.payment.identifier}`
                  : `${policy.payment.network} ${policy.payment.identifier}`}
                {" "}- {policy.payment.schedule}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const next = toggleAutoRenew(policy.id, !policy.autoRenew);
                  if (next) { toast.success(`Auto-renew ${next.autoRenew ? "enabled" : "disabled"}.`); onChange(); }
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" /> {policy.autoRenew ? "Disable auto-renew" : "Enable auto-renew"}
              </Button>
              {!policy.cancelAtRenewal && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const next = cancelAtRenewal(policy.id, "Operator cancelled at renewal.");
                    if (next) { toast.success("Set to cancel at renewal."); onChange(); }
                  }}
                >
                  <XCircle className="h-3.5 w-3.5" /> Cancel at renewal
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No bound policy yet. Customer can bind from the analysis page.</p>
        )}
      </div>

      {/* AI follow-up */}
      <div className="p-6 border-b border-border">
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-foreground" /> AI follow-up
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Drafted using lead profile, urgency, and the products in the quote.</p>
        <div className="mt-3 rounded-lg bg-secondary/50 p-3 text-xs whitespace-pre-wrap font-mono text-ink max-h-44 overflow-y-auto">
          {draftFollowUpEmail(lead).body}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="atlas" size="sm" onClick={sendDraftedFollowUp}><Send className="h-3.5 w-3.5" /> Mark as sent</Button>
          <Button variant="outline" size="sm" onClick={openInMail}><Mail className="h-3.5 w-3.5" /> Open in mail client</Button>
        </div>
      </div>

      {/* Notes */}
      <div className="p-6 border-b border-border">
        <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Operator notes</Label>
        <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2" />
        <div className="mt-3"><Button variant="outline" size="sm" onClick={saveNotes}>Save notes</Button></div>
      </div>

      {/* Messages */}
      <div className="p-6 border-b border-border">
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5" /> Messages ({messages.length})
        </div>
        <ul className="mt-3 space-y-2 max-h-64 overflow-y-auto">
          {messages.length === 0 && <li className="text-sm text-muted-foreground">No messages yet.</li>}
          {messages.map((m) => (
            <li key={m.id} className="rounded-md border border-border bg-background p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(m.at).toLocaleString()} · to {m.to}</span>
                <span className={cn(
                  "uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold text-[10px]",
                  m.status === "queued" ? "bg-secondary text-ink" : "bg-success/10 text-success"
                )}>{m.status}</span>
              </div>
              <div className="mt-1 text-sm text-ink">{m.subject}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">{m.body}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* Activity */}
      <div className="p-6">
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
          <CalendarCheck className="h-3.5 w-3.5" /> Activity ({activity.length})
        </div>
        <ol className="mt-3 space-y-2 max-h-72 overflow-y-auto">
          {activity.map((e) => (
            <li key={e.id} className="flex items-start gap-3 text-sm">
              <span className={cn(
                "mt-0.5 h-2 w-2 rounded-full shrink-0",
                e.actor === "ai" ? "bg-foreground" : e.actor === "customer" ? "bg-success" : "bg-ink"
              )} />
              <div>
                <div className="text-ink">{e.summary}</div>
                <div className="text-[11px] text-muted-foreground font-mono">{new Date(e.at).toLocaleString()} · {e.actor}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
