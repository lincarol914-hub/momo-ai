import { Sparkles, Play } from "lucide-react";
import { Eyebrow } from "@/components/atlas/Bits";
import {
  backendMode,
  lookupCompaniesHouse,
  type CompaniesHouseCompany,
} from "@/lib/companiesHouse";
import { generateReport, type AnalysisInput, type Report } from "@/lib/analyzer";
import { createLeadFromAnalysis, type Lead } from "@/lib/leads";
import { buildRangedQuote, formatGBP, type RangedQuote } from "@/lib/pricing";
import { suggestSlots, type Slot } from "@/lib/scheduler";
import { renderWelcomeWithQuote, renderRenewalReminder } from "@/lib/messages";
import { cn } from "@/lib/utils";

export default function WatchDemo() {
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
            From a Companies House number to a bound quote - in seconds.
          </h1>
          <p className="mt-4 text-paper/65 max-w-2xl">
            Watch the recording below to see Momo Autopilot in action.
          </p>
        </div>
      </section>

      {/* Recorded walkthrough */}
      <section className="bg-navy-deep pb-16">
        <div className="container-atlas">
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
            <div className="inline-flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                <Sparkles className="h-3 w-3" /> Run it live
              </div>
              {backendMode() === "live" ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-success"
                  title="Connected to the Momo pricing service."
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  Live backend
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
                  title="Set VITE_PRICING_API_URL and run the pricing service for live lookups."
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                  Mock data
                </span>
              )}
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
