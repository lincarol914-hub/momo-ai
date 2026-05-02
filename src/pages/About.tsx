import { CTARow, Eyebrow, SectionHeader } from "@/components/atlas/Bits";
import { PageHero } from "./Businesses";

export default function About() {
  return (
    <>
      <PageHero
        eyebrow="About Atlas"
        title="Rebuilding commercial insurance around better workflows, better data, and better operating leverage."
        subtitle="Atlas is building an AI-native insurance platform focused on commercial insurance distribution, broker transformation, and specialist risk infrastructure."
      />

      <section className="section">
        <div className="container-atlas grid lg:grid-cols-12 gap-14">
          <div className="lg:col-span-5">
            <Eyebrow>Our mission</Eyebrow>
            <h2 className="mt-5 font-display text-4xl text-ink leading-tight">
              Make commercial insurance faster, clearer and more data-driven.
            </h2>
          </div>
          <div className="lg:col-span-7 space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              The future of insurance will not be built by replacing human expertise, but by giving brokers,
              underwriters, operators and clients better tools.
            </p>
            <p>
              Atlas combines acquisition-led growth with AI-enabled operations to create a more scalable,
              specialist insurance platform — one that respects the regulated, relationship-driven nature of
              the industry while modernising its operating model.
            </p>
          </div>
        </div>
      </section>

      <section className="section bg-secondary/40">
        <div className="container-atlas grid md:grid-cols-3 gap-8">
          {[
            { e: "Our approach", t: "Acquire, transform, grow.", d: "We invest in established insurance businesses and add the operating layer they need to scale." },
            { e: "Human review & trust", t: "AI-assisted, human-decided.", d: "Every AI workflow is paired with source data, confidence scoring and reviewer approvals." },
            { e: "What we're building", t: "An operating company for commercial insurance.", d: "Three operating systems, one shared data layer — across distribution and specialist MGA infrastructure." },
          ].map((b) => (
            <div key={b.e} className="rounded-2xl border border-border bg-card p-8">
              <Eyebrow>{b.e}</Eyebrow>
              <h3 className="mt-4 font-display text-2xl text-ink">{b.t}</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-24 pt-12">
        <div className="container-atlas">
          <div className="rounded-3xl bg-navy text-paper p-10 md:p-14 flex flex-col md:flex-row gap-8 justify-between md:items-end">
            <div>
              <Eyebrow dark>Talk to Atlas</Eyebrow>
              <h2 className="mt-4 font-display text-3xl md:text-4xl text-paper max-w-xl">Whatever brings you here, we'd like to hear from you.</h2>
            </div>
            <CTARow dark secondaryLabel="Contact" />
          </div>
        </div>
      </section>
    </>
  );
}
