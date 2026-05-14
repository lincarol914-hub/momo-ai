// Companies House lookup. The real public API at
// https://api.company-information.service.gov.uk/company/{number}
// requires HTTP Basic Auth with an API key and must be called server-side
// (or via your backend proxy) to avoid CORS and key leakage. This module
// returns mocked-but-deterministic data so the UX is wired today; swap
// `lookupCompaniesHouse` with a real fetch behind your API once you have
// a server endpoint.

export interface CompaniesHouseAddress {
  line1: string;
  city: string;
  postcode: string;
  country: string;
}

export interface CompaniesHouseSic {
  code: string;
  description: string;
}

export interface CompaniesHouseCompany {
  companyNumber: string;
  companyName: string;
  status: "active" | "dissolved" | "liquidation";
  companyType: string;
  incorporatedOn: string;
  registeredAddress: CompaniesHouseAddress;
  sicCodes: CompaniesHouseSic[];
  industry: string;
  officersCount: number;
  hasCharges: boolean;
  accountsLastFiled?: string;
  websiteGuess?: string;
}

// SIC 2007 → Momo industry bucket. Partial list - covers the most common
// codes we'd see on inbound enquiries. Anything unmatched falls through to
// "Other".
const SIC_TO_INDUSTRY: Record<string, string> = {
  "62012": "SaaS",
  "62020": "SaaS",
  "62090": "SaaS",
  "63110": "SaaS",
  "63120": "SaaS",
  "58290": "SaaS",
  "64191": "Fintech",
  "64999": "Fintech",
  "66120": "Fintech",
  "66190": "Fintech",
  "66220": "Fintech",
  "68100": "Commercial property",
  "68201": "Property management",
  "68209": "Property management",
  "68310": "Property management",
  "68320": "Property management",
  "69109": "Professional services",
  "69201": "Professional services",
  "69202": "Professional services",
  "70100": "Professional services",
  "70210": "Professional services",
  "70220": "Professional services",
  "71121": "Professional services",
  "73110": "Professional services",
  "73120": "Professional services",
  "73200": "Professional services",
  "74201": "Professional services",
  "74202": "Professional services",
  "74909": "Professional services",
  "86101": "Healthcare",
  "86102": "Healthcare",
  "86210": "Healthcare",
  "86220": "Healthcare",
  "86230": "Healthcare",
  "86900": "Healthcare",
  "87100": "Care services",
  "87200": "Care services",
  "87300": "Care services",
  "87900": "Care services",
  "88100": "Care services",
  "85100": "Education",
  "85200": "Education",
  "85320": "Education",
  "85590": "Education",
  "47110": "Retail",
  "47190": "Retail",
  "47910": "Retail",
  "47990": "Retail",
  "55100": "Hospitality",
  "55201": "Hospitality",
  "56101": "Hospitality",
  "56102": "Hospitality",
  "56210": "Hospitality",
  "41100": "Construction",
  "41201": "Construction",
  "41202": "Construction",
  "42990": "Construction",
  "43210": "Construction",
  "43220": "Construction",
  "43290": "Construction",
  "43990": "Construction",
  "49410": "Logistics",
  "52100": "Logistics",
  "52290": "Logistics",
  "53200": "Logistics",
  "10110": "Manufacturing",
  "20120": "Manufacturing",
  "25110": "Manufacturing",
  "26110": "Manufacturing",
  "27110": "Manufacturing",
  "28110": "Manufacturing",
  "29100": "Manufacturing",
};

export function sicToIndustry(sicCodes: string[]): string {
  for (const sic of sicCodes) if (SIC_TO_INDUSTRY[sic]) return SIC_TO_INDUSTRY[sic];
  return "Other";
}

export function normaliseCompanyNumber(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function isValidCompanyNumberFormat(raw: string): boolean {
  // UK Companies House numbers are 8 characters: either 8 digits or 2 letters + 6 digits.
  return /^([A-Z]{2}\d{6}|\d{8})$/.test(normaliseCompanyNumber(raw));
}

// --- Mock dataset (deterministic per CH number) ---

const MOCK_NAMES = [
  "ACME TECHNOLOGY LTD",
  "NORTHWIND SOFTWARE LTD",
  "BRAMBLE & SONS LTD",
  "HELIX LABS LTD",
  "LUMEN STUDIOS LTD",
  "PELICAN GROUP LTD",
  "MERIDIAN PARTNERS LTD",
  "STRATA CONSULTING LTD",
];

const MOCK_SIC_BUNDLES: CompaniesHouseSic[][] = [
  [{ code: "62012", description: "Business and domestic software development" }],
  [{ code: "62020", description: "Information technology consultancy activities" }],
  [{ code: "66190", description: "Other activities auxiliary to financial services" }],
  [{ code: "68209", description: "Other letting and operating of own or leased real estate" }],
  [{ code: "69202", description: "Bookkeeping activities" }],
  [{ code: "73110", description: "Advertising agencies" }],
  [{ code: "70210", description: "Public relations and communications activities" }],
  [{ code: "62090", description: "Other information technology service activities" }],
];

const MOCK_ADDRESSES: CompaniesHouseAddress[] = [
  { line1: "1 Tech Square", city: "London", postcode: "EC2A 4DP", country: "United Kingdom" },
  { line1: "12 Innovation Drive", city: "Manchester", postcode: "M1 5AN", country: "United Kingdom" },
  { line1: "44 Northern Quarter", city: "Leeds", postcode: "LS1 3DA", country: "United Kingdom" },
  { line1: "8 Quayside", city: "Edinburgh", postcode: "EH6 6QH", country: "United Kingdom" },
];

function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function lookupCompaniesHouse(raw: string): Promise<CompaniesHouseCompany | null> {
  const num = normaliseCompanyNumber(raw);
  if (!isValidCompanyNumberFormat(num)) return null;

  // Simulate network latency
  await new Promise((r) => setTimeout(r, 650));

  const rand = seededRandom(num);
  const idx = Math.floor(rand() * MOCK_NAMES.length);
  const sicCodes = MOCK_SIC_BUNDLES[idx % MOCK_SIC_BUNDLES.length];
  const incorporatedYear = 2008 + Math.floor(rand() * 16);
  const incorporated = new Date(
    incorporatedYear,
    Math.floor(rand() * 12),
    1 + Math.floor(rand() * 28)
  );
  const name = MOCK_NAMES[idx];

  return {
    companyNumber: num,
    companyName: name,
    status: rand() > 0.05 ? "active" : "liquidation",
    companyType: "Private limited company",
    incorporatedOn: incorporated.toISOString(),
    registeredAddress: MOCK_ADDRESSES[idx % MOCK_ADDRESSES.length],
    sicCodes,
    industry: sicToIndustry(sicCodes.map((s) => s.code)),
    officersCount: 2 + Math.floor(rand() * 6),
    hasCharges: rand() > 0.7,
    accountsLastFiled: new Date(incorporatedYear + 1 + Math.floor(rand() * 5), 11, 31).toISOString(),
    websiteGuess: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`,
  };
}
