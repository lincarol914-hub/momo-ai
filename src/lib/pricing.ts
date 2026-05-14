import type { AnalysisInput } from "./analyzer";
import type { Lead } from "./leads";

// Product catalogue. A real backend would pull these from a CMS / underwriter sheet.
export interface ProductTemplate {
  key: string;
  label: string;
  description: string;
  basePremium: number;     // GBP, baseline annual premium before modifiers
  baseLimit: number;       // GBP, baseline sum insured
  insurers: string[];      // pool of carriers we route to
  appliesTo: (i: AnalysisInput) => boolean;
  priority: "Essential" | "Recommended" | "Consider later";
}

export const PRODUCT_CATALOG: ProductTemplate[] = [
  {
    key: "el",
    label: "Employers' Liability",
    description: "Statutory cover for employee injury or illness arising from work.",
    basePremium: 480,
    baseLimit: 10_000_000,
    insurers: ["Aviva", "AXA", "Zurich", "Allianz"],
    appliesTo: () => true,
    priority: "Essential",
  },
  {
    key: "pl",
    label: "Public Liability",
    description: "Third-party injury or property damage caused by the business.",
    basePremium: 420,
    baseLimit: 2_000_000,
    insurers: ["Hiscox", "Aviva", "AXA"],
    appliesTo: () => true,
    priority: "Essential",
  },
  {
    key: "pi",
    label: "Professional Indemnity",
    description: "Claims of negligent advice, errors or omissions in services delivered.",
    basePremium: 880,
    baseLimit: 1_000_000,
    insurers: ["Hiscox", "Markel", "CFC", "Beazley"],
    appliesTo: (i) =>
      ["AI company", "SaaS", "Fintech", "Professional services"].includes(i.industry),
    priority: "Essential",
  },
  {
    key: "cyber",
    label: "Cyber Insurance",
    description: "Breach response, business interruption and liability following a cyber event.",
    basePremium: 1_200,
    baseLimit: 1_000_000,
    insurers: ["CFC", "Beazley", "Coalition", "Tokio Marine HCC"],
    appliesTo: (i) =>
      !!i.handlesSensitiveData ||
      ["AI company", "SaaS", "Fintech"].includes(i.industry),
    priority: "Essential",
  },
  {
    key: "dno",
    label: "Directors & Officers",
    description: "Personal liability cover for directors and officers.",
    basePremium: 1_500,
    baseLimit: 2_000_000,
    insurers: ["AIG", "Chubb", "Travelers", "Markel"],
    appliesTo: (i) => !!i.fundingStage && i.fundingStage !== "Bootstrapped",
    priority: "Recommended",
  },
  {
    key: "techeo",
    label: "Technology Errors & Omissions",
    description: "Combined PI/Cyber wording tailored to technology businesses.",
    basePremium: 1_800,
    baseLimit: 2_000_000,
    insurers: ["CFC", "Beazley", "Markel"],
    appliesTo: (i) => ["AI company", "SaaS", "Fintech"].includes(i.industry),
    priority: "Recommended",
  },
  {
    key: "property",
    label: "Commercial Property",
    description: "Damage to owned or leased property and contents.",
    basePremium: 850,
    baseLimit: 1_000_000,
    insurers: ["RSA", "Aviva", "Zurich", "Allianz"],
    appliesTo: (i) =>
      ["Property management", "Commercial property", "Retail", "Manufacturing", "Hospitality"].includes(i.industry),
    priority: "Essential",
  },
  {
    key: "bi",
    label: "Business Interruption",
    description: "Replaces lost gross profit when operations are disrupted.",
    basePremium: 620,
    baseLimit: 500_000,
    insurers: ["Aviva", "AXA", "RSA"],
    appliesTo: (i) =>
      ["Property management", "Commercial property", "Retail", "Manufacturing", "Hospitality"].includes(i.industry),
    priority: "Recommended",
  },
  {
    key: "prodliab",
    label: "Product Liability",
    description: "Liability for harm caused by products supplied.",
    basePremium: 700,
    baseLimit: 2_000_000,
    insurers: ["Hiscox", "Markel", "AIG"],
    appliesTo: (i) => ["Manufacturing", "Retail"].includes(i.industry),
    priority: "Essential",
  },
  {
    key: "ai",
    label: "AI / Model Liability",
    description: "Emerging cover for harm from AI outputs, model decisions and bias.",
    basePremium: 1_100,
    baseLimit: 1_000_000,
    insurers: ["Munich Re", "Vouch", "Relm"],
    appliesTo: (i) => !!i.usesAI || i.industry === "AI company",
    priority: "Consider later",
  },
  {
    key: "fleet",
    label: "Motor Fleet",
    description: "Cover for commercial vehicle fleet operations.",
    basePremium: 2_100,
    baseLimit: 5_000_000,
    insurers: ["Aviva", "AXA", "Allianz"],
    appliesTo: (i) => i.industry === "Logistics",
    priority: "Essential",
  },
  {
    key: "git",
    label: "Goods in Transit",
    description: "Cover for goods while being moved.",
    basePremium: 680,
    baseLimit: 250_000,
    insurers: ["RSA", "Aviva"],
    appliesTo: (i) => i.industry === "Logistics",
    priority: "Essential",
  },
  {
    key: "crime",
    label: "Crime / Fidelity",
    description: "Theft of money or assets, including internal fraud and social engineering.",
    basePremium: 360,
    baseLimit: 500_000,
    insurers: ["Hiscox", "Chubb", "AIG"],
    appliesTo: () => true,
    priority: "Recommended",
  },
];

