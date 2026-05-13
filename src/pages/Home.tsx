import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles, Shield, Zap, Scale, Check, Bitcoin, Wallet, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CTARow, SectionHeader } from "@/components/atlas/Bits";
import { HeroDashboard } from "@/components/atlas/HeroDashboard";

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy-deep text-paper">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute -top-40 -right-40 h-[560px] w-[560px] rounded-full bg-accent/25 blur-[160px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 h-[480px] w-[480px] rounded-full bg-accent/10 blur-[140px] pointer-events-none" />
        <div className="container-atlas relative pt-24 md:pt-32 pb-24 md:pb-32">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-paper/15 bg-paper/[0.04] px-3 py-1.5 text-xs text-paper/80 backdrop-blur">
              <Sparkles className="h-3 w-3 text-accent" />
              Business insurance, finally simple
            </div>
            <h1 className="mt-7 font-display text-5xl md:text-6xl lg:text-[88px] leading-[0.98] font-medium tracking-tight text-balance text-paper">
              Cover that
              <br />
              <span className="text-accent italic">actually fits.</span>
            </h1>
            <p className="mt-7 text-lg md:text-xl text-paper/65 leading-relaxed max-w-2xl mx-auto">
              Momo finds the right business insurance for your company in minutes. Clearer cover, fairer prices, no jargon.
            </p>
            <div className="mt-9 flex justify-center">
              <CTARow dark primaryLabel="Get my analysis" />
            </div>
            <div className="mt-10 flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-xs text-paper/50 font-mono">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" /> Free, no obligation</span>
              <span className="flex items-center gap-1.5"><Check className="h-3 w-3" /> FCA-aware</span>
              <span className="flex items-center gap-1.5"><Check className="h-3 w-3" /> Human-reviewed</span>
              <span className="flex items-center gap-1.5"><Bitcoin className="h-3 w-3" /> Pay in crypto or card</span>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="section">
        <div className="container-atlas">
          <SectionHeader
            eyebrow="Why Momo"
            title={<>Insurance that <span className="text-accent italic">works for you.</span></>}
            description="Built for modern businesses who want clarity, speed and cover that genuinely matches their risk."
          />
          <div className="mt-16 grid md:grid-cols-3 gap-5">
            <ValueCard
              icon={Zap}
              title="Minutes, not weeks"
              body="Tell us about your business once. Get a clear picture of what cover you need and what it should cost - fast."
            />
            <ValueCard
              icon={Shield}
              title="Cover that fits"
              body="No generic packages. We match your actual exposures to the right policies, and flag the gaps most brokers miss."
            />
            <ValueCard
              icon={Scale}
              title="Fair, transparent pricing"
              body="See what you're paying for and why. We negotiate with insurers so you don't pay for cover you don't need."
            />
          </div>
        </div>
      </section>

      {/* HOW SIMPLE */}
      <section className="section pt-0">
        <div className="container-atlas">
          <div className="rounded-3xl border border-border bg-gradient-paper p-10 md:p-16 relative overflow-hidden">
            <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
            <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
            <div className="relative grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6">
                <div className="eyebrow text-muted-foreground">
                  <span className="h-px w-6 bg-muted-foreground/40" />
                  60-second analysis
                </div>
                <h2 className="mt-5 font-display text-4xl md:text-5xl text-ink leading-[1.02] tracking-tight text-balance">
                  See your insurance picture before you talk to anyone.
                </h2>
                <p className="mt-5 text-lg text-muted-foreground max-w-xl">
                  Drop in your company website. We'll show you the cover you likely need,
                  the gaps to close, and what good pricing looks like.
                </p>
                <ul className="mt-8 space-y-3">
                  {[
                    "Personalised risk overview",
                    "Recommended policies, ranked",
                    "Pricing benchmarks",
                    "What to ask your current broker",
                  ].map((p) => (
                    <li key={p} className="flex items-center gap-3 text-ink">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-accent">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="text-sm md:text-base">{p}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-9">
                  <Button asChild variant="atlas" size="lg">
                    <Link to="/insurance-analysis">Run free analysis <ArrowUpRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </div>
              <div className="lg:col-span-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-elev">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    your-company.com
                  </div>
                  <div className="mt-5 space-y-3 text-sm">
                    <Sample label="Industry" value="SaaS / Fintech" />
                    <Sample label="Risk profile" value="Moderate" />
                    <Sample label="Essential cover" value="Cyber, PI, EL" accent />
                    <Sample label="Estimated annual premium" value="£4,800 – £6,200" />
                    <Sample label="Gaps to close" value="3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO WE HELP */}
      <section className="section bg-secondary/40">
        <div className="container-atlas">
          <SectionHeader
            eyebrow="Who we help"
            title={<>Built for <span className="text-accent italic">modern businesses.</span></>}
            description="From early-stage startups to established firms - if your business is moving fast, your insurance should too."
          />
          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { tag: "SaaS & Tech", body: "Cyber, PI and IP cover for software companies." },
              { tag: "Fintech", body: "Regulated cover for payments, lending and crypto." },
              { tag: "AI Companies", body: "Specialist cover for AI products and model risk." },
              { tag: "Professional Services", body: "PI, management liability and cyber done right." },
            ].map((s) => (
              <div key={s.tag} className="group rounded-2xl border border-border bg-card p-6 hover:border-accent/50 hover:shadow-elev transition-all">
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent">{s.tag}</div>
                <p className="mt-4 text-ink leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="pb-24 pt-4">
        <div className="container-atlas">
          <div className="rounded-3xl bg-navy text-paper p-10 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-25" />
            <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-accent/30 blur-3xl pointer-events-none" />
            <div className="relative flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
              <div>
                <h2 className="font-display text-4xl md:text-5xl text-paper leading-[1.02] tracking-tight max-w-2xl">
                  Get the right cover. <span className="text-accent italic">In minutes.</span>
                </h2>
                <p className="mt-4 text-paper/65 max-w-xl">
                  Free analysis. No credit card. No sales call required.
                </p>
              </div>
              <CTARow dark primaryLabel="Get my analysis" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ValueCard({ icon: Icon, title, body }: { icon: React.ComponentType<{className?:string}>; title: string; body: string }) {
  return (
    <div className="group relative rounded-2xl border border-border bg-card p-8 shadow-card hover:shadow-elev hover:border-accent/40 hover:-translate-y-0.5 transition-all">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-6 font-display text-2xl text-ink tracking-tight">{title}</h3>
      <p className="mt-3 text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function Sample({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? "text-accent font-semibold font-mono" : "text-ink font-medium font-mono"}>{value}</span>
    </div>
  );
}
