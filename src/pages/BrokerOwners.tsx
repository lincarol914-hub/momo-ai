import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CTARow, Eyebrow, FeatureCard, SectionHeader, Disclaimer } from "@/components/atlas/Bits";
import { PageHero } from "./Businesses";
import { saveLead } from "@/lib/leads";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
  businessType: z.string().trim().min(2).max(120),
  revenue: z.string().trim().max(60).optional(),
  location: z.string().trim().max(120).optional(),
  message: z.string().trim().max(2000).optional(),
});
type Values = z.infer<typeof schema>;

export default function BrokerOwners() {
  const [done, setDone] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = (v: Values) => {
    saveLead({
      type: "broker",
      name: v.name,
      company: v.company,
      email: v.email,
      leadScore: 80,
      urgency: "Medium",
      nextAction: "Confidential conversation with founders",
      payload: v,
    });
    setDone(true);
    toast.success("Message received. We'll be in touch confidentially.");
  };

  return (
    <>
      <PageHero
        eyebrow="For Broker Owners"
        title="Preserve your legacy. Modernise your platform."
        subtitle="Momo partners with and acquires insurance brokers, MGAs and specialist insurance businesses, then supports them with AI-powered operating infrastructure."
      />

      <section className="section">
        <div className="container-atlas grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <SectionHeader
              eyebrow="Why broker owners talk to Momo"
              title="Succession, growth or modernisation - on your terms."
            />
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-3">
            {[
              "Succession planning", "Retirement", "Growth capital", "Operational support",
              "Technology upgrade", "Client continuity", "Staff continuity", "Reduced admin burden",
              "Access to AI workflows", "Stronger reporting and compliance",
            ].map((s) => (
              <div key={s} className="rounded-lg border border-border bg-card p-4 text-sm text-ink">{s}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-secondary/40">
        <div className="container-atlas grid lg:grid-cols-2 gap-10">
          <div>
            <SectionHeader
              eyebrow="Our approach"
              title="We preserve what makes a broker valuable."
              description="We are not looking to strip out what makes a broker valuable. We focus on preserving client relationships, supporting staff, improving operations, and adding technology that helps the business grow."
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {["Client relationships preserved", "Staff supported", "Operations improved", "Technology added"].map((s) => (
              <div key={s} className="rounded-lg border border-border bg-card p-5 flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-sm text-ink">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-atlas grid lg:grid-cols-2 gap-10">
          <div>
            <SectionHeader eyebrow="What we look for" title="Target businesses." />
            <ul className="mt-8 grid sm:grid-cols-2 gap-2">
              {[
                "Commercial insurance brokers", "Specialist brokers", "Cyber brokers",
                "Professional indemnity brokers", "Property brokers", "MGAs", "TPAs",
                "Claims administrators", "Wholesale brokers", "Insurance services businesses",
              ].map((s) => (
                <li key={s} className="rounded-lg border border-border bg-card p-3 text-sm text-ink">{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeader eyebrow="Criteria" title="What we look at." />
            <ul className="mt-8 grid sm:grid-cols-2 gap-2">
              {[
                "Recurring revenue", "Strong renewal book", "Loyal customers",
                "Owner succession situation", "Cross-sell opportunity",
                "Manual workflows", "Technology improvement potential",
              ].map((s) => (
                <li key={s} className="rounded-lg border border-border bg-card p-3 text-sm text-ink">{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section bg-secondary/40">
        <div className="container-atlas">
          <SectionHeader eyebrow="Post-acquisition support" title="What we bring on day one." />
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard title="Client data clean-up">Standardised, structured data across the renewal book.</FeatureCard>
            <FeatureCard title="Renewal workflow">Earlier preparation, better submissions, stronger terms.</FeatureCard>
            <FeatureCard title="Policy checking">AI-assisted review of cover, limits and exclusions.</FeatureCard>
            <FeatureCard title="Cross-sell identification">Find clients under-covered against their actual risk.</FeatureCard>
            <FeatureCard title="Compliance file review">Audit-ready files and records.</FeatureCard>
            <FeatureCard title="AI-assisted admin">Reduced manual work for fee-earning teams.</FeatureCard>
            <FeatureCard title="Better reporting">Real-time visibility on book, pipeline and renewals.</FeatureCard>
            <FeatureCard title="Integration support">Hands-on support during transition.</FeatureCard>
          </div>
        </div>
      </section>

      {/* Confidential form */}
      <section className="section">
        <div className="container-atlas grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <Eyebrow><Lock className="h-3 w-3" /> Confidential</Eyebrow>
            <h2 className="mt-5 font-display text-4xl text-ink">Start a confidential conversation.</h2>
            <p className="mt-4 text-muted-foreground">All enquiries are handled discreetly by the Momo founders. No third-party brokers, no shared data.</p>
            <Disclaimer>Submitting this form does not create any obligation. Momo will only contact you with regard to your enquiry.</Disclaimer>
          </div>
          <div className="lg:col-span-7">
            {done ? (
              <SuccessState onReset={() => { setDone(false); form.reset(); }} />
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-2xl border border-border bg-card p-8 shadow-card grid sm:grid-cols-2 gap-5">
                <div className="space-y-1.5"><Label>Name</Label><Input {...form.register("name")} /></div>
                <div className="space-y-1.5"><Label>Company</Label><Input {...form.register("company")} /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" {...form.register("email")} /></div>
                <div className="space-y-1.5"><Label>Phone</Label><Input {...form.register("phone")} /></div>
                <div className="space-y-1.5"><Label>Business type</Label><Input placeholder="e.g. Commercial broker" {...form.register("businessType")} /></div>
                <div className="space-y-1.5"><Label>Approximate revenue</Label><Input placeholder="£" {...form.register("revenue")} /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Location</Label><Input {...form.register("location")} /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Message</Label><Textarea rows={5} {...form.register("message")} /></div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" variant="atlas" size="lg">Send confidentially <ArrowRight className="h-4 w-4" /></Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="pb-24"><div className="container-atlas"><CTARow /></div></section>
    </>
  );
}

function SuccessState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
      <div className="mx-auto h-12 w-12 rounded-full bg-success/10 flex items-center justify-center text-success">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-display text-2xl text-ink">Message received.</h3>
      <p className="mt-2 text-muted-foreground">An Momo founder will be in touch within two working days, confidentially.</p>
      <Button variant="ghost" className="mt-5" onClick={onReset}>Send another message</Button>
    </div>
  );
}
