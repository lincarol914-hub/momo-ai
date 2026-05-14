import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, Search, Building2, ShieldCheck, Calculator, FileText,
  CalendarCheck, Mail, RefreshCw, CheckCircle2, Play, RotateCcw,
  ArrowRight, Loader2, MapPin, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eyebrow } from "@/components/atlas/Bits";
import {
  lookupCompaniesHouse,
  type CompaniesHouseCompany,
} from "@/lib/companiesHouse";
import { generateReport, type AnalysisInput, type Report } from "@/lib/analyzer";
import { createLeadFromAnalysis, type Lead } from "@/lib/leads";
import { buildRangedQuote, formatGBP, type RangedQuote } from "@/lib/pricing";
import { suggestSlots, type Slot } from "@/lib/scheduler";
import { renderWelcomeWithQuote, renderRenewalReminder } from "@/lib/messages";
import { cn } from "@/lib/utils";

const SAMPLE_NUMBER = "12345678";

type StageState = "pending" | "running" | "done";

interface DemoContext {
  chNumber: string;
  company: CompaniesHouseCompany | null;
  input: AnalysisInput | null;
  report: Report | null;
  lead: Lead | null;
  quote: RangedQuote | null;
  meeting: Slot | null;
  emails: Array<{ subject: string; whenLabel: string; tag: string }>;
}

const EMPTY_CTX: DemoContext = {
  chNumber: SAMPLE_NUMBER,
  company: null,
  input: null,
  report: null,
  lead: null,
  quote: null,
  meeting: null,
  emails: [],
};

interface Stage {
  id: string;
  label: string;
  icon: typeof Search;
  duration: number; // ms at 1x
  run: (ctx: DemoContext) => Promise<DemoContext>;
  Body: (props: { ctx: DemoContext; state: StageState }) => JSX.Element;
}

// ---- Stage 1: CH lookup --------------------------------------------------
async function runLookup(ctx: DemoContext): Promise<DemoContext> {
  const co = await lookupCompaniesHouse(ctx.chNumber);
  return { ...ctx, company: co };
}