export interface PricedLine {
  productKey: string;
  productLabel: string;
  description: string;
  insurer: string;
  limit: number;
  deductible: number;
  annualPremium: number;
  monthlyPremium: number;
  whyPriced: string;
  priority: "Essential" | "Recommended" | "Consider later";
}

export interface Quote {
  id: string;
  leadId: string;
  createdAt: string;
  validUntil: string;
  status: "draft" | "issued" | "accepted" | "expired";
  currency: "GBP" | "USD" | "EUR";
  lines: PricedLine[];
  totalAnnualPremium: number;
  totalMonthlyPremium: number;
}

const REVENUE_TIER: Record<string, number> = {
  "< £500k": 0.5,
  "£500k–£2m": 1,
  "£2m–£10m": 2.5,
  "£10m–£50m": 6,
  "£50m–£250m": 14,
  "> £250m": 30,
};

const EMPLOYEE_TIER: Record<string, number> = {
  "1-10": 1,
  "11-50": 2.4,
  "51-200": 5,
  "201-500": 10,
  "500+": 22,
};

const INDUSTRY_MULT: Record<string, number> = {
  "AI company": 1.35,
  "SaaS": 1.15,
  "Fintech": 1.4,
  "Professional services": 1.1,
  "Property management": 1.0,
  "Commercial property": 1.05,
  "Logistics": 1.2,
  "Care services": 1.3,
  "Hospitality": 1.1,
  "Construction": 1.45,
  "Retail": 1.05,
  "Manufacturing": 1.25,
  "Healthcare": 1.4,
  "Education": 0.95,
  "Other": 1.0,
};

function revenueMult(rev?: string): number {
  return rev ? REVENUE_TIER[rev] ?? 1 : 1;
}

function employeeMult(emp?: string): number {
  return emp ? EMPLOYEE_TIER[emp] ?? 1 : 1;
}

function industryMult(industry: string, productKey: string): number {
  const base = INDUSTRY_MULT[industry] ?? 1;
  // Tech/cyber products are more sensitive to industry
  if (["cyber", "techeo", "pi", "ai"].includes(productKey)) return base;
  // EL/PL are more sensitive to construction/manufacturing
  if (["el", "pl"].includes(productKey)) {
    if (industry === "Construction" || industry === "Manufacturing") return base * 1.2;
    return Math.min(base, 1.15);
  }
  return Math.min(base, 1.2);
}

