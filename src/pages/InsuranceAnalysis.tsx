import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2, Globe2, Mail, User, MapPin, Briefcase,
  AlertTriangle, ShieldCheck, ClipboardList, ArrowRight, Sparkles,
  CheckCircle2, Upload, CalendarCheck, FileDown, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CTARow, Disclaimer, Eyebrow, SectionHeader } from "@/components/atlas/Bits";
import { generateReport, type AnalysisInput, type Report } from "@/lib/analyzer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const INDUSTRIES = [
  "AI company", "SaaS", "Fintech", "Professional services", "Property management",
  "Commercial property", "Logistics", "Care services", "Hospitality", "Construction",
  "Retail", "Manufacturing", "Healthcare", "Education", "Other",
];

const REVENUE = ["< £500k", "£500k–£2m", "£2m–£10m", "£10m–£50m", "£50m–£250m", "> £250m"];
const EMPLOYEES = ["1-10", "11-50", "51-200", "201-500", "500+"];
const FUNDING = ["Bootstrapped", "Pre-seed", "Seed", "Series A", "Series B", "Series C+", "PE-backed", "Public"];
const CUSTOMERS = ["B2B SMB", "B2B Mid-market", "B2B Enterprise", "B2C", "Government / Public sector", "Mixed"];

const schema = z.object({
  companyName: z.string().trim().min(2, "Required").max(120),
  website: z.string().trim().min(3, "Required").max(200),
  contactName: z.string().trim().min(2, "Required").max(120),
  email: z.string().trim().email("Valid email required").max(200),
  country: z.string().trim().min(2, "Required").max(80),
  industry: z.string().min(1, "Required"),
  revenueRange: z.string().optional(),
  employeeCount: z.string().optional(),
  fundingStage: z.string().optional(),
  customerType: z.string().optional(),
  sellsToUS: z.boolean().optional(),
  handlesSensitiveData: z.boolean().optional(),
  usesAI: z.boolean().optional(),
  hasInsurance: z.boolean().optional(),
  renewalDate: z.string().optional(),
  helpWith: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function InsuranceAnalysis() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sellsToUS: false,
      handlesSensitiveData: false,
      usesAI: false,
      hasInsurance: false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    // Simulate analysis time so the UI feels considered
    await new Promise((r) => setTimeout(r, 1100));
    const r = generateReport(values as AnalysisInput);

    saveLead({
      type: "insurance_analysis",
      name: values.contactName,
      company: values.companyName,
      email: values.email,
      leadScore: r.scoring.leadScore,
      urgency: r.scoring.urgency,
      nextAction: r.scoring.nextAction,
      payload: { input: values, report: r },
    });

    setReport(r);
    setLoading(false);
    setTimeout(() => {
      document.getElementById("report")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const reset = () => {
    setReport(null);
    form.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-navy-deep text-paper relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="container-atlas relative py-20 md:py-24">
          <Eyebrow dark>Momo · Company Insurance Analysis</Eyebrow>
          <h1 className="mt-6 font-display text-4xl md:text-6xl text-paper leading-[1.05] max-w-3xl text-balance">
            See what insurance your company may need.
          </h1>
          <p className="mt-6 text-lg text-paper/70 max-w-2xl">
            Enter your company details and Momo will generate an initial insurance needs and risk
            analysis - likely exposures, relevant policies, missing information and next steps.
            Outputs are reviewed by a qualified insurance professional before any recommendation is acted on.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="section">
        <div className="container-atlas grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-2xl border border-border bg-card p-8 md:p-10 shadow-card">
              <FieldGroup title="About your company" icon={Building2}>
                <Field label="Company name" error={form.formState.errors.companyName?.message}>
                  <Input placeholder="Acme Ltd" {...form.register("companyName")} />
                </Field>
                <Field label="Company website" error={form.formState.errors.website?.message}>
                  <Input placeholder="https://acme.com" {...form.register("website")} />
                </Field>
                <Field label="Country" error={form.formState.errors.country?.message}>
                  <Input placeholder="United Kingdom" {...form.register("country")} />
                </Field>
                <Field label="Industry" error={form.formState.errors.industry?.message}>
                  <SelectField name="industry" form={form} placeholder="Select industry" options={INDUSTRIES} />
                </Field>
              </FieldGroup>

              <FieldGroup title="Your details" icon={User}>
                <Field label="Contact name" error={form.formState.errors.contactName?.message}>
                  <Input placeholder="Jane Smith" {...form.register("contactName")} />
                </Field>
                <Field label="Work email" error={form.formState.errors.email?.message}>
                  <Input type="email" placeholder="jane@acme.com" {...form.register("email")} />
                </Field>
              </FieldGroup>

              <FieldGroup title="Business profile (optional)" icon={Briefcase}>
                <Field label="Revenue range">
                  <SelectField name="revenueRange" form={form} placeholder="Select" options={REVENUE} />
                </Field>
                <Field label="Employee count">
                  <SelectField name="employeeCount" form={form} placeholder="Select" options={EMPLOYEES} />
                </Field>
                <Field label="Funding stage">
                  <SelectField name="fundingStage" form={form} placeholder="Select" options={FUNDING} />
                </Field>
                <Field label="Main customer type">
                  <SelectField name="customerType" form={form} placeholder="Select" options={CUSTOMERS} />
                </Field>
                <Field label="Upcoming renewal date">
                  <Input type="date" {...form.register("renewalDate")} />
                </Field>
              </FieldGroup>

              <FieldGroup title="Risk indicators (optional)" icon={ShieldCheck}>
                <Toggle form={form} name="sellsToUS" label="Do you sell to the US?" />
                <Toggle form={form} name="handlesSensitiveData" label="Do you handle personal or sensitive data?" />
                <Toggle form={form} name="usesAI" label="Do you use AI in your product or operations?" />
                <Toggle form={form} name="hasInsurance" label="Do you currently have insurance?" />
              </FieldGroup>

              <FieldGroup title="Anything else" icon={ClipboardList}>
                <Field label="What do you want help with?" full>
                  <Textarea
                    rows={4}
                    placeholder="e.g. We're approaching renewal, expanding to the US, and reviewing cyber cover."
                    {...form.register("helpWith")}
                  />
                </Field>
              </FieldGroup>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <p className="text-xs text-muted-foreground max-w-md">
                  By submitting you agree to be contacted about your analysis. Outputs are informational only.
                </p>
                <Button type="submit" variant="atlas" size="lg" disabled={loading}>
                  {loading ? (
                    <><Sparkles className="h-4 w-4 animate-pulse" /> Analysing…</>
                  ) : (
                    <>Generate Insurance Analysis <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-border bg-secondary/40 p-6">
              <Eyebrow>What you'll get</Eyebrow>
              <ul className="mt-4 space-y-3 text-sm">
                {[
                  "Company snapshot",
                  "Likely risk exposures with severity",
                  "Recommended insurance products",
                  "Missing information checklist",
                  "Suggested next steps",
                ].map((s) => (
                  <li key={s} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <span className="text-ink">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Disclaimer>
              This analysis is informational only and does not constitute insurance advice.
              Recommendations should be reviewed by a qualified insurance professional before action is taken.
            </Disclaimer>
          </aside>
        </div>
      </section>

      {report && (
        <section id="report" className="section bg-secondary/40">
          <div className="container-atlas">
            <ReportView report={report} onReset={reset} />
          </div>
        </section>
      )}
    </>
  );
}

/* ---------- Form bits ---------- */

function FieldGroup({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="border-t border-border first:border-t-0 first:pt-0 pt-8 mt-8 first:mt-0">
      <div className="flex items-center gap-2 text-sm font-medium text-ink mb-5">
        <Icon className="h-4 w-4 text-accent" /> {title}
      </div>
      <div className="grid sm:grid-cols-2 gap-5">{children}</div>
    </div>
  );
}

function Field({ label, children, full, error }: { label: string; children: React.ReactNode; full?: boolean; error?: string }) {
  return (
    <div className={cn("space-y-1.5", full && "sm:col-span-2")}>
      <Label className="text-sm">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SelectField({ form, name, placeholder, options }: { form: any; name: string; placeholder: string; options: string[] }) {
  const value = form.watch(name);
  return (
    <Select value={value || ""} onValueChange={(v) => form.setValue(name, v, { shouldValidate: true })}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Toggle({ form, name, label }: { form: any; name: string; label: string }) {
  const value = !!form.watch(name);
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
      <Label className="text-sm cursor-pointer" htmlFor={name}>{label}</Label>
      <Switch id={name} checked={value} onCheckedChange={(v) => form.setValue(name, v)} />
    </div>
  );
}

/* ---------- Report ---------- */

function ReportView({ report, onReset }: { report: Report; onReset: () => void }) {
  const { snapshot, risks, products, missingInfo, nextSteps, scoring } = report;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="rounded-2xl bg-navy text-paper p-8 md:p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="relative grid md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-7">
            <Eyebrow dark>Momo · Insurance Analysis Report</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-4xl text-paper leading-tight">
              {snapshot.companyName}
            </h2>
            <p className="mt-3 text-paper/70 text-sm leading-relaxed">{snapshot.summary}</p>
            <dl className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
              <Meta label="Website" value={snapshot.website} />
              <Meta label="Industry" value={snapshot.industry} />
              <Meta label="Country" value={snapshot.country} />
              <Meta label="Employees" value={snapshot.employees} />
              <Meta label="Revenue" value={snapshot.revenue} />
              <Meta label="Generated" value={new Date().toLocaleDateString()} />
            </dl>
          </div>
          <div className="md:col-span-5 grid grid-cols-2 gap-3">
            <ScoreTile label="Risk score" value={`${scoring.riskScore}/100`} tone="accent" />
            <ScoreTile label="Lead score" value={`${scoring.leadScore}/100`} />
            <ScoreTile label="Urgency" value={scoring.urgency} />
            <ScoreTile label="Next action" value={scoring.nextAction} small />
          </div>
        </div>
      </div>

      {/* Risks */}
      <div>
        <SectionHeader eyebrow="01 · Likely risk exposures" title="Where this business may be exposed." />
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          {risks.map((r) => (
            <div key={r.key} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-display text-lg text-ink">{r.label}</div>
                  <div className="mt-2 text-sm text-muted-foreground leading-relaxed">{r.explanation}</div>
                </div>
                <RiskBadge level={r.level} />
              </div>
              <div className="mt-4 pt-4 border-t border-border text-xs">
                <span className="text-muted-foreground">Missing: </span>
                <span className="text-ink">{r.missing}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Products */}
      <div>
        <SectionHeader eyebrow="02 · Recommended insurance products" title="Cover that may be relevant." />
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.key} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="font-display text-base text-ink">{p.label}</div>
                <PriorityBadge priority={p.priority} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{p.why}</p>
              <p className="mt-2 text-xs text-muted-foreground"><span className="text-ink font-medium">Trigger: </span>{p.trigger}</p>
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-xs text-accent">
                <AlertTriangle className="h-3.5 w-3.5" /> Human review required
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Missing Info */}
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <SectionHeader eyebrow="03 · Missing information" title="Information needed to refine this." />
          <ul className="mt-6 space-y-2.5">
            {missingInfo.map((m) => (
              <li key={m} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-sm">
                <input type="checkbox" className="mt-1 accent-[hsl(var(--accent))]" />
                <span className="text-ink">{m}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SectionHeader eyebrow="04 · Suggested next steps" title="What we'd recommend doing next." />
          <ol className="mt-6 space-y-3">
            {nextSteps.map((s, i) => (
              <li key={s} className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
                <span className="font-mono text-xs text-accent mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm text-ink">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* CTAs */}
      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="atlas"><Link to="/contact"><CalendarCheck className="h-4 w-4" /> Book a Review Call</Link></Button>
          <Button variant="outline" onClick={() => toast.success("Report saved. We'll email it shortly.")}>
            <Mail className="h-4 w-4" /> Send Me This Report
          </Button>
          <Button variant="outline" onClick={() => toast("Document upload coming soon.")}>
            <Upload className="h-4 w-4" /> Upload Policy Documents
          </Button>
          <Button variant="outline" onClick={() => toast("Detailed intake coming soon.")}>
            <FileDown className="h-4 w-4" /> Start Detailed Intake
          </Button>
          <Button variant="ghost" onClick={onReset}><RotateCcw className="h-4 w-4" /> Run a new analysis</Button>
        </div>
      </div>

      <Disclaimer>
        This analysis is informational only and does not constitute insurance advice. Insurance needs vary by
        jurisdiction, insurer appetite, underwriting information, policy wording, and specific business
        circumstances. Any recommendation should be reviewed by a qualified insurance professional before action
        is taken. AI-generated outputs may be incomplete and should be reviewed.
      </Disclaimer>

      <div className="text-center pt-6">
        <CTARow primaryLabel="Run another analysis" primaryHref="#top" secondaryHref="/contact" />
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  const Icon = label === "Website" ? Globe2 : label === "Country" ? MapPin : null;
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.16em] text-paper/50">{label}</dt>
      <dd className="mt-1 text-paper text-sm flex items-center gap-1.5 truncate">
        {Icon && <Icon className="h-3.5 w-3.5 text-paper/60" />} {value}
      </dd>
    </div>
  );
}

function ScoreTile({ label, value, tone, small }: { label: string; value: string; tone?: "accent"; small?: boolean }) {
  return (
    <div className={cn(
      "rounded-xl border p-4",
      tone === "accent" ? "bg-accent/10 border-accent/30" : "bg-paper/[0.04] border-paper/10"
    )}>
      <div className="text-[10px] uppercase tracking-[0.16em] text-paper/55">{label}</div>
      <div className={cn("mt-2 font-display text-paper", small ? "text-sm leading-snug" : "text-2xl")}>{value}</div>
    </div>
  );
}

function RiskBadge({ level }: { level: "Low" | "Medium" | "High" }) {
  const cls = level === "High" ? "bg-destructive/10 text-destructive border-destructive/20"
    : level === "Medium" ? "bg-accent/10 text-accent border-accent/30"
    : "bg-success/10 text-success border-success/20";
  return <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded border font-semibold ${cls}`}>{level}</span>;
}

function PriorityBadge({ priority }: { priority: "Essential" | "Recommended" | "Consider later" }) {
  const cls = priority === "Essential" ? "bg-accent text-accent-foreground"
    : priority === "Recommended" ? "bg-ink text-paper"
    : "bg-secondary text-ink";
  return <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded font-semibold ${cls}`}>{priority}</span>;
}
