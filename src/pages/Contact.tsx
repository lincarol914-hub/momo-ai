import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHero } from "./Businesses";
import { toast } from "sonner";

const schema = z.object({
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
  const [params] = useSearchParams();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: params.get("name") ?? "",
      company: params.get("company") ?? "",
      email: params.get("email") ?? "",
      phone: params.get("phone") ?? "",
      website: params.get("website") ?? "",
      message: params.get("topic")
        ? `I'd like to discuss: ${params.get("topic")}.`
        : params.get("message") ?? "",
    },
  });

  useEffect(() => {
    const topic = params.get("topic");
    if (topic) toast(`Pre-filled with topic: ${topic}`);
  }, [params]);

  const onSubmit = (v: Values) => {
    try {
      const stored = JSON.parse(localStorage.getItem("momo:contact") || "[]");
      stored.push({ ...v, at: new Date().toISOString() });
      localStorage.setItem("momo:contact", JSON.stringify(stored));
    } catch {
      // localStorage may be unavailable; ignore.
    }
    setDone(true);
    toast.success("Thank you. We have received your message and will reply within 2 working days.");
  };

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to Momo."
        subtitle="Questions about cover, pricing or how it works? Drop us a line and we will get back to you."
      />

      <section className="section">
        <div className="container-atlas max-w-2xl">
          {done ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
              <div className="mx-auto h-12 w-12 rounded-full bg-success/10 flex items-center justify-center text-success">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-2xl text-ink">Thank you.</h3>
              <p className="mt-2 text-muted-foreground">We have received your message and will reply within 2 working days.</p>
              <Button className="mt-6" variant="ghost" onClick={() => { setDone(false); form.reset(); }}>Send another</Button>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-2xl border border-border bg-card p-8 shadow-card grid sm:grid-cols-2 gap-5">
              <div className="space-y-1.5"><Label>Name</Label><Input {...form.register("name")} /></div>
              <div className="space-y-1.5"><Label>Company</Label><Input {...form.register("company")} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" {...form.register("email")} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input {...form.register("phone")} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Website</Label><Input placeholder="https://" {...form.register("website")} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Message</Label><Textarea rows={5} {...form.register("message")} /></div>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit" variant="atlas" size="lg">Send Message <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
