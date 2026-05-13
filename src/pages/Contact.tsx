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
import { Eyebrow } from "@/components/atlas/Bits";
import { PageHero } from "./Businesses";
import { saveLead, type LeadType } from "@/lib/leads";
import { toast } from "sonner";

const ENQUIRY_TYPES = [
  { label: "I want insurance help for my business", value: "insurance_analysis" as const },
  { label: "I am a broker owner", value: "broker" as const },
  { label: "I am an insurance partner", value: "partner" as const },
  { label: "I am an investor", value: "investor" as const },
  { label: "I want a general conversation", value: "contact" as const },
];

const schema = z.object({
  enquiryType: z.string().min(1, "Required"),
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().max(160).optional(),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
  website: z.string().trim().max(200).optional(),
  message: z.string().trim().min(2, "Tell us a little").max(2000),
});
type Values = z.infer<typeof schema>;

export default function Contact() {
  const [done, setDone] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = (v: Values) => {
    const type = (v.enquiryType as LeadType) || "contact";
    saveLead({
      type,
      name: v.name,
      company: v.company,
      email: v.email,
      leadScore: type === "investor" ? 90 : type === "broker" ? 80 : 60,
      urgency: "Medium",
      nextAction: "Reply within 2 working days",
      payload: v,
    });
    setDone(true);
    toast.success("Thank you. We have received your enquiry and will review it.");
  };

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to Momo."
        subtitle="Whether you're a business looking at cover, a broker owner exploring options, an insurance partner or an investor - start here."
      />

      <section className="section">
        <div className="container-atlas grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <Eyebrow>How we route enquiries</Eyebrow>
            <ul className="mt-6 space-y-4 text-sm">
              {ENQUIRY_TYPES.map((t) => (
                <li key={t.value} className="rounded-lg border border-border bg-card p-4 text-ink">{t.label}</li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-7">
            {done ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
                <div className="mx-auto h-12 w-12 rounded-full bg-success/10 flex items-center justify-center text-success">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-2xl text-ink">Thank you.</h3>
                <p className="mt-2 text-muted-foreground">We have received your enquiry and will review it.</p>
                <Button className="mt-6" variant="ghost" onClick={() => { setDone(false); form.reset(); }}>Send another</Button>
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-2xl border border-border bg-card p-8 shadow-card grid sm:grid-cols-2 gap-5">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Enquiry type</Label>
                  <Select onValueChange={(v) => form.setValue("enquiryType", v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Select enquiry type" /></SelectTrigger>
                    <SelectContent>
                      {ENQUIRY_TYPES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.enquiryType && <p className="text-xs text-destructive">{form.formState.errors.enquiryType.message}</p>}
                </div>
                <div className="space-y-1.5"><Label>Name</Label><Input {...form.register("name")} /></div>
                <div className="space-y-1.5"><Label>Company</Label><Input {...form.register("company")} /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" {...form.register("email")} /></div>
                <div className="space-y-1.5"><Label>Phone</Label><Input {...form.register("phone")} /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Website</Label><Input placeholder="https://" {...form.register("website")} /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Message</Label><Textarea rows={5} {...form.register("message")} /></div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" variant="atlas" size="lg">Submit Enquiry <ArrowRight className="h-4 w-4" /></Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