function pickInsurer(template: ProductTemplate, lead: Lead): string {
  // Deterministic but lead-specific so it doesn't look random.
  const seed = (lead.id + template.key)
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return template.insurers[seed % template.insurers.length];
}

function computeLimit(template: ProductTemplate, input: AnalysisInput): number {
  const tier = revenueMult(input.revenueRange);
  if (template.key === "el") return 10_000_000; // statutory
  const scaled = template.baseLimit * Math.max(1, Math.sqrt(tier));
  // round to nice numbers
  if (scaled >= 5_000_000) return Math.round(scaled / 1_000_000) * 1_000_000;
  if (scaled >= 1_000_000) return Math.round(scaled / 500_000) * 500_000;
  return Math.round(scaled / 100_000) * 100_000;
}

function computeDeductible(limit: number): number {
  if (limit >= 5_000_000) return 25_000;
  if (limit >= 2_000_000) return 10_000;
  if (limit >= 1_000_000) return 5_000;
  return 2_500;
}

function explain(modifiers: string[], baseline: number, final: number): string {
  const direction = final > baseline ? "uplift" : final < baseline ? "discount" : "baseline";
  if (modifiers.length === 0) return `Baseline market rate for this product.`;
  return `${direction}: ${modifiers.join(", ")}.`;
}

export function priceProduct(template: ProductTemplate, lead: Lead): PricedLine {
  const i = lead.rawInput;
  const modifiers: string[] = [];

  let mult = 1;
  const rev = revenueMult(i.revenueRange);
  if (i.revenueRange) {
    mult *= rev;
    modifiers.push(`revenue ${i.revenueRange} ×${rev.toFixed(2)}`);
  }
  if (template.key === "el") {
    const empM = employeeMult(i.employeeCount);
    mult = Math.max(mult, empM);
    if (i.employeeCount) modifiers.push(`headcount ${i.employeeCount} ×${empM.toFixed(2)}`);
  }
  const indM = industryMult(i.industry, template.key);
  mult *= indM;
  modifiers.push(`industry ${i.industry} ×${indM.toFixed(2)}`);

  if (i.sellsToUS && ["pi", "cyber", "dno", "techeo", "prodliab"].includes(template.key)) {
    mult *= 1.25;
    modifiers.push("US exposure +25%");
  }
  if (i.handlesSensitiveData && ["cyber", "pi"].includes(template.key)) {
    mult *= 1.2;
    modifiers.push("sensitive data +20%");
  }
  if (i.usesAI && ["pi", "cyber", "techeo", "ai"].includes(template.key)) {
    mult *= 1.15;
    modifiers.push("AI use +15%");
  }
  if (i.hasInsurance) {
    mult *= 0.95;
    modifiers.push("existing cover -5%");
  }

  const annualPremium = Math.max(template.basePremium * 0.6, Math.round(template.basePremium * mult));
  const limit = computeLimit(template, i);
  const deductible = computeDeductible(limit);

  return {
    productKey: template.key,
    productLabel: template.label,
    description: template.description,
    insurer: pickInsurer(template, lead),
    limit,
    deductible,
    annualPremium,
    monthlyPremium: Math.round(annualPremium / 12),
    whyPriced: explain(modifiers, template.basePremium, annualPremium),
    priority: template.priority,
  };
}

