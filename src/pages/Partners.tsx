import { Database, FileText, GaugeCircle, ShieldCheck, Workflow, Users, Layers } from "lucide-react";
import { CTARow, Eyebrow, FeatureCard, SectionHeader } from "@/components/atlas/Bits";
import { PageHero } from "./Businesses";

export default function Partners() {
  return (
    <>
      <PageHero
        eyebrow="For Insurance Partners"
        title="Better submissions. Cleaner data. More scalable distribution."
        subtitle="Momo works with insurers, MGAs, reinsurers, Lloyd's brokers, wholesale brokers and capacity providers to improve commercial insurance workflows."
      />

      <section className="section">
        <div className="container-atlas">
          <SectionHeader eyebrow="Partner value proposition" title="Working better with the market." />
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard icon={FileText} title="Better structured submissions">Consistent, complete and machine-readable submissions.</FeatureCard>
            <FeatureCard icon={Database} title="Cleaner underwriting data">Fewer back-and-forth questions, more decision-ready packets.</FeatureCard>
            <FeatureCard icon={GaugeCircle} title="Faster response cycles">Quicker turnaround on quotes, endorsements and queries.</FeatureCard>
            <FeatureCard icon={ShieldCheck} title="Clearer appetite matching">Submissions routed to insurers most likely to write the risk.</FeatureCard>
            <FeatureCard icon={FileText} title="Improved policy checking">Wording and endorsement checks before binding.</FeatureCard>
            <FeatureCard icon={Workflow} title="Better renewal information">Mid-term updates that flow naturally into renewal.</FeatureCard>
            <FeatureCard icon={Layers} title="Stronger audit trails">Every change captured with source data and reviewer.</FeatureCard>
            <FeatureCard icon={Users} title="MGA / program opportunities">A pathway to delegated authority where it makes sense.</FeatureCard>
          </div>
        </div>
      </section>

      <section className="section bg-secondary/40">
        <div className="container-atlas grid lg:grid-cols-2 gap-12">
          <div>
            <SectionHeader eyebrow="Partner types" title="Who we work with." />
            <ul className="mt-8 grid sm:grid-cols-2 gap-2">
              {["Insurers", "MGAs", "Reinsurers", "Lloyd's brokers", "Wholesale brokers", "Capacity providers", "Claims partners", "TPAs"].map((p) => (
                <li key={p} className="rounded-lg border border-border bg-card p-3 text-sm text-ink">{p}</li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeader eyebrow="Data & workflow benefits" title="A more efficient distribution layer." />
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Momo aims to provide cleaner risk data, structured submissions, consistent documentation and
              better servicing workflows - improving combined ratios, response times and broker–insurer
              relationships.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-24 pt-12">
        <div className="container-atlas">
          <div className="rounded-3xl bg-navy text-paper p-10 md:p-14 flex flex-col md:flex-row gap-8 justify-between md:items-end">
            <div>
              <Eyebrow dark>Partnership</Eyebrow>
              <h2 className="mt-4 font-display text-3xl md:text-4xl text-paper max-w-xl">Discuss a partnership with Momo.</h2>
            </div>
            <CTARow dark primaryHref="/contact" primaryLabel="Discuss Partnership" secondaryLabel="Run Insurance Analysis" secondaryHref="/insurance-analysis" />
          </div>
        </div>
      </section>
    </>
  );
}
