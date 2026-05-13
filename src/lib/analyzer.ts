// Mock "AI" analyzer that generates a plausible insurance report from form input.
// All logic is deterministic and runs locally - placeholder for a real model.

export interface AnalysisInput {
  companyName: string;
  website: string;
  contactName: string;
  email: string;
  country: string;
  industry: string;
  revenueRange?: string;
  employeeCount?: string;
  fundingStage?: string;
  customerType?: string;
  sellsToUS?: boolean;
  handlesSensitiveData?: boolean;
  usesAI?: boolean;
  hasInsurance?: boolean;
  renewalDate?: string;
  helpWith?: string;
}

export type RiskLevel = "Low" | "Medium" | "High";
export type Priority = "Essential" | "Recommended" | "Consider later";

export interface RiskItem {
  key: string;
  label: string;
  level: RiskLevel;
  explanation: string;
  missing: string;
}

export interface ProductItem {
  key: string;
  label: string;
  why: string;
  trigger: string;
  priority: Priority;
}

export interface Report {
  snapshot: {
    companyName: string;
    website: string;
    industry: string;
    country: string;
    employees: string;
    revenue: string;
    summary: string;
  };
  risks: RiskItem[];
  products: ProductItem[];
  missingInfo: string[];
  nextSteps: string[];
  scoring: {
    leadScore: number;        // 0–100
    riskScore: number;        // 0–100
    urgency: "Low" | "Medium" | "High";
    nextAction: string;
    likelyProductKeys: string[];
  };
}

const TECH_INDUSTRIES = ["AI company", "SaaS", "Fintech"];
const PROPERTY_INDUSTRIES = ["Property management", "Commercial property"];
const SERVICES_INDUSTRIES = ["Professional services"];

function pickRiskLevel(score: number): RiskLevel {
  if (score >= 7) return "High";
  if (score >= 4) return "Medium";
  return "Low";
}