function LookupBody({ ctx, state }: { ctx: DemoContext; state: StageState }) {
  if (state === "pending") return <Skeleton lines={3} />;
  if (state === "running" || !ctx.company) {
    return <RunningLog lines={[`GET /company/${ctx.chNumber}`, "Resolving..."]} />;
  }
  const co = ctx.company;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-display text-lg text-ink">{co.companyName}</span>
        <Pill tone="success">{co.status}</Pill>
        <Pill tone="mono">{co.companyNumber}</Pill>
      </div>
      <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {co.registeredAddress.city}, {co.registeredAddress.postcode}</span>
        <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {co.officersCount} officers</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Industry · {co.industry}</span>
        {co.sicCodes.map((s) => (
          <span key={s.code} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-ink">
            SIC {s.code}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---- Stage 2: Risk analysis ---------------------------------------------
async function runAnalysis(ctx: DemoContext): Promise<DemoContext> {
  if (!ctx.company) return ctx;
  const co = ctx.company;
  const input: AnalysisInput = {
    companyName: co.companyName,
    website: co.websiteGuess ?? "",
    contactName: "Demo Contact",
    email: `hello@${(co.websiteGuess ?? "example.com")}`,
    country: "United Kingdom",
    industry: co.industry,
    sellsToUS: false,
    handlesSensitiveData: ["SaaS", "Fintech", "AI company", "Healthcare"].includes(co.industry),
    usesAI: co.industry === "AI company" || co.industry === "SaaS",
    hasInsurance: false,
  };
  const report = generateReport(input);
  return { ...ctx, input, report };
}

function AnalysisBody({ ctx, state }: { ctx: DemoContext; state: StageState }) {
  if (state === "pending") return <Skeleton lines={3} />;
  if (state === "running" || !ctx.report) {
    return (
      <RunningLog
        lines={[
          "Mapping SIC code to risk profile...",
          "Scoring exposures across 8 categories...",
          "Triaging urgency...",
        ]}
      />
    );
  }
  const r = ctx.report;
  const top = r.risks.slice(0, 3);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <MetricTile label="Risk" value={`${r.scoring.riskScore}/100`} tone="accent" />
        <MetricTile label="Urgency" value={r.scoring.urgency} tone={r.scoring.urgency === "High" ? "destructive" : "accent"} />
        <MetricTile label="Lead" value={`${r.scoring.leadScore}/100`} />
      </div>
      <div className="space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Top exposures</div>
        {top.map((rk) => (
          <div key={rk.key} className="flex items-center justify-between text-xs">
            <span className="text-ink truncate">{rk.label}</span>
            <Pill tone={rk.level === "High" ? "destructive" : rk.level === "Medium" ? "accent" : "success"}>{rk.level}</Pill>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Stage 3: AI pricing -------------------------------------------------
async function runPricing(ctx: DemoContext): Promise<DemoContext> {
  if (!ctx.input || !ctx.report) return ctx;
  const lead = createLeadFromAnalysis(ctx.input, ctx.report);
  const quote = buildRangedQuote(lead, "low");
  return { ...ctx, lead, quote };
}

function PricingBody({ ctx, state }: { ctx: DemoContext; state: StageState }) {
  if (state === "pending") return <Skeleton lines={4} />;
  if (state === "running" || !ctx.quote) {
    return (
      <RunningLog
        lines={[
          "feature_engineer(company) → 8 features",
          "freq_model.predict() → λ ≈ 0.18 claims/yr",
          "sev_model.predict() → μ ≈ £14k per claim",
          "expected_loss = λ × μ",
        ]}
      />
    );
  }
  const q = ctx.quote;
  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Per-line indicative range</div>
      <ul className="space-y-1">
        {q.lines.slice(0, 4).map((l) => (
          <li key={l.productKey} className="flex items-center justify-between text-xs">
            <span className="text-ink truncate">{l.productLabel}</span>
            <span className="font-mono text-muted-foreground">{formatGBP(l.low)} – {formatGBP(l.high)}</span>
          </li>
        ))}
        {q.lines.length > 4 && (
          <li className="text-[10px] text-muted-foreground">+ {q.lines.length - 4} more</li>
        )}
      </ul>
    </div>
  );
}

// ---- Stage 4: Quote ready (visual summary) ------------------------------
async function runQuoteSummary(ctx: DemoContext): Promise<DemoContext> {
  // Pure visual stage — already have the quote.
  return ctx;
}

function QuoteBody({ ctx, state }: { ctx: DemoContext; state: StageState }) {
  if (state === "pending") return <Skeleton lines={2} />;
  if (state === "running" || !ctx.quote) return <RunningLog lines={["Aggregating cover lines...", "Pricing range..."]} />;
  const q = ctx.quote;
  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total indicative range</div>
      <div className="font-display text-3xl text-ink">
        {formatGBP(q.totalLow)} <span className="text-base text-muted-foreground">–</span> {formatGBP(q.totalHigh)}
      </div>
      <div className="text-xs text-muted-foreground">per year · confidence <span className="text-ink font-medium">{q.confidence}</span> · {q.lines.length} cover lines</div>
    </div>
  );
}

// ---- Stage 5: Auto-booked meeting ---------------------------------------
async function runMeeting(ctx: DemoContext): Promise<DemoContext> {
  if (!ctx.lead) return ctx;
  const slots = suggestSlots(ctx.lead.urgency);
  return { ...ctx, meeting: slots[0] ?? null };
}

function MeetingBody({ ctx, state }: { ctx: DemoContext; state: StageState }) {
  if (state === "pending") return <Skeleton lines={2} />;
  if (state === "running" || !ctx.meeting) return <RunningLog lines={["suggestSlots(urgency)...", "Picking top slot..."]} />;
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div>
        <div className="font-display text-lg text-ink">{ctx.meeting.label}</div>
        <div className="text-xs text-muted-foreground">30-minute insurance review · {ctx.lead?.urgency} urgency profile</div>
      </div>
      <Pill tone="accent">auto-booked</Pill>
    </div>
  );
}

// ---- Stage 6: Welcome email ---------------------------------------------
async function runWelcomeEmail(ctx: DemoContext): Promise<DemoContext> {
  if (!ctx.lead || !ctx.quote) return ctx;
  // Build a non-ranged quote shape just for the message template.
  const flatQuote = {
    id: ctx.quote.id,
    leadId: ctx.quote.leadId,
    createdAt: ctx.quote.createdAt,
    validUntil: ctx.quote.validUntil,
    status: "draft" as const,
    currency: ctx.quote.currency,
    lines: ctx.quote.lines,
    totalAnnualPremium: ctx.quote.totalAnnualPremium,
    totalMonthlyPremium: ctx.quote.totalMonthlyPremium,
  };
  const m = renderWelcomeWithQuote(ctx.lead, flatQuote);
  return {
    ...ctx,
    emails: [...ctx.emails, { subject: m.subject, whenLabel: "Sent now", tag: "welcome" }],
  };
}

function EmailBody({ ctx, state }: { ctx: DemoContext; state: StageState }) {
  if (state === "pending") return <Skeleton lines={2} />;
  if (state === "running" || ctx.emails.length === 0) {
    return <RunningLog lines={["Templating welcome email...", "Queueing for delivery..."]} />;
  }
  const m = ctx.emails[0];
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">Subject</div>
      <div className="text-sm text-ink font-medium">{m.subject}</div>
      <Pill tone="success">sent</Pill>
    </div>
  );
}

// ---- Stage 7: Renewal reminders -----------------------------------------
async function runRenewalReminders(ctx: DemoContext): Promise<DemoContext> {
  if (!ctx.lead) return ctx;
  // Pretend renewal is one year out.
  const renewal = new Date();
  renewal.setFullYear(renewal.getFullYear() + 1);
  const extras: DemoContext["emails"] = [];
  for (const days of [45, 14, 1]) {
    const r = renderRenewalReminder(ctx.lead, renewal);
    extras.push({ subject: r.subject, whenLabel: `${days} days before renewal`, tag: "renewal" });
  }
  return { ...ctx, emails: [...ctx.emails, ...extras] };
}

function RenewalBody({ ctx, state }: { ctx: DemoContext; state: StageState }) {
  if (state === "pending") return <Skeleton lines={3} />;
  if (state === "running") return <RunningLog lines={["Scheduling 45-day reminder...", "Scheduling 14-day reminder...", "Scheduling 1-day reminder..."]} />;
  const reminders = ctx.emails.filter((e) => e.tag === "renewal");
  return (
    <div className="space-y-1">
      {reminders.map((m, i) => (
        <div key={i} className="flex items-center justify-between text-xs">
          <span className="text-ink truncate">{m.subject}</span>
          <span className="text-muted-foreground font-mono">{m.whenLabel}</span>
        </div>
      ))}
    </div>
  );
}

// ---- Stage 8: Done ------------------------------------------------------
async function runDone(ctx: DemoContext): Promise<DemoContext> {
  return ctx;
}

function DoneBody({ ctx, state }: { ctx: DemoContext; state: StageState }) {
  if (state !== "done") return <Skeleton lines={1} />;
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div>
        <div className="font-display text-xl text-ink">Cover ready to bind.</div>
        <div className="text-xs text-muted-foreground">Customer can pay by card, bank or crypto. Auto-renewal toggled on by default.</div>
      </div>
      <Button asChild variant="atlas" size="sm">
        <Link to="/insurance-analysis">Try it yourself <ArrowRight className="h-4 w-4" /></Link>
      </Button>
    </div>
  );
}

// ---- Stage list ---------------------------------------------------------
const STAGES: Stage[] = [
  { id: "lookup",   label: "Calling Companies House",     icon: Search,         duration: 1400, run: runLookup,           Body: LookupBody   },
  { id: "analysis", label: "AI risk analysis",            icon: ShieldCheck,    duration: 1500, run: runAnalysis,         Body: AnalysisBody },
  { id: "pricing",  label: "AI underwriter pricing",      icon: Calculator,     duration: 2200, run: runPricing,          Body: PricingBody  },
  { id: "quote",    label: "First-pass quote",            icon: FileText,       duration: 1100, run: runQuoteSummary,     Body: QuoteBody    },
  { id: "meeting",  label: "Auto-booking review call",    icon: CalendarCheck,  duration: 1200, run: runMeeting,          Body: MeetingBody  },
  { id: "email",    label: "Welcome email sent",          icon: Mail,           duration: 1100, run: runWelcomeEmail,     Body: EmailBody    },
  { id: "renewal",  label: "Renewal reminders scheduled", icon: RefreshCw,      duration: 1200, run: runRenewalReminders, Body: RenewalBody  },
  { id: "done",     label: "Ready to bind cover",         icon: CheckCircle2,   duration: 600,  run: runDone,             Body: DoneBody     },
];

const SPEEDS = [
  { label: "1x", value: 1 },
  { label: "2x", value: 2 },
  { label: "4x", value: 4 },
];

// ---- Page ---------------------------------------------------------------
export default function WatchDemo() {
  const [chNumber, setChNumber] = useState(SAMPLE_NUMBER);
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(false);
  const [stageStates, setStageStates] = useState<StageState[]>(
    STAGES.map(() => "pending")
  );
  const [stageDurations, setStageDurations] = useState<number[]>(STAGES.map(() => 0));
  const [ctx, setCtx] = useState<DemoContext>({ ...EMPTY_CTX, chNumber });
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const cancelRef = useRef(false);

  // Wall-clock ticker while running.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      if (startTimeRef.current !== null) {
        setElapsed((performance.now() - startTimeRef.current) / 1000);
      }
    }, 80);
    return () => window.clearInterval(id);
  }, [running]);

  const start = async () => {
    if (running) return;
    cancelRef.current = false;
    const cleanInput = chNumber.trim().toUpperCase() || SAMPLE_NUMBER;
    setRunning(true);
    setElapsed(0);
    startTimeRef.current = performance.now();
    setStageStates(STAGES.map(() => "pending"));
    setStageDurations(STAGES.map(() => 0));
    let working: DemoContext = { ...EMPTY_CTX, chNumber: cleanInput };
    setCtx(working);

    for (let i = 0; i < STAGES.length; i++) {
      if (cancelRef.current) break;
      setStageStates((prev) => {
        const next = [...prev];
        next[i] = "running";
        return next;
      });
      const stageStart = performance.now();
      const targetDuration = STAGES[i].duration / speed;
      const workPromise = STAGES[i].run(working).then((r) => {
        working = r;
        setCtx(r);
      });
      const sleepPromise = new Promise<void>((resolve) =>
        window.setTimeout(resolve, targetDuration)
      );
      await Promise.all([workPromise, sleepPromise]);
      const dur = performance.now() - stageStart;
      setStageDurations((prev) => {
        const next = [...prev];
        next[i] = dur;
        return next;
      });
      setStageStates((prev) => {
        const next = [...prev];
        next[i] = "done";
        return next;
      });
    }
    setRunning(false);
  };

  const reset = () => {
    cancelRef.current = true;
    setRunning(false);
    setStageStates(STAGES.map(() => "pending"));
    setStageDurations(STAGES.map(() => 0));
    setCtx({ ...EMPTY_CTX, chNumber });
    setElapsed(0);
    startTimeRef.current = null;
  };

  const doneCount = stageStates.filter((s) => s === "done").length;
  const totalDoneSeconds = stageDurations.reduce((a, b) => a + b, 0) / 1000;

  return (
    <>
      {/* Hero */}
      <section className="bg-navy-deep text-paper relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="container-atlas relative py-14 md:py-18">
          <Eyebrow dark>
            <Sparkles className="h-3 w-3" /> Watch Momo Autopilot
          </Eyebrow>
          <h1 className="mt-4 font-display text-4xl md:text-5xl text-paper leading-[1.05] max-w-3xl text-balance">
            From a Companies House number to a bound quote — in seconds.
          </h1>
          <p className="mt-4 text-paper/65 max-w-2xl">
            Eight steps that would take a broker days, run end-to-end. Watch the recording below,
            then run it live yourself with your own Companies House number.
          </p>
        </div>
      </section>

      {/* Recorded walkthrough */}
      <section className="bg-navy-deep">
        <div className="container-atlas pb-16">
          <div className="rounded-2xl overflow-hidden border border-paper/10 shadow-elev bg-black">
            <video
              src="/momo-demo.mp4"
              controls
              autoPlay
              muted
              playsInline
              preload="metadata"
              className="w-full aspect-video bg-black"
            >
              Your browser can't play this video.
            </video>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-paper/55">
            <Play className="h-3 w-3" /> Recorded walkthrough · 22MB · scroll down to run it live
          </div>
        </div>
      </section>

      {/* Run it live yourself */}
      <section className="section pt-16">
        <div className="container-atlas">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <Sparkles className="h-3 w-3" /> Run it live
            </div>
            <h2 className="mt-4 font-display text-3xl md:text-4xl text-ink leading-tight">
              Try it with your own Companies House number.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Eight stages, same lib functions production uses. Pick a speed and press Play.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 mb-6 grid md:grid-cols-[1fr_auto_auto] gap-3 max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={chNumber}
                onChange={(e) => setChNumber(e.target.value)}
                placeholder={SAMPLE_NUMBER}
                disabled={running}
                className="pl-9 uppercase"
              />
            </div>
            <div className="flex items-center gap-1 rounded-md border border-border bg-secondary/40 p-1">
              {SPEEDS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSpeed(s.value)}
                  disabled={running}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded transition-colors",
                    speed === s.value ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-ink"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {running ? (
              <Button variant="outline" size="lg" onClick={reset}>
                <RotateCcw className="h-4 w-4" /> Stop
              </Button>
            ) : doneCount === STAGES.length ? (
              <Button variant="atlas" size="lg" onClick={() => { reset(); window.setTimeout(start, 50); }}>
                <RotateCcw className="h-4 w-4" /> Replay
              </Button>
            ) : (
              <Button variant="atlas" size="lg" onClick={start}>
                <Play className="h-4 w-4" /> Play demo
              </Button>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 md:p-6 mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-accent" />
                <span className="font-mono text-lg text-ink tabular-nums">
                  {(running ? elapsed : totalDoneSeconds).toFixed(2)}s
                </span>
                <span className="text-xs text-muted-foreground">elapsed</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {doneCount} of {STAGES.length} steps complete
              </div>
            </div>
            <ProgressBar value={doneCount} max={STAGES.length} />
          </div>

          <div className="space-y-3">
            {STAGES.map((s, i) => (
              <StageCard
                key={s.id}
                index={i}
                stage={s}
                state={stageStates[i]}
                duration={stageDurations[i]}
                ctx={ctx}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// ---- Smaller components -------------------------------------------------
function StageCard({
  index, stage, state, duration, ctx,
}: {
  index: number;
  stage: Stage;
  state: StageState;
  duration: number;
  ctx: DemoContext;
}) {
  const Icon = stage.icon;
  const Body = stage.Body;
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 transition-all duration-500",
        state === "done" && "border-success/40 shadow-card",
        state === "running" && "border-accent shadow-elev ring-1 ring-accent/30",
        state === "pending" && "border-border opacity-60"
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
            state === "done" && "bg-success/10 text-success",
            state === "running" && "bg-accent/10 text-accent",
            state === "pending" && "bg-secondary text-muted-foreground"
          )}
        >
          {state === "running" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
              <span className="font-display text-base text-ink">{stage.label}</span>
            </div>
            <div className="text-xs flex items-center gap-2">
              {state === "done" && (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  <span className="font-mono text-muted-foreground">{(duration / 1000).toFixed(2)}s</span>
                </>
              )}
              {state === "running" && <span className="text-accent text-[11px] uppercase tracking-wider">running</span>}
              {state === "pending" && <span className="text-muted-foreground text-[11px] uppercase tracking-wider">queued</span>}
            </div>
          </div>
          <div className="mt-3">
            <Body ctx={ctx} state={state} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex-1 min-w-[160px] max-w-md">
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function RunningLog({ lines }: { lines: string[] }) {
  return (
    <ul className="space-y-1 font-mono text-[11px] text-muted-foreground">
      {lines.map((l, i) => (
        <li key={i} className="flex items-center gap-2">
          <span className="text-accent">›</span> {l}
        </li>
      ))}
    </ul>
  );
}

function Skeleton({ lines }: { lines: number }) {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-2.5 rounded bg-secondary/60" style={{ width: `${60 + (i % 3) * 10}%` }} />
      ))}
    </div>
  );
}

function MetricTile({
  label, value, tone,
}: {
  label: string;
  value: string;
  tone?: "accent" | "destructive";
}) {
  return (
    <div className={cn(
      "rounded-lg border px-3 py-2",
      tone === "accent" ? "border-accent/30 bg-accent/5"
        : tone === "destructive" ? "border-destructive/30 bg-destructive/5"
        : "border-border bg-background"
    )}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-display text-base text-ink">{value}</div>
    </div>
  );
}

function Pill({
  children, tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "success" | "accent" | "destructive" | "neutral" | "mono";
}) {
  const cls =
    tone === "success" ? "bg-success/10 text-success border-success/20"
    : tone === "accent" ? "bg-accent/10 text-accent border-accent/30"
    : tone === "destructive" ? "bg-destructive/10 text-destructive border-destructive/20"
    : tone === "mono" ? "bg-secondary text-ink font-mono"
    : "bg-secondary text-ink";
  return (
    <span className={cn("text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold border", cls)}>
      {children}
    </span>
  );
}
