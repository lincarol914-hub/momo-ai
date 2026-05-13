import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Eyebrow } from "@/components/atlas/Bits";
import { PageHero } from "./Businesses";
import {
  type Lead, LEAD_STATUSES, type LeadStatus, type LeadType,
  clearLeads, deleteLead, getLeads, updateLead,
} from "@/lib/leads";
import { toast } from "sonner";

const TYPE_LABEL: Record<LeadType, string> = {
  insurance_analysis: "Insurance Analysis",
  broker: "Broker Owner",
  partner: "Partner",
  investor: "Investor",
  contact: "Contact",
};

export default function Admin() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const refresh = () => setLeads(getLeads());
    refresh();
    window.addEventListener("atlas:leads-updated", refresh);
    return () => window.removeEventListener("atlas:leads-updated", refresh);
  }, []);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (typeFilter !== "all" && l.type !== typeFilter) return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (!q) return true;
      const hay = `${l.name ?? ""} ${l.company ?? ""} ${l.email ?? ""}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [leads, q, typeFilter, statusFilter]);

  const counts = useMemo(() => {
    const by: Record<string, number> = { all: leads.length };
    for (const l of leads) by[l.type] = (by[l.type] || 0) + 1;
    return by;
  }, [leads]);

  return (
    <>
      <PageHero
        eyebrow="Admin · CRM placeholder"
        title="Momo leads dashboard."
        subtitle="A local view of leads captured by the Momo website. Replace with the production CRM when ready."
      />

      <section className="section">
        <div className="container-atlas space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { l: "All leads", v: counts.all || 0 },
              { l: "Insurance Analysis", v: counts.insurance_analysis || 0 },
              { l: "Broker Owners", v: counts.broker || 0 },
              { l: "Partners", v: counts.partner || 0 },
              { l: "Investors", v: counts.investor || 0 },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-border bg-card p-5">
                <div className="text-xs text-muted-foreground uppercase tracking-[0.16em]">{s.l}</div>
                <div className="mt-2 font-display text-3xl text-ink">{s.v}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by name, company, email…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-56"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {Object.entries(TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-56"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { if (confirm("Clear all leads?")) { clearLeads(); toast.success("Leads cleared"); } }}>
              <Trash2 className="h-4 w-4" /> Clear all
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  <tr>
                    <Th>Submitted</Th><Th>Type</Th><Th>Name</Th><Th>Company</Th><Th>Email</Th>
                    <Th>Score</Th><Th>Urgency</Th><Th>Status</Th><Th>Owner</Th><Th></Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={10} className="p-10 text-center text-muted-foreground">
                      No leads yet. Submit the <Link to="/insurance-analysis" className="text-accent underline">Insurance Analysis</Link> to populate this dashboard.
                    </td></tr>
                  )}
                  {filtered.map((l) => (
                    <tr key={l.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                      <Td className="font-mono text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</Td>
                      <Td><span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-secondary text-ink font-semibold">{TYPE_LABEL[l.type]}</span></Td>
                      <Td className="font-medium text-ink">{l.name || "-"}</Td>
                      <Td>{l.company || "-"}</Td>
                      <Td className="text-muted-foreground">{l.email || "-"}</Td>
                      <Td><ScoreCell value={l.leadScore} /></Td>
                      <Td><UrgencyCell value={l.urgency} /></Td>
                      <Td>
                        <Select value={l.status} onValueChange={(v) => updateLead(l.id, { status: v as LeadStatus })}>
                          <SelectTrigger className="h-8 text-xs w-44"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Td>
                      <Td>
                        <Input className="h-8 text-xs w-28" defaultValue={l.owner || ""} placeholder="Assign…" onBlur={(e) => updateLead(l.id, { owner: e.target.value })} />
                      </Td>
                      <Td className="text-right whitespace-nowrap">
                        <LeadDialog lead={l} />
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete lead?")) deleteLead(l.id); }}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Eyebrow>Placeholder integrations</Eyebrow>
          <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            {["AI API", "CRM", "Email", "Calendar", "Document upload", "Risk OS / Growth OS / Acquire OS"].map((s) => (
              <div key={s} className="rounded-md border border-dashed border-border bg-secondary/40 p-3 text-muted-foreground">{s}</div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="text-left px-4 py-3 font-medium">{children}</th>;
}
function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
function ScoreCell({ value }: { value?: number }) {
  if (!value) return <span className="text-muted-foreground">-</span>;
  const tone = value >= 80 ? "text-accent" : value >= 60 ? "text-ink" : "text-muted-foreground";
  return <span className={`font-mono font-semibold ${tone}`}>{value}</span>;
}
function UrgencyCell({ value }: { value?: "Low" | "Medium" | "High" }) {
  if (!value) return <span className="text-muted-foreground">-</span>;
  const cls = value === "High" ? "bg-destructive/10 text-destructive"
    : value === "Medium" ? "bg-accent/10 text-accent"
    : "bg-success/10 text-success";
  return <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded font-semibold ${cls}`}>{value}</span>;
}

function LeadDialog({ lead }: { lead: Lead }) {
  const [notes, setNotes] = useState(lead.notes || "");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">View</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">{lead.name} · {lead.company}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Type" value={TYPE_LABEL[lead.type]} />
            <Info label="Email" value={lead.email || "-"} />
            <Info label="Status" value={lead.status} />
            <Info label="Score" value={lead.leadScore?.toString() || "-"} />
            <Info label="Urgency" value={lead.urgency || "-"} />
            <Info label="Next action" value={lead.nextAction || "-"} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => updateLead(lead.id, { notes })} />
          </div>
          <div>
            <Label>Payload</Label>
            <pre className="mt-2 max-h-72 overflow-auto rounded-md bg-secondary p-3 text-xs font-mono text-ink">
              {JSON.stringify(lead.payload, null, 2)}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-ink truncate">{value}</div>
    </div>
  );
}
