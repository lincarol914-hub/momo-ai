import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eyebrow, SectionHeader } from "@/components/atlas/Bits";
import { PageHero } from "./Businesses";
import { saveLead } from "@/lib/leads";
import { toast } from "sonner";

const INVESTOR_TYPES = ["Family office", "Venture capital", "Private equity", "Strategic / Insurance", "Angel", "Other"];
const schema = z.object({
  name: z.string().trim().min(2).max(120),
  firm: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(200),
  investorType: z.string().min(1, "Required"),
  message: z.string().trim().max(2000).optional(),
});
type Values = z.infer<typeof schema>;

export default function Investors() {
  const [done, setDone] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = (v: Values) => {
    saveLead({
      type: "investor",
      name: v.name,
      company: v.firm,
      email: v.email,
      leadScore: 90,
      urgency: "High",
      nextAction: "Send investor materials",
      payload: v,
    });
    setDone(true);
    toast.success("Request received. Materials will be shared shortly.");
  };

  return (
    <>
      <PageHero
        eyebrow="For Investors"
        title="Building the AI-native consolidation platform for commercial insurance."
        subtitle="Pistachio combines broker acquisition, AI operating infrastructure, commercial insurance distribution, and a pathway to MGA economics."
      />

      <section className="section">
        <div className="container-atlas grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <SectionHeader eyebrow="Investment thesis" title="Why now, and why this model." />
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-3">
            {[
              "Insurance is large and recurring",
              "Broker distribution is fragmented",
              "Many brokers face succession issues",
              "Workflows are still manual",
              "AI can improve operating leverage",
              "Acquisitions provide immediate revenue and data",
              "Platform expands toward MGA economics",
              "Specialist verticals are underserved",
            ].map((s) => (
              <div key={s} className="rounded-lg border border-border bg-card p-4 text-sm text-ink">{s}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-navy text-paper">
        <div className="container-atlas">
          <SectionHeader dark eyebrow="Strategy" title="Acquire, transform, expand." />
          <ol className="mt-12 grid grid-cols-2 md:grid-cols-6 gap-2.5">
            {["Acquire", "Transform with AI", "Improve revenue & EBITDA", "Build structured data", "Expand distribution", "Develop MGA / program infra"].map((s, i) => (
              <li key={s} className="rounded-lg border border-paper/10 bg-paper/[0.03] p-4">
                <div className="font-mono text-[10px] text-paper/40">{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-2 text-sm font-medium text-paper">{s}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container-atlas">
          <SectionHeader eyebrow="Three operating systems" title="The Pistachio platform." />
          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {[
              { tag: "Acquire OS", desc: "Sourcing, diligence, valuation and integration of brokers and MGAs." },
              { tag: "Risk OS", desc: "AI-assisted insurance operations across the policy lifecycle." },
              { tag: "Growth OS", desc: "Prospecting, partnerships and qualified insurance opportunities." },
            ].map((s) => (
              <div key={s.tag} className="rounded-xl border border-border bg-card p-7">
                <div className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Pistachio</div>
                <div className="mt-2 font-display text-2xl text-ink">{s.tag}</div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-secondary/40">
        <div className="container-atlas grid lg:grid-cols-2 gap-12">
          <div>
            <SectionHeader eyebrow="Value creation" title="Where the operating leverage comes from." />
            <ul className="mt-8 grid sm:grid-cols-2 gap-2">
              {["Cross-sell", "Renewal retention", "Admin automation", "Policy checking", "Data clean-up", "Compliance infrastructure", "Margin expansion", "Integration playbook"].map((s) => (
                <li key={s} className="rounded-lg border border-border bg-card p-3 text-sm text-ink">{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeader eyebrow="Long-term vision" title="A new operating company for insurance." />
            <p className="mt-6 text-muted-foreground leading-relaxed text-lg">
              Pistachio aims to become the AI-native operating company for commercial insurance distribution,
              broker consolidation, and specialist MGA infrastructure.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-atlas grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <Eyebrow>Investor materials</Eyebrow>
            <h2 className="mt-4 font-display text-4xl text-ink">Request investor materials.</h2>
            <p className="mt-4 text-muted-foreground">Pistachio shares materials with serious investors only. We'll respond within two working days.</p>
          </div>
          <div className="lg:col-span-7">
            {done ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
                <div className="mx-auto h-12 w-12 rounded-full bg-success/10 flex items-center justify-center text-success">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-2xl text-ink">Request received.</h3>
                <p className="mt-2 text-muted-foreground">Materials will be shared with you shortly.</p>
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-2xl border border-border bg-card p-8 shadow-card grid sm:grid-cols-2 gap-5">
                <div className="space-y-1.5"><Label>Name</Label><Input {...form.register("name")} /></div>
                <div className="space-y-1.5"><Label>Firm</Label><Input {...form.register("firm")} /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Email</Label><Input type="email" {...form.register("email")} /></div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Investor type</Label>
                  <Select onValueChange={(v) => form.setValue("investorType", v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Select investor type" /></SelectTrigger>
                    <SelectContent>{INVESTOR_TYPES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                  {form.formState.errors.investorType && <p className="text-xs text-destructive">{form.formState.errors.investorType.message}</p>}
                </div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Message</Label><Textarea rows={5} {...form.register("message")} /></div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" variant="atlas" size="lg">Request Investor Materials <ArrowRight className="h-4 w-4" /></Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
