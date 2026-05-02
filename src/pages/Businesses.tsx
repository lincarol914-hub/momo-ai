import { Link } from "react-router-dom";
import {
  Briefcase, Building2, Cpu, Globe2, HeartPulse, Hotel, ShieldCheck, Truck,
  HardHat, Sparkles, ScrollText, FileSearch, RefreshCw, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CTARow, Eyebrow, FeatureCard, SectionHeader } from "@/components/atlas/Bits";

export default function Businesses() {
  return (
    <>
      <PageHero
        eyebrow="For Businesses"
        title="Commercial insurance made clearer."
        subtitle="Pistachio helps businesses understand their risks, prepare better insurance information, compare options, and manage policies more efficiently."
      />

      <section className="section">
        <div className="container-atlas grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <SectionHeader
              eyebrow="The problem"
              title="Insurance shouldn't feel like a black box."
              description="Most commercial insurance is still bought through repetitive forms, opaque wordings and last-minute renewals."
            />
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-3">
            {[
              "Insurance requirements are confusing",
              "Proposal forms are repetitive",
              "Quotes are hard to compare",
              "Policies are difficult to read",
              "Renewals happen too late",
              "Claims processes are stressful",
            ].map((s) => (
              <div key={s} className="rounded-lg border border-border bg-card p-4 text-sm text-ink">{s}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-secondary/40">
        <div className="container-atlas">
          <SectionHeader eyebrow="What Pistachio helps with" title="A clearer path through commercial insurance." />
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard icon={FileSearch} title="Insurance needs analysis">Initial AI-assisted view of your exposures and likely cover.</FeatureCard>
            <FeatureCard icon={ShieldCheck} title="Risk profile creation">A structured profile of your business risks and controls.</FeatureCard>
            <FeatureCard icon={ScrollText} title="Intake & proposal support">Reusable, structured intake — no repeating yourself each year.</FeatureCard>
            <FeatureCard icon={Sparkles} title="Quote comparison">Side-by-side comparison across insurers and wordings.</FeatureCard>
            <FeatureCard icon={ScrollText} title="Policy checking">Plain-language summary of cover, limits and exclusions.</FeatureCard>
            <FeatureCard icon={RefreshCw} title="Renewal preparation">Submissions prepared in advance, not in the final week.</FeatureCard>
            <FeatureCard icon={Mail} title="Claims notification">Faster, clearer notifications and triage support.</FeatureCard>
            <FeatureCard icon={Briefcase} title="Document organisation">Your policies, certificates and contracts in one place.</FeatureCard>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-atlas">
          <SectionHeader eyebrow="Business segments" title="We work across modern commercial sectors." />
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { i: Cpu, t: "AI & SaaS" },
              { i: Sparkles, t: "Fintech" },
              { i: Building2, t: "SMEs" },
              { i: Briefcase, t: "Professional services" },
              { i: Globe2, t: "Property managers" },
              { i: Building2, t: "Commercial property" },
              { i: Truck, t: "Logistics" },
              { i: HeartPulse, t: "Care & healthcare" },
              { i: Hotel, t: "Hospitality" },
              { i: HardHat, t: "Construction" },
            ].map(({ i: Icon, t }) => (
              <div key={t} className="rounded-xl border border-border bg-card p-5 flex flex-col items-start gap-3 hover:shadow-elev transition-shadow">
                <Icon className="h-5 w-5 text-accent" />
                <div className="text-sm font-medium text-ink">{t}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-secondary/40">
        <div className="container-atlas">
          <SectionHeader eyebrow="Products we can help review" title="Cover Pistachio can help you scope and compare." />
          <div className="mt-10 flex flex-wrap gap-2">
            {[
              "Employers' liability", "Public liability", "Professional indemnity", "Cyber",
              "D&O", "Technology E&O", "Commercial property", "Business interruption",
              "Product liability", "Management liability", "Legal expenses", "Crime / fidelity",
              "Motor fleet", "Goods in transit", "IP / media liability", "Specialist policies",
            ].map((p) => (
              <span key={p} className="rounded-full border border-border bg-card px-4 py-2 text-sm text-ink">{p}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24 pt-8">
        <div className="container-atlas">
          <div className="rounded-3xl bg-navy text-paper p-10 md:p-14 flex flex-col md:flex-row gap-8 justify-between md:items-end">
            <div>
              <Eyebrow dark>Get started</Eyebrow>
              <h2 className="mt-4 font-display text-3xl md:text-4xl text-paper max-w-xl">
                Start with a free Company Insurance Analysis.
              </h2>
            </div>
            <CTARow dark />
          </div>
        </div>
      </section>
    </>
  );
}

export function PageHero({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <section className="bg-navy-deep text-paper relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="container-atlas relative py-20 md:py-24">
        <Eyebrow dark>{eyebrow}</Eyebrow>
        <h1 className="mt-6 font-display text-4xl md:text-6xl text-paper leading-[1.05] max-w-3xl text-balance">{title}</h1>
        <p className="mt-6 text-lg text-paper/70 max-w-2xl">{subtitle}</p>
        <div className="mt-8">
          <Button asChild variant="accent" size="lg"><Link to="/insurance-analysis">Run Insurance Analysis</Link></Button>
        </div>
      </div>
    </section>
  );
}
