import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Building2, MapPin, Calendar, Sparkles, ArrowRight, Phone,
  AlertTriangle, CheckCircle2, FileText, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  backendMode,
  lookupCompaniesHouse,
  isValidCompanyNumberFormat,
  type CompaniesHouseCompany,
} from "@/lib/companiesHouse";
import { buildRangedQuote, formatGBP, type RangedQuote } from "@/lib/pricing";
import type { AnalysisInput, Report } from "@/lib/analyzer";
import { generateReport } from "@/lib/analyzer";
import { createLeadFromAnalysis, type Lead } from "@/lib/leads";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const REVENUE = ["< £500k", "£500k–£2m", "£2m–£10m", "£10m–£50m", "£50m–£250m", "> £250m"];
const EMPLOYEES = ["1-10", "11-50", "51-200", "201-500", "500+"];

export interface RefinedSubmission {
  input: AnalysisInput;
  report: Report;
}

export function UkQuickStart({
  onRefined,
}: {
  // Called when the customer has provided enough to run full Autopilot.
  onRefined: (s: RefinedSubmission) => void;
}) {
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<CompaniesHouseCompany | null>(null);
  const [quote, setQuote] = useState<RangedQuote | null>(null);
  const [refineOpen, setRefineOpen] = useState(false);

  // Refinement fields
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [revenue, setRevenue] = useState<string>("");
  const [employees, setEmployees] = useState<string>("");
  const [sellsToUS, setSellsToUS] = useState(false);
  const [handlesSensitiveData, setHandlesSensitiveData] = useState(false);
  const [usesAI, setUsesAI] = useState(false);
  const [hasInsurance, setHasInsurance] = useState(false);
  const [renewalDate, setRenewalDate] = useState("");

  const reset = () => {
    setNumber("");
    setCompany(null);
    setQuote(null);
    setRefineOpen(false);
    setError(null);
  };

  const lookup = async () => {
    setError(null);
    if (!isValidCompanyNumberFormat(number)) {
      setError("UK Companies House numbers are 8 characters — 8 digits, or 2 letters + 6 digits (e.g. 12345678 or SC123456).");
      return;
    }
    setLoading(true);
    try {
      const co = await lookupCompaniesHouse(number);
      if (!co) {
        setError("Couldn't find that company. Double-check the number, or use the full form below.");
        return;
      }
      setCompany(co);
      // Build a partial lead for indicative pricing — confidence "low".
      const partialInput = buildPartialInput(co);
      const partialReport = generateReport(partialInput);
      const partialLead = createLeadFromAnalysis(partialInput, partialReport);
      setQuote(buildRangedQuote(partialLead, "low"));
    } catch {
      setError("Lookup failed. Please try again or use the full form below.");
    } finally {
      setLoading(false);
    }
  };

  const refine = () => {
    if (!company) return;
    if (contactName.trim().length < 2) { toast.error("Add your name to continue."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Add a valid work email."); return; }

    const input: AnalysisInput = {
      ...buildPartialInput(company),
      contactName: contactName.trim(),
      email: email.trim(),
      revenueRange: revenue || undefined,
      employeeCount: employees || undefined,
      sellsToUS,
      handlesSensitiveData,
      usesAI,
      hasInsurance,
      renewalDate: renewalDate || undefined,
    };
    const report = generateReport(input);
    onRefined({ input, report });
  };

  return (
    <div className="rounded-2xl border border-accent/30 bg-gradient-to-b from-accent/[0.06] to-card p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <Sparkles className="h-3 w-3" /> UK quick start
            </div>
            <BackendBadge mode={backendMode()} />
          </div>
          <h2 className="mt-3 font-display text-2xl md:text-3xl text-ink leading-tight">
            Just have your Companies House number?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl">
            We'll pull what we can from Companies House — name, registered address, SIC codes, status — and generate an
            indicative price range in seconds. Fill in a few more details to tighten it, or just book a call.
          </p>
        </div>
      </div>

      {!company && (
        <div className="mt-6 grid sm:grid-cols-[1fr_auto] gap-3 sm:items-end">
          <div className="space-y-1.5">
            <Label>Companies House number</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="e.g. 12345678 or SC123456"
                className="pl-9 uppercase"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") lookup(); }}
              />
            </div>
            {error && <p className="text-xs text-destructive flex items-start gap-1 mt-1"><AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" /> {error}</p>}
          </div>
          <Button variant="atlas" onClick={lookup} disabled={loading || !number.trim()} className="h-10">
            {loading ? "Looking up…" : (<>Look up <ArrowRight className="h-4 w-4" /></>)}
          </Button>
        </div>
      )}

      {company && quote && (
        <>
          {/* Company card */}
          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-xl text-ink">{company.companyName}</span>
                  <span className={cn(
                    "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold",
                    company.status === "active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  )}>{company.status}</span>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary text-ink font-mono">
                    {company.companyNumber}
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Incorporated {new Date(company.incorporatedOn).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {company.officersCount} officers</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {company.registeredAddress.city}, {company.registeredAddress.postcode}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Industry · {company.industry}</span>
                  {company.sicCodes.map((s) => (
                    <span key={s.code} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-ink">
                      SIC {s.code}
                    </span>
                  ))}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>Try another</Button>
            </div>
          </div>

          {/* Ranged quote */}
          <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">First-pass indicative range</div>
                <div className="mt-1 font-display text-2xl text-ink">
                  {formatGBP(quote.totalLow)} – {formatGBP(quote.totalHigh)}
                  <span className="text-sm text-muted-foreground"> / year</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Confidence: low · based only on Companies House data. Tightens with more info.
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span>{quote.lines.length} cover lines</span>
              </div>
            </div>
            <ul className="divide-y divide-border">
              {quote.lines.map((l) => (
                <li key={l.productKey} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-ink truncate">{l.productLabel}</span>
                      <span className={cn(
                        "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold",
                        l.priority === "Essential" ? "bg-accent text-accent-foreground"
                          : l.priority === "Recommended" ? "bg-ink text-paper"
                          : "bg-secondary text-ink"
                      )}>{l.priority}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{l.description}</div>
                  </div>
                  <div className="text-right shrink-0 font-mono text-sm">
                    {formatGBP(l.low)} – {formatGBP(l.high)}
                    <div className="text-[10px] text-muted-foreground">/ yr</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Refine or book */}
          <div className="mt-5 grid md:grid-cols-2 gap-3">
            <Button variant="atlas" size="lg" onClick={() => setRefineOpen((v) => !v)}>
              {refineOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Tighten my quote (2 min)
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link
                to={`/contact?company=${encodeURIComponent(company.companyName)}&topic=${encodeURIComponent(
                  `Quick-start quote for Companies House ${company.companyNumber}`
                )}`}
              >
                <Phone className="h-4 w-4" /> Just book a call instead
              </Link>
            </Button>
          </div>

          {refineOpen && (
            <div className="mt-5 rounded-xl border border-border bg-secondary/40 p-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                The bits Companies House doesn't give us. These tighten the range to ±5%.
              </div>
              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <RefineField label="Your name">
                  <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Jane Smith" />
                </RefineField>
                <RefineField label="Work email">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@acme.com" />
                </RefineField>
                <RefineField label="Annual revenue">
                  <SimpleSelect value={revenue} onChange={setRevenue} options={REVENUE} placeholder="Select" />
                </RefineField>
                <RefineField label="Employees">
                  <SimpleSelect value={employees} onChange={setEmployees} options={EMPLOYEES} placeholder="Select" />
                </RefineField>
                <RefineField label="Upcoming renewal">
                  <Input type="date" value={renewalDate} onChange={(e) => setRenewalDate(e.target.value)} />
                </RefineField>
                <div className="hidden sm:block" />
                <RefineToggle label="Do you sell to the US?" checked={sellsToUS} onChange={setSellsToUS} />
                <RefineToggle label="Handle personal / sensitive data?" checked={handlesSensitiveData} onChange={setHandlesSensitiveData} />
                <RefineToggle label="Use AI in product or operations?" checked={usesAI} onChange={setUsesAI} />
                <RefineToggle label="Currently have insurance?" checked={hasInsurance} onChange={setHasInsurance} />
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  Submitting runs full Momo Autopilot: priced quote, auto-booked review and welcome email.
                </div>
                <Button variant="atlas" size="lg" onClick={refine}>
                  Tighten quote & continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function buildPartialInput(co: CompaniesHouseCompany): AnalysisInput {
  return {
    companyName: co.companyName,
    website: co.websiteGuess ?? "",
    contactName: "Not provided",
    email: "unknown@example.com",
    country: "United Kingdom",
    industry: co.industry,
    sellsToUS: false,
    handlesSensitiveData: false,
    usesAI: false,
    hasInsurance: false,
  };
}

function BackendBadge({ mode }: { mode: "live" | "mock" }) {
  if (mode === "live") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-success"
        title="Connected to the Momo pricing service — Companies House lookups go through the real API."
      >
        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
        Live backend
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
      title="No backend URL configured (VITE_PRICING_API_URL). Returning deterministic mock data so the UI keeps working in standalone demos."
    >
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
      Mock data
    </span>
  );
}

function RefineField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function RefineToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2.5">
      <Label className="text-sm cursor-pointer">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SimpleSelect({
  value, onChange, options, placeholder,
}: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

// Lead type is unused here directly but re-exported helpers reference it.
export type { Lead };
