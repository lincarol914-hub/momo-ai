import { CTARow, Eyebrow, SectionHeader } from "@/components/atlas/Bits";
import { PageHero } from "./Businesses";

export default function About() {
  return (
    <>
      <PageHero
        eyebrow="About Momo"
        title="Insurance, finally simple."
        subtitle="Momo helps modern businesses understand their insurance needs, compare cover and manage policies in one place."
      />

      <section className="section">
        <div className="container-atlas grid lg:grid-cols-12 gap-14">
          <div className="lg:col-span-5">
            <Eyebrow>Our mission</Eyebrow>
            <h2 className="mt-5 font-display text-4xl text-ink leading-tight">
              Make business insurance clearer, faster and fairer.
            </h2>
          </div>
          <div className="lg:col-span-7 space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              Most business owners buy insurance because they have to, not because they understand it.
              We think that is wrong.
            </p>
            <p>
              Momo uses plain language, smart analysis and real data to help you understand what cover
              you actually need, how much it should cost, and where the gaps are.
            </p>
            <p>
              Every recommendation is reviewed by experienced insurance professionals before it reaches you.
              Technology helps us move faster; people make sure it is right.
            </p>
          </div>
        </div>
      </section>

      <section className="section bg-secondary/40">
        <div className="container-atlas grid md:grid-cols-3 gap-8">
          {[
            { e: "Clarity first", t: "No jargon. No hard sell.", d: "We explain cover in plain English and flag the things that actually matter to your business." },
            { e: "Human review", t: "AI-assisted, people-approved.", d: "Our tools speed up the process, but an experienced broker reviews every recommendation." },
            { e: "Fair pricing", t: "Transparent from the start.", d: "We show you pricing benchmarks and explain why a premium is high or low. No hidden fees." },
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
              <Eyebrow dark>Get in touch</Eyebrow>
              <h2 className="mt-4 font-display text-3xl md:text-4xl text-paper max-w-xl">We would love to hear from you.</h2>
            </div>
            <CTARow dark secondaryLabel="Contact" />
          </div>
        </div>
      </section>
    </>
  );
}
