import {
  ScanSearch, FileText, Wand2, Crosshair, BadgeCheck, RefreshCw, AlertOctagon, Scale,
  Search, Target, Megaphone, MessageSquare, Handshake, Newspaper, Calendar, GitBranch,
  Globe, Mail, ListChecks, FileSearch, Banknote, Landmark, FileSignature, Activity,
  ShieldCheck, Database, History, Users,
} from "lucide-react";
import { CTARow, Eyebrow, FeatureCard, SectionHeader } from "@/components/atlas/Bits";
import { PageHero } from "./Businesses";

export default function Platform() {
  return (
    <>
      <PageHero
        eyebrow="Platform"
        title="The operating system behind modern insurance distribution."
        subtitle="Three Wombat operating systems — Risk, Growth and Acquire — share a single data, audit and review layer."
      />

      <OS
        tag="Risk OS"
        title="Wombat Risk OS"
        body="Core insurance operations platform for client profiles, risk scans, intake, submissions, underwriting support, quotes, policies, renewals, claims and compliance."
        features={[
          { i: ScanSearch, t: "AI risk scanner", d: "Generate risk profiles from website and intake data." },
          { i: FileText, t: "Dynamic intake", d: "Adaptive proposal forms reused across renewals." },
          { i: Wand2, t: "Submission generator", d: "Insurer-ready submissions, automatically drafted." },
          { i: BadgeCheck, t: "Underwriting copilot", d: "Reasoning support for case-by-case decisions." },
          { i: Crosshair, t: "Market appetite matching", d: "Route risks to insurers likely to write." },
          { i: ListChecks, t: "Quote comparison", d: "Side-by-side comparison of cover and price." },
          { i: FileSearch, t: "Policy checker", d: "Wordings, endorsements, exclusions and gaps." },
          { i: RefreshCw, t: "Renewal engine", d: "Earlier prep, fewer last-minute renewals." },
          { i: AlertOctagon, t: "Claims triage", d: "First-notice triage and routing." },
          { i: Scale, t: "Compliance audit trail", d: "Audit-ready records on every change." },
        ]}
      />

      <OS
        dark
        tag="Growth OS"
        title="Wombat Growth OS"
        body="Growth platform for prospect research, outreach, campaigns, partnerships, content, events, and opportunity handoff."
        features={[
          { i: Search, t: "Prospect research", d: "Ideal-customer signals enriched and scored." },
          { i: Target, t: "Lead scoring", d: "Prioritise opportunities by fit and urgency." },
          { i: Megaphone, t: "Campaign builder", d: "Multi-channel campaigns, on-brand." },
          { i: MessageSquare, t: "Message generator", d: "Personalised outreach at scale." },
          { i: Handshake, t: "Partnership CRM", d: "Track introducers, partners and referrals." },
          { i: Newspaper, t: "Content engine", d: "Sector content tied to product themes." },
          { i: Calendar, t: "Event pipeline", d: "Manage events end-to-end." },
          { i: GitBranch, t: "Handoff workflow", d: "Clean handoff from Growth to Risk OS." },
        ]}
      />

      <OS
        tag="Acquire OS"
        title="Wombat Acquire OS"
        body="Acquisition platform for sourcing, analysing, diligencing, valuing, and integrating brokers, MGAs, and insurance services businesses."
        features={[
          { i: Globe, t: "Target research", d: "Universe of brokers, MGAs and TPAs." },
          { i: Mail, t: "Owner outreach", d: "Discreet, sequenced founder outreach." },
          { i: GitBranch, t: "Deal pipeline", d: "Stage-gated pipeline with playbooks." },
          { i: FileSearch, t: "Due diligence", d: "Commercial, ops and tech diligence." },
          { i: Banknote, t: "Financial analysis", d: "Revenue, retention and cohort analytics." },
          { i: Landmark, t: "Valuation", d: "Multi-method valuation models." },
          { i: FileSignature, t: "Investment memos", d: "Standardised IC-ready memos." },
          { i: Activity, t: "Integration tracker", d: "Day-1 to Day-365 integration plans." },
          { i: BadgeCheck, t: "Synergy tracker", d: "Track realised vs planned synergies." },
        ]}
      />

      <section className="section bg-secondary/40">
        <div className="container-atlas">
          <SectionHeader
            eyebrow="Human review layer"
            title="AI-assisted, human-decided."
            description="Every AI workflow is designed with source data, confidence scoring, approval states and audit history."
          />
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard icon={Database} title="Source data">Every output traces to its underlying data.</FeatureCard>
            <FeatureCard icon={ShieldCheck} title="Confidence scoring">Low-confidence outputs flagged for review.</FeatureCard>
            <FeatureCard icon={Users} title="Approval states">Reviewer states across submissions and recommendations.</FeatureCard>
            <FeatureCard icon={History} title="Audit history">Every change logged for compliance.</FeatureCard>
          </div>
        </div>
      </section>

      <section className="pb-24 pt-12">
        <div className="container-atlas">
          <div className="rounded-3xl bg-navy text-paper p-10 md:p-14 flex flex-col md:flex-row gap-8 justify-between md:items-end">
            <div>
              <Eyebrow dark>See the platform</Eyebrow>
              <h2 className="mt-4 font-display text-3xl md:text-4xl text-paper max-w-xl">Run a Company Insurance Analysis powered by Wombat Risk OS.</h2>
            </div>
            <CTARow dark />
          </div>
        </div>
      </section>
    </>
  );
}

function OS({ tag, title, body, features, dark = false }: {
  tag: string; title: string; body: string;
  features: { i: React.ComponentType<{ className?: string }>; t: string; d: string }[];
  dark?: boolean;
}) {
  return (
    <section className={`section ${dark ? "bg-navy text-paper" : ""}`}>
      <div className="container-atlas">
        <div className="grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-7">
            <SectionHeader dark={dark} eyebrow={`Wombat · ${tag}`} title={title} description={body} />
          </div>
        </div>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ i: Icon, t, d }) => (
            <div key={t} className={`rounded-xl border p-5 ${dark ? "border-paper/10 bg-paper/[0.03]" : "border-border bg-card"}`}>
              <Icon className={`h-5 w-5 ${dark ? "text-accent" : "text-accent"}`} />
              <div className={`mt-4 font-display text-base ${dark ? "text-paper" : "text-ink"}`}>{t}</div>
              <div className={`mt-1.5 text-sm leading-relaxed ${dark ? "text-paper/65" : "text-muted-foreground"}`}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
