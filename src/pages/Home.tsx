import { Link } from "react-router-dom";
import { ArrowUpRight, ScanSearch, LineChart, Workflow, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CTARow, Eyebrow, SectionHeader } from "@/components/atlas/Bits";
import { HeroDashboard } from "@/components/atlas/HeroDashboard";

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy-deep text-paper">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent/20 blur-[140px] pointer-events-none" />
        <div className="container-atlas relative pt-24 md:pt-32 pb-20 md:pb-28">
          <div className="grid lg:grid-cols-12 gap-14 items-center">
            <div className="lg:col-span-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full border border-paper/15 bg-paper/[0.04] px-3 py-1.5 text-xs text-paper/80 backdrop-blur">
                <Sparkles className="h-3 w-3 text-accent" />
                Insurance, rebuilt around AI
              </div>
              <h1 className="mt-6 font-display text-5xl md:text-6xl lg:text-[72px] leading-[1.0] font-medium tracking-tight text-balance text-paper">
                Smarter cover.
                <br />
                <span className="text-accent">Faster everything.</span>
              </h1>
              <p className="mt-7 text-lg md:text-xl text-paper/65 leading-relaxed max-w-xl">
                Pistachio AI is the insurance platform for modern businesses — AI-powered analysis, quotes,
                and renewals, with humans in the loop where it counts.
              </p>
              <CTARow dark className="mt-9" />
              <div className="mt-10 flex items-center gap-2 text-xs text-paper/45 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                FCA-aware · Human-reviewed · Built for commercial risk
              </div>
            </div>
            <div className="lg:col-span-6 animate-fade-in-slow">
              <HeroDashboard />
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE DO — concise 3-up */}
      <section className="section">
        <div className="container-atlas">
          <SectionHeader
            eyebrow="What we do"
            title={<>Three layers. <span className="text-accent">One platform.</span></>}
            description="We acquire insurance distribution, run it on AI workflows, and help businesses get clearer cover."
          />
          <div className="mt-14 grid md:grid-cols-3 gap-5">
            <LayerCard n="01" title="Acquire" body="Partner with and acquire insurance brokers with strong renewal books." />
            <LayerCard n="02" title="Operate" body="AI-assisted intake, submissions, quotes, policy checks, renewals and claims." />
            <LayerCard n="03" title="Grow" body="Help businesses understand their risk and access cover, faster." />
          </div>
        </div>
      </section>

      {/* ANALYSIS CTA */}
      <section className="section pt-0">
        <div className="container-atlas">
          <div className="rounded-3xl border border-border bg-gradient-paper p-10 md:p-14 relative overflow-hidden">
            <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
            <div className="relative grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7">
                <Eyebrow>Free company analysis</Eyebrow>
                <h2 className="mt-4 font-display text-4xl md:text-5xl text-ink leading-[1.05] tracking-tight text-balance">
                  See your insurance picture in 60 seconds.
                </h2>
                <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
                  Drop in your company website. Pistachio AI maps likely exposures, relevant policies,
                  missing information and next steps.
                </p>
                <div className="mt-8">
                  <Button asChild variant="atlas" size="lg">
                    <Link to="/insurance-analysis">Run free analysis <ArrowUpRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </div>
              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-elev">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    pistachio/analysis
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    <Sample label="Industry" value="SaaS / Fintech" />
                    <Sample label="Risk score" value="72 / 100" accent />
                    <Sample label="Essential cover" value="Cyber, PI, EL" />
                    <Sample label="Missing info" value="3 items" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM PREVIEW */}
      <section className="section bg-secondary/50">
        <div className="container-atlas">
          <SectionHeader
            eyebrow="Platform"
            title={<>Three operating systems.</>}
            description="Each Pistachio OS targets a part of the insurance value chain — sharing one data and review layer."
          />
          <div className="mt-14 grid lg:grid-cols-3 gap-5">
            <OSCard
              tag="Risk OS"
              title="Pistachio Risk OS"
              body="Intake, submissions, underwriting support, quotes, policies, renewals, claims and compliance."
              points={["AI risk scanner", "Submission generator", "Policy checker", "Renewal engine"]}
              icon={ScanSearch}
            />
            <OSCard
              tag="Growth OS"
              title="Pistachio Growth OS"
              body="Sales, prospecting, partnerships and qualified insurance opportunities."
              points={["Prospect research", "Lead scoring", "Campaign builder", "Handoff workflow"]}
              icon={LineChart}
            />
            <OSCard
              tag="Acquire OS"
              title="Pistachio Acquire OS"
              body="Broker sourcing, due diligence, valuation, integration and synergy tracking."
              points={["Target research", "Due diligence", "Investment memos", "Integration tracker"]}
              icon={Workflow}
            />
          </div>
          <div className="mt-10 text-center">
            <Button asChild variant="ghost">
              <Link to="/platform">Explore the platform <ChevronRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="pb-24 pt-4">
        <div className="container-atlas">
          <div className="rounded-3xl bg-navy text-paper p-10 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-30" />
            <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-accent/25 blur-3xl pointer-events-none" />
            <div className="relative flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
              <div>
                <h2 className="font-display text-4xl md:text-5xl text-paper leading-[1.05] tracking-tight max-w-2xl">
                  Ready to see your insurance picture?
                </h2>
                <p className="mt-4 text-paper/65 max-w-xl">
                  Run a free AI-assisted analysis or talk to the Pistachio team.
                </p>
              </div>
              <CTARow dark />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function LayerCard({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-7 shadow-card hover:shadow-elev hover:border-accent/40 transition-all">
      <div className="font-mono text-xs text-accent font-semibold">{n}</div>
      <h3 className="mt-4 font-display text-2xl text-ink tracking-tight">{title}</h3>
      <p className="mt-3 text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function OSCard({ tag, title, body, points, icon: Icon }: { tag: string; title: string; body: string; points: string[]; icon: React.ComponentType<{className?:string}> }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-7 shadow-card hover:shadow-elev hover:-translate-y-0.5 transition-all flex flex-col">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold">{tag}</span>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="mt-5 font-display text-2xl text-ink tracking-tight">{title}</h3>
      <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{body}</p>
      <ul className="mt-5 pt-5 border-t border-border space-y-2 flex-1">
        {points.map((p) => (
          <li key={p} className="text-sm text-ink flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-accent" /> {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Sample({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? "text-accent font-semibold font-mono" : "text-ink font-medium font-mono"}>{value}</span>
    </div>
  );
}
