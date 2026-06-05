import { CheckCircle2, AlertCircle, ShieldCheck, TrendingUp } from "lucide-react";

// A handcrafted "dashboard" mockup rendered in HTML/CSS so it stays crisp,
// readable and on-brand. Used as the hero visual.
export function HeroDashboard() {
  return (
    <div className="relative w-full">
      {/* Floating glow */}
      <div className="absolute -inset-10 bg-gradient-accent opacity-20 blur-3xl rounded-full pointer-events-none" />
      <div className="relative grid grid-cols-6 gap-3 rounded-2xl bg-paper/[0.03] backdrop-blur-sm border border-paper/10 p-3 shadow-2xl">
        {/* Risk score */}
        <div className="col-span-6 md:col-span-2 rounded-xl bg-card p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Company risk score</div>
          <div className="mt-4 flex items-center gap-4">
            <RiskGauge value={72} />
            <div>
              <div className="font-display text-3xl text-ink leading-none">72<span className="text-base text-muted-foreground">/100</span></div>
              <div className="mt-1 text-xs text-muted-foreground">Moderate exposure</div>
            </div>
          </div>
          <div className="mt-5 space-y-1.5 text-xs">
            <Row label="Cyber" tone="warn" />
            <Row label="Professional Indemnity" tone="ok" />
            <Row label="D&O" tone="warn" />
          </div>
        </div>

        {/* Recommended products */}
        <div className="col-span-6 md:col-span-4 rounded-xl bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Recommended products</div>
            <div className="text-[10px] text-muted-foreground">7 items</div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <Pill name="Cyber" priority="Essential" />
            <Pill name="Professional Indemnity" priority="Essential" />
            <Pill name="Directors & Officers" priority="Recommended" />
            <Pill name="Tech E&O" priority="Recommended" />
            <Pill name="Employers' Liability" priority="Essential" />
            <Pill name="AI / Model Liability" priority="Consider" />
          </div>
        </div>

        {/* Renewal timeline */}
        <div className="col-span-6 md:col-span-3 rounded-xl bg-card p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Renewal timeline</div>
          <div className="mt-5 relative">
            <div className="h-1 w-full rounded-full bg-secondary" />
            <div className="absolute top-0 left-0 h-1 rounded-full bg-foreground" style={{ width: "62%" }} />
            <div className="mt-3 flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>JAN</span><span>MAR</span><span>MAY</span><span className="text-ink font-semibold">JUL</span><span>SEP</span><span>NOV</span>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs">
            <TrendingUp className="h-3.5 w-3.5 text-foreground" />
            <span className="text-muted-foreground">Submission opens in</span>
            <span className="text-ink font-medium">42 days</span>
          </div>
        </div>

        {/* Quote comparison */}
        <div className="col-span-6 md:col-span-3 rounded-xl bg-card p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Quote comparison · Cyber</div>
          <div className="mt-3 space-y-2">
            <Quote insurer="Markel" premium="£8,420" excess="£5k" best />
            <Quote insurer="CFC" premium="£9,180" excess="£5k" />
            <Quote insurer="Beazley" premium="£10,540" excess="£10k" />
          </div>
        </div>

        {/* Status row */}
        <div className="col-span-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-card p-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-success/10 text-success flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-medium text-ink">Policy checked</div>
              <div className="text-xs text-muted-foreground">12 clauses verified · 0 conflicts</div>
            </div>
          </div>
          <div className="rounded-xl bg-card p-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-accent/10 text-foreground flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-medium text-ink flex items-center gap-2">
                Human review required <AlertCircle className="h-3.5 w-3.5 text-foreground" />
              </div>
              <div className="text-xs text-muted-foreground">Submission ready for broker approval</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskGauge({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width="68" height="68" viewBox="0 0 68 68">
      <circle cx="34" cy="34" r={r} stroke="hsl(var(--secondary))" strokeWidth="6" fill="none" />
      <circle
        cx="34" cy="34" r={r}
        stroke="hsl(var(--accent))" strokeWidth="6" fill="none"
        strokeDasharray={c} strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 34 34)"
      />
    </svg>
  );
}

function Row({ label, tone }: { label: string; tone: "ok" | "warn" | "bad" }) {
  const colors = {
    ok: "bg-success",
    warn: "bg-foreground",
    bad: "bg-destructive",
  } as const;
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 w-4 rounded-full ${tone === "ok" || (tone === "warn" && i < 3) || (tone === "bad" && i < 2) ? "" : "bg-secondary"} ${i === 1 || (tone !== "ok" && i === 2 && tone !== "bad") || (tone === "ok") ? colors[tone] : "bg-secondary"}`} />
        ))}
      </span>
    </div>
  );
}

function Pill({ name, priority }: { name: string; priority: "Essential" | "Recommended" | "Consider" }) {
  const tone = priority === "Essential" ? "bg-accent/10 text-foreground border-accent/20"
    : priority === "Recommended" ? "bg-secondary text-ink border-border"
    : "bg-card text-muted-foreground border-border";
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
      <span className="text-xs font-medium text-ink">{name}</span>
      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${tone}`}>{priority}</span>
    </div>
  );
}

function Quote({ insurer, premium, excess, best }: { insurer: string; premium: string; excess: string; best?: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-md px-3 py-2 text-xs ${best ? "bg-accent/5 border border-accent/30" : "bg-secondary"}`}>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-muted-foreground">{insurer.slice(0,2).toUpperCase()}</span>
        <span className="text-ink font-medium">{insurer}</span>
        {best && <span className="text-[9px] uppercase tracking-wider text-foreground font-semibold">Best fit</span>}
      </div>
      <div className="flex items-center gap-3 font-mono">
        <span className="text-muted-foreground">XS {excess}</span>
        <span className="text-ink font-semibold">{premium}</span>
      </div>
    </div>
  );
}