export function generateReport(i: AnalysisInput): Report {
  const tech = TECH_INDUSTRIES.includes(i.industry);
  const property = PROPERTY_INDUSTRIES.includes(i.industry);
  const services = SERVICES_INDUSTRIES.includes(i.industry) || tech;
  const logistics = i.industry === "Logistics";
  const care = i.industry === "Care services" || i.industry === "Healthcare";
  const hospitality = i.industry === "Hospitality";
  const construction = i.industry === "Construction";
  const retail = i.industry === "Retail";
  const manufacturing = i.industry === "Manufacturing";

  // ----- RISKS
  const risks: RiskItem[] = [];

  const cyberScore = (tech ? 7 : 3) + (i.handlesSensitiveData ? 2 : 0) + (i.sellsToUS ? 1 : 0);
  risks.push({
    key: "cyber",
    label: "Cyber & data risk",
    level: pickRiskLevel(cyberScore),
    explanation: i.handlesSensitiveData
      ? "Handling personal or sensitive data exposes the business to breach costs, regulatory action and business interruption."
      : "Most modern businesses depend on systems, email and SaaS tools that create cyber exposure even without sensitive data.",
    missing: "Data inventory, security controls, incident response plan, breach history.",
  });

  const piScore = services ? 7 : 3;
  risks.push({
    key: "pi",
    label: "Professional liability risk",
    level: pickRiskLevel(piScore),
    explanation: services
      ? "Advice, software outputs and services delivered to clients can give rise to claims for financial loss."
      : "Any contractual deliverable can carry professional liability exposure.",
    missing: "Client contracts, scope-of-work templates, liability caps, claims history.",
  });

  const dnoScore = 4 + (i.fundingStage && i.fundingStage !== "Bootstrapped" ? 3 : 0) + (i.sellsToUS ? 1 : 0);
  risks.push({
    key: "dno",
    label: "Management liability risk",
    level: pickRiskLevel(dnoScore),
    explanation: "Directors and officers can face personal claims relating to governance, employment, regulatory and investor matters.",
    missing: "Cap table, board composition, investor agreements, governance policies.",
  });

  risks.push({
    key: "pl",
    label: "Public liability risk",
    level: pickRiskLevel(property || hospitality || retail || construction ? 7 : 4),
    explanation: "Third-party injury or damage caused by the business, its sites or its activities.",
    missing: "Site list, footfall, contractor controls, prior claims.",
  });

  risks.push({
    key: "el",
    label: "Employers' liability risk",
    level: pickRiskLevel((Number(i.employeeCount?.split("-")[0] || 0) > 0 || i.employeeCount === "1-10") ? 6 : 3),
    explanation: "Employees can suffer injury or illness arising from work - a statutory cover requirement in many jurisdictions.",
    missing: "Headcount, payroll, role types, H&S policies, prior claims.",
  });

  risks.push({
    key: "property",
    label: "Property risk",
    level: pickRiskLevel(property || manufacturing || retail || hospitality ? 7 : 3),
    explanation: "Damage to owned, leased or managed property, fixtures, stock or equipment.",
    missing: "Property schedule, sums insured, occupancy, security and fire controls.",
  });

  risks.push({
    key: "contractual",
    label: "Contractual risk",
    level: pickRiskLevel(services || logistics ? 6 : 4),
    explanation: "Customer contracts often impose insurance requirements, limits, indemnities and notification obligations.",
    missing: "Top customer contracts, MSAs, RFP requirements.",
  });

  risks.push({
    key: "geo",
    label: "Geographic risk",
    level: pickRiskLevel(i.sellsToUS ? 7 : 3),
    explanation: i.sellsToUS
      ? "US exposure increases litigation risk and triggers higher limits, US-specific wording and worldwide jurisdiction clauses."
      : "Single-jurisdiction exposure with standard market wording.",
    missing: "Revenue split by country, US legal entity, US customers list.",
  });

  if (i.usesAI || tech) {
    risks.push({
      key: "ai",
      label: "AI / model risk",
      level: pickRiskLevel(i.usesAI ? 7 : 4),
      explanation: "Use of AI in product or operations creates exposure around model outputs, IP, bias, data use and emerging regulation.",
      missing: "Model inventory, training data sources, human-in-the-loop controls, customer disclosures.",
    });
  }

  if (i.handlesSensitiveData || tech || care) {
    risks.push({
      key: "regulatory",
      label: "Regulatory risk",
      level: pickRiskLevel((i.handlesSensitiveData ? 5 : 0) + (care ? 3 : 0) + (tech ? 2 : 0)),
      explanation: "Data protection, financial services or sector-specific regulators can investigate and impose action.",
      missing: "Regulatory permissions, complaint logs, data subject rights process.",
    });
  }

  // ----- PRODUCTS
  const products: ProductItem[] = [];
  const add = (p: ProductItem) => products.push(p);

  add({ key: "el", label: "Employers' liability", why: "Statutory requirement where employees are present.", trigger: "Employee injury or illness from work.", priority: "Essential" });
  add({ key: "pl", label: "Public liability", why: "Covers third-party injury or property damage caused by the business.", trigger: "Slip/trip claim, damage to client premises.", priority: "Essential" });

  if (services) add({ key: "pi", label: "Professional indemnity", why: "Protects against claims of negligent advice or services.", trigger: "Client alleges loss from your work.", priority: "Essential" });
  if (tech || i.handlesSensitiveData) add({ key: "cyber", label: "Cyber insurance", why: "Covers breach response, business interruption and liability.", trigger: "Ransomware, data breach, business email compromise.", priority: "Essential" });
  if (i.fundingStage && i.fundingStage !== "Bootstrapped") add({ key: "dno", label: "Directors & officers", why: "Protects directors personally for management decisions.", trigger: "Investor, employee or regulator action.", priority: "Recommended" });
  if (tech) add({ key: "techeo", label: "Technology errors & omissions", why: "Combined PI/Cyber wording tailored to technology businesses.", trigger: "Customer claim arising from product failure.", priority: "Recommended" });
  if (property || retail || manufacturing || hospitality) add({ key: "prop", label: "Commercial property", why: "Covers damage to owned or leased property and contents.", trigger: "Fire, escape of water, theft, storm damage.", priority: "Essential" });
  if (property || retail || manufacturing || hospitality) add({ key: "bi", label: "Business interruption", why: "Replaces lost gross profit when operations are disrupted.", trigger: "Property damage causing trading downtime.", priority: "Recommended" });
  if (manufacturing || retail) add({ key: "prodliab", label: "Product liability", why: "Liability for harm caused by products supplied.", trigger: "Defective product injures a third party.", priority: "Essential" });
  if (services || tech) add({ key: "ipmedia", label: "IP / media liability", why: "Covers IP infringement and content-related claims.", trigger: "Trademark or copyright complaint.", priority: "Consider later" });
  if (i.usesAI) add({ key: "ai", label: "AI / model liability cover", why: "Emerging cover for harm from AI outputs and decisions.", trigger: "Customer harmed by model output.", priority: "Consider later" });
  if (logistics) add({ key: "fleet", label: "Motor fleet", why: "Covers commercial vehicle fleet operations.", trigger: "Road traffic incident.", priority: "Essential" });
  if (logistics) add({ key: "git", label: "Goods in transit", why: "Covers goods while being moved.", trigger: "Loss or damage in transit.", priority: "Essential" });
  if (property) add({ key: "pol", label: "Property owners' liability", why: "Liability arising from owned property and tenants.", trigger: "Visitor injury at managed building.", priority: "Essential" });
  add({ key: "crime", label: "Crime / fidelity", why: "Covers theft of money or assets including by employees.", trigger: "Internal fraud, social engineering loss.", priority: "Recommended" });
  add({ key: "legal", label: "Legal expenses", why: "Funds defence and pursuit of legal disputes.", trigger: "Employment tribunal, contract dispute.", priority: "Consider later" });

  // ----- MISSING INFO
  const missingInfo = [
    "Current policy documents (schedules and wordings)",
    "Renewal dates for all policies",
    "Revenue breakdown by activity and country",
    "Employee count and payroll",
    "Claims history (last 5 years)",
    "Top customer contracts and insurance requirements",
    "Data, security and access controls overview",
    "Countries served and regulatory permissions",
    "Property and assets schedule",
    "Existing limits, deductibles and premiums",
  ];

  // ----- NEXT STEPS
  const nextSteps = [
    "Upload existing policy documents for AI policy checking.",
    "Complete the detailed Momo intake form.",
    "Review insurance requirements in your top customer contracts.",
    "Compare current cover against the risks identified above.",
    "Speak with a qualified insurance professional on the Momo team.",
    i.renewalDate
      ? `Prepare market submission ahead of your renewal (${i.renewalDate}).`
      : "Confirm renewal dates so submissions can be prepared in advance.",
  ];

  // ----- SCORING
  const highRisks = risks.filter((r) => r.level === "High").length;
  const mediumRisks = risks.filter((r) => r.level === "Medium").length;
  const riskScore = Math.min(95, 35 + highRisks * 10 + mediumRisks * 5);

  let leadScore = 40;
  if (i.hasInsurance === false) leadScore += 15;
  if (i.renewalDate) leadScore += 15;
  if (i.fundingStage && i.fundingStage !== "Bootstrapped") leadScore += 10;
  if (i.handlesSensitiveData) leadScore += 5;
  if (i.sellsToUS) leadScore += 5;
  if (i.usesAI) leadScore += 5;
  if (Number(i.employeeCount?.split("-")[0] || 0) > 10) leadScore += 5;
  leadScore = Math.min(98, leadScore);

  const urgency: "Low" | "Medium" | "High" =
    i.renewalDate || highRisks >= 3 ? "High" : highRisks >= 1 ? "Medium" : "Low";

  const nextAction =
    urgency === "High"
      ? "Book a review call within 7 days"
      : urgency === "Medium"
      ? "Schedule a review call within 30 days"
      : "Send detailed report and follow up in 60 days";

  return {
    snapshot: {
      companyName: i.companyName,
      website: i.website,
      industry: i.industry,
      country: i.country,
      employees: i.employeeCount || "Not provided",
      revenue: i.revenueRange || "Not provided",
      summary: `${i.companyName} appears to operate in the ${i.industry.toLowerCase()} sector${i.country ? ` from ${i.country}` : ""}${i.usesAI ? ", with AI used in product or operations" : ""}${i.handlesSensitiveData ? " and handling of personal or sensitive data" : ""}. This summary is generated from the information provided and the website you supplied; it should be reviewed by a qualified insurance professional.`,
    },
    risks,
    products,
    missingInfo,
    nextSteps,
    scoring: {
      leadScore,
      riskScore,
      urgency,
      nextAction,
      likelyProductKeys: products.filter((p) => p.priority === "Essential").map((p) => p.key),
    },
  };
}
