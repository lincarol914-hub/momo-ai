import { Link } from "react-router-dom";
import {
  Building2, Cpu, Sparkles, ShieldCheck, ArrowUpRight,
  Briefcase, LineChart, FileSearch, RefreshCw, Scale, ScanSearch,
  Users, Banknote, Globe, Database, Workflow, BadgeCheck, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CTARow, Eyebrow, FeatureCard, SectionHeader, StatTile } from "@/components/atlas/Bits";
import { HeroDashboard } from "@/components/atlas/HeroDashboard";

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy-deep text-paper">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="container-atlas relative pt-20 md:pt-28 pb-16 md:pb-24">
          <div className="grid lg:grid-cols-12 gap-14 items-center">
            <div className="lg:col-span-6 animate-fade-in">
              <Eyebrow dark><span className="text-paper/80">Atlas · Insurance, rebuilt around AI</span></Eyebrow>
              <h1 className="mt-6 font-display text-5xl md:text-6xl lg:text-[68px] leading-[1.02] font-medium text-balance text-paper">
                AI-native insurance infrastructure for modern businesses.
              </h1>
              <p className="mt-7 text-lg md:text-xl text-paper/70 leading-relaxed max-w-xl">
                Atlas combines insurance distribution, broker acquisitions, and AI-powered workflows
                to make commercial insurance faster, clearer, and more data-driven.
              </p>
              <CTARow dark className="mt-9" />
              <div className="mt-14 grid grid-cols-3 gap-6 max-w-lg">
                <StatTile value="9" label="Operating modules" />
                <StatTile value="3" label="Operating systems" />
                <StatTile value="100%" label="Human-reviewed" />
              </div>
            </div>
            <div className="lg:col-span-6 animate-fade-in-slow">
              <HeroDashboard />
            </div>
          </div>
        </div>
        {/* Marquee row of audience badges */}
        <div className="relative border-t border-paper/10">
          <div className="container-atlas py-5 flex flex-wrap items-center gap-x-8 gap-y-2 text-xs uppercase tracking-[0.18em] text-paper/45">
            <span>Built for</span>
            {["AI companies", "SaaS", "Fintech", "Property", "Logistics", "Care", "Hospitality", "Brokers", "MGAs", "Insurers"].map(x => (
              <span key={x}>{x}</span>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT ATLAS DOES */}
      <section className="section">
        <div className="container-atlas">
          <SectionHeader
            eyebrow="What Atlas does"
            title={<>An AI-native platform built across <em className="not-italic text-accent">three layers</em>.</>}
            description="Atlas acquires insurance distribution, operates it on modern AI workflows, and grows it by helping businesses access clearer commercial insurance."
          />
          <div className="mt-14 grid md:grid-cols-3 gap-5">
            <LayerCard
              n="01" title="Acquire"
              body="We acquire and partner with insurance brokers, MGAs, and specialist insurance businesses with strong renewal books and client relationships."
            />
            <LayerCard
              n="02" title="Operate"
              body="We use AI workflows to improve client intake, submissions, underwriting support, quote comparison, policy checking, renewals, claims triage, and compliance."
            />
            <LayerCard
              n="03" title="Grow"
              body="We help businesses understand their insurance needs and access clearer, faster commercial insurance workflows."
            />
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="section bg-secondary/40">
        <div className="container-atlas grid lg:grid-cols-12 gap-14">
          <div className="lg:col-span-5">
            <SectionHeader
              eyebrow="Why a new operating model"
              title={<>Commercial insurance still runs on email, PDFs and spreadsheets.</>}
              description="Clients don't always know what cover they need. Brokers spend too much time on administration. Policies are hard to compare. Renewals are slow and reactive."
            />
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-3">
            {[
              ["Email-driven workflows", "Submissions, follow-ups and queries scattered across inboxes."],
              ["Manual proposal forms", "Repetitive client data captured again at every renewal."],
              ["Opaque policy wording", "Clauses are hard to compare across insurers and years."],
              ["Reactive renewals", "Late submissions, missed appetite windows, weaker terms."],
              ["Fragmented data", "Client risk profiles split across systems, files and people."],
              ["Unclear gaps", "Businesses often discover missing cover only after a problem."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl border border-border bg-card p-5">
                <div className="text-sm font-medium text-ink">{t}</div>
                <div className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APPROACH PROCESS */}
      <section className="section bg-navy text-paper">
        <div className="container-atlas">
          <SectionHeader
            dark
            eyebrow="The Atlas approach"
            title={<>From company analysis to claims, on one continuous workflow.</>}
            description="Each step is AI-assisted and human-reviewed, with source data, confidence scoring and audit history."
          />
          <ol className="mt-14 grid grid-cols-2 md:grid-cols-5 gap-2.5">
            {[
              "Company analysed", "Risks identified", "Insurance needs mapped",
              "Intake completed", "Submission prepared", "Markets approached",
              "Quotes compared", "Policy checked", "Renewal managed", "Claims triaged",
            ].map((step, i) => (
              <li key={step} className="relative rounded-lg border border-paper/10 bg-paper/[0.03] p-4">
                <div className="font-mono text-[10px] text-paper/40">STEP {String(i + 1).padStart(2, "0")}</div>
                <div className="mt-2 text-sm font-medium text-paper">{step}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ANALYSIS CTA */}
      <section className="section">
        <div className="container-atlas">
          <div className="rounded-3xl border border-border bg-gradient-paper p-10 md:p-16 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
            <div className="relative grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7">
                <Eyebrow>Company Insurance Analysis</Eyebrow>
                <h2 className="mt-5 font-display text-4xl md:text-5xl text-ink leading-[1.05] text-balance">
                  See what insurance your company may need.
                </h2>
                <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
                  Enter your company website and Atlas will generate an initial insurance needs and risk
                  analysis — likely exposures, relevant policies, missing information, and next steps.
                </p>
                <div className="mt-8">
                  <Button asChild variant="atlas" size="lg">
                    <Link to="/insurance-analysis">Run Insurance Analysis <ArrowUpRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </div>
              <div className="lg:col-span-5">
                <div className="rounded-xl border border-border bg-card p-6 shadow-elev">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    atlas/analysis
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

      {/* WHO WE SERVE */}
      <section className="section">
        <div className="container-atlas">
          <SectionHeader
            eyebrow="Who we serve"
            title="One platform, many audiences."
          />
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard icon={Cpu} title="AI & technology">Engineering-led businesses with cyber, IP and model risk.</FeatureCard>
            <FeatureCard icon={Sparkles} title="SaaS & fintech">Recurring-revenue businesses with regulated and contract exposures.</FeatureCard>
            <FeatureCard icon={Building2} title="SMEs">Owner-managed businesses needing clearer cover and renewals.</FeatureCard>
            <FeatureCard icon={Globe} title="Property & logistics">Property managers, owners and logistics with physical risk.</FeatureCard>
            <FeatureCard icon={Briefcase} title="Professional services">Consultancies, agencies and advisory firms with PI exposure.</FeatureCard>
            <FeatureCard icon={Users} title="Broker owners">Owners considering succession, partnership or acquisition.</FeatureCard>
            <FeatureCard icon={ShieldCheck} title="Insurers & capacity">Insurers, MGAs, reinsurers and Lloyd's brokers.</FeatureCard>
            <FeatureCard icon={Banknote} title="Investors">Backers of AI, distribution consolidation and MGA infrastructure.</FeatureCard>
          </div>
        </div>
      </section>

      {/* PLATFORM PREVIEW */}
      <section className="section bg-secondary/40">
        <div className="container-atlas">
          <SectionHeader
            eyebrow="Platform"
            title="Three operating systems. One company."
            description="Each Atlas OS targets a distinct part of the insurance value chain — and shares the same data, audit and review layer."
          />
          <div className="mt-14 grid lg:grid-cols-3 gap-5">
            <OSCard
              tag="Risk OS"
              title="Atlas Risk OS"
              body="Core insurance operations: intake, submissions, underwriting support, quotes, policies, renewals, claims and compliance."
              points={["AI risk scanner", "Submission generator", "Policy checker", "Renewal engine"]}
              icon={ScanSearch}
            />
            <OSCard
              tag="Growth OS"
              title="Atlas Growth OS"
              body="Sales, marketing, prospecting, partnerships, campaigns and qualified insurance opportunities."
              points={["Prospect research", "Lead scoring", "Campaign builder", "Handoff workflow"]}
              icon={LineChart}
            />
            <OSCard
              tag="Acquire OS"
              title="Atlas Acquire OS"
              body="Broker sourcing, acquisition analysis, due diligence, valuation, integration and synergy tracking."
              points={["Target research", "Due diligence", "Investment memos", "Integration tracker"]}
              icon={Workflow}
            />
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="ghost">
              <Link to="/platform">Explore the platform <ChevronRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="section">
        <div className="container-atlas grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <SectionHeader
              eyebrow="Trust & human review"
              title={<>Built for regulated insurance workflows.</>}
              description="AI assists with analysis, structure, drafting and comparison. Important decisions require professional review, approval states, and audit trails."
            />
          </div>
          <div className="lg:col-span-6 grid sm:grid-cols-2 gap-4">
            <FeatureCard icon={Database} title="Source data">Every output traces to documents, fields and prompts that produced it.</FeatureCard>
            <FeatureCard icon={BadgeCheck} title="Confidence scoring">Outputs flag low-confidence sections for human review.</FeatureCard>
            <FeatureCard icon={Scale} title="Approval states">Submissions and recommendations move through reviewer states.</FeatureCard>
            <FeatureCard icon={FileSearch} title="Audit history">Every change is logged for compliance and post-incident review.</FeatureCard>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="pb-24">
        <div className="container-atlas">
          <div className="rounded-3xl bg-navy text-paper p-10 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-40" />
            <div className="relative flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
              <div>
                <h2 className="font-display text-4xl md:text-5xl text-paper leading-[1.05] max-w-2xl">
                  Ready to see your company's insurance picture?
                </h2>
                <p className="mt-4 text-paper/70 max-w-xl">
                  Run a free AI-assisted analysis or speak with the Atlas team.
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
    <div className="rounded-xl border border-border bg-card p-7 shadow-card hover:shadow-elev transition-all">
      <div className="font-mono text-xs text-accent">{n}</div>
      <h3 className="mt-4 font-display text-2xl text-ink">{title}</h3>
      <RefreshCw className="hidden" />
      <p className="mt-3 text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function OSCard({ tag, title, body, points, icon: Icon }: { tag: string; title: string; body: string; points: string[]; icon: React.ComponentType<{className?:string}> }) {
  return (
    <div className="rounded-xl border border-border bg-card p-7 shadow-card hover:shadow-elev transition-all flex flex-col">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">{tag}</span>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="mt-5 font-display text-2xl text-ink">{title}</h3>
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