export function buildQuote(lead: Lead): Quote {
  const applicable = PRODUCT_CATALOG.filter((p) => p.appliesTo(lead.rawInput));
  const lines = applicable.map((t) => priceProduct(t, lead));
  // sort: essential first
  const order = { Essential: 0, Recommended: 1, "Consider later": 2 } as const;
  lines.sort((a, b) => order[a.priority] - order[b.priority] || b.annualPremium - a.annualPremium);

  const total = lines.reduce((acc, l) => acc + l.annualPremium, 0);
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);

  return {
    id: `Q-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    leadId: lead.id,
    createdAt: new Date().toISOString(),
    validUntil: validUntil.toISOString(),
    status: "issued",
    currency: "GBP",
    lines,
    totalAnnualPremium: total,
    totalMonthlyPremium: Math.round(total / 12),
  };
}

const QUOTES_KEY = "momo:quotes";

export function loadQuotes(): Quote[] {
  try {
    return JSON.parse(localStorage.getItem(QUOTES_KEY) || "[]") as Quote[];
  } catch {
    return [];
  }
}

export function saveQuotes(quotes: Quote[]) {
  try {
    localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
  } catch {
    // ignore
  }
}

export function upsertQuote(q: Quote) {
  const all = loadQuotes();
  const i = all.findIndex((x) => x.id === q.id);
  if (i >= 0) all[i] = q;
  else all.unshift(q);
  saveQuotes(all);
  return all;
}

export function quoteByLead(leadId: string): Quote | undefined {
  return loadQuotes().find((q) => q.leadId === leadId);
}

export function formatGBP(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

// --- Ranged pricing (for first-pass quotes with partial info) ---

export type QuoteConfidence = "low" | "medium" | "high";

export interface RangedPricedLine extends PricedLine {
  low: number;
  high: number;
}

export interface RangedQuote {
  id: string;
  leadId: string;
  createdAt: string;
  validUntil: string;
  currency: "GBP" | "USD" | "EUR";
  confidence: QuoteConfidence;
  lines: RangedPricedLine[];
  totalAnnualPremium: number;
  totalMonthlyPremium: number;
  totalLow: number;
  totalHigh: number;
}

// Industry-realistic underwriter spreads for commercial property
// indicative quotes. Mirrors pricing_engine.CONFIDENCE_SPREAD so the
// React app and the Python service quote the same range:
//   * low    (CH-only / no data)  ±25% — first-pass range
//   * medium (partial info)       ±12% — typical indicative quote
//   * high   (full intake)        ±5%  — firm-quote ballpark
// The old ±40% on low conflated outcome variance with pricing
// uncertainty and produced ranges customers didn't trust.
const SPREAD: Record<QuoteConfidence, number> = {
  low: 0.25,
  medium: 0.12,
  high: 0.05,
};

export function priceProductRanged(
  template: ProductTemplate,
  lead: Lead,
  confidence: QuoteConfidence
): RangedPricedLine {
  const base = priceProduct(template, lead);
  const spread = SPREAD[confidence];
  return {
    ...base,
    low: Math.max(template.basePremium * 0.4, Math.round(base.annualPremium * (1 - spread))),
    high: Math.round(base.annualPremium * (1 + spread)),
  };
}

export function buildRangedQuote(lead: Lead, confidence: QuoteConfidence): RangedQuote {
  const applicable = PRODUCT_CATALOG.filter((p) => p.appliesTo(lead.rawInput));
  const lines = applicable.map((t) => priceProductRanged(t, lead, confidence));
  const order = { Essential: 0, Recommended: 1, "Consider later": 2 } as const;
  lines.sort((a, b) => order[a.priority] - order[b.priority] || b.annualPremium - a.annualPremium);

  const total = lines.reduce((acc, l) => acc + l.annualPremium, 0);
  const totalLow = lines.reduce((acc, l) => acc + l.low, 0);
  const totalHigh = lines.reduce((acc, l) => acc + l.high, 0);
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 14);

  return {
    id: `Q-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    leadId: lead.id,
    createdAt: new Date().toISOString(),
    validUntil: validUntil.toISOString(),
    currency: "GBP",
    confidence,
    lines,
    totalAnnualPremium: total,
    totalMonthlyPremium: Math.round(total / 12),
    totalLow,
    totalHigh,
  };
}
