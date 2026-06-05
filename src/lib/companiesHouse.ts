// Companies House lookup.
//
// Companies House (https://api.company-information.service.gov.uk) requires
// HTTP Basic Auth with an API key and doesn't send permissive CORS headers,
// so the browser can't call it directly. It has to go through a server-side
// proxy — in our case the FastAPI service in pricing/api.py.
//
// This module talks to that proxy when VITE_PRICING_API_URL is set in the
// build env (e.g. .env.local). Without it, it falls back to deterministic
// mock data so the UI keeps working in standalone demos. ``backendMode()``
// lets the UI show a "live" / "mocked" badge so it's never ambiguous which
// path is in use.

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
  /**
   * Where the record came from:
   * - "known" - hand-curated record for a well-known UK company so demos
   *   show real-looking data without a backend.
   * - "live"  - fetched through the VITE_PRICING_API_URL pricing service,
   *   which calls the real Companies House API.
   * - "mock"  - deterministic synthetic data; we couldn't resolve the
   *   number or name from either of the above.
   */
  source: "known" | "live" | "mock";
}

// SIC 2007 → Momo industry bucket. Partial list — covers the most common
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

// --- Curated demo companies ---
//
// Hand-built records for well-known UK companies so the demo shows
// real-looking data without needing the live CH backend. Data sourced
// from the public Companies House register. Every record here is also
// keyed by lowercased name aliases for free-text search.
//
// To extend: add a (number -> CompaniesHouseCompany) entry, then map
// every alias the user might type to the same number in NAME_ALIASES.

const KNOWN_COMPANIES: Record<string, CompaniesHouseCompany> = {
  "00502851": {
    companyNumber: "00502851",
    companyName: "GREGGS PLC",
    status: "active",
    companyType: "Public limited company",
    incorporatedOn: "1951-07-27",
    registeredAddress: {
      line1: "Greggs House, Quorum Business Park",
      city: "Newcastle upon Tyne",
      postcode: "NE12 8BU",
      country: "United Kingdom",
    },
    sicCodes: [
      { code: "10710", description: "Manufacture of bread; manufacture of fresh pastry goods and cakes" },
      { code: "56102", description: "Unlicensed restaurants and cafes" },
    ],
    industry: "Hospitality",
    officersCount: 9,
    hasCharges: false,
    accountsLastFiled: "2024-12-28",
    websiteGuess: "greggs.co.uk",
    source: "known",
  },
  "01709784": {
    companyNumber: "01709784",
    companyName: "J D WETHERSPOON PLC",
    status: "active",
    companyType: "Public limited company",
    incorporatedOn: "1983-05-10",
    registeredAddress: {
      line1: "Wetherspoon House, Central Park",
      city: "Watford",
      postcode: "WD24 4QL",
      country: "United Kingdom",
    },
    sicCodes: [{ code: "56302", description: "Public houses and bars" }],
    industry: "Hospitality",
    officersCount: 7,
    hasCharges: true,
    accountsLastFiled: "2024-07-28",
    websiteGuess: "jdwetherspoon.com",
    source: "known",
  },
  "00445790": {
    companyNumber: "00445790",
    companyName: "TESCO PLC",
    status: "active",
    companyType: "Public limited company",
    incorporatedOn: "1947-11-27",
    registeredAddress: {
      line1: "Tesco House, Shire Park, Kestrel Way",
      city: "Welwyn Garden City",
      postcode: "AL7 1GA",
      country: "United Kingdom",
    },
    sicCodes: [
      { code: "47110", description: "Retail sale in non-specialised stores with food, beverages or tobacco predominating" },
    ],
    industry: "Retail",
    officersCount: 11,
    hasCharges: true,
    accountsLastFiled: "2025-02-22",
    websiteGuess: "tesco.com",
    source: "known",
  },
  "00185647": {
    companyNumber: "00185647",
    companyName: "J SAINSBURY PLC",
    status: "active",
    companyType: "Public limited company",
    incorporatedOn: "1922-06-14",
    registeredAddress: {
      line1: "33 Holborn",
      city: "London",
      postcode: "EC1N 2HT",
      country: "United Kingdom",
    },
    sicCodes: [
      { code: "47110", description: "Retail sale in non-specialised stores with food, beverages or tobacco predominating" },
    ],
    industry: "Retail",
    officersCount: 10,
    hasCharges: true,
    accountsLastFiled: "2024-03-02",
    websiteGuess: "sainsburys.co.uk",
    source: "known",
  },
  "04256886": {
    companyNumber: "04256886",
    companyName: "MARKS AND SPENCER GROUP P.L.C.",
    status: "active",
    companyType: "Public limited company",
    incorporatedOn: "2001-08-23",
    registeredAddress: {
      line1: "Waterside House, 35 North Wharf Road",
      city: "London",
      postcode: "W2 1NW",
      country: "United Kingdom",
    },
    sicCodes: [
      { code: "47110", description: "Retail sale in non-specialised stores with food, beverages or tobacco predominating" },
      { code: "47190", description: "Other retail sale in non-specialised stores" },
    ],
    industry: "Retail",
    officersCount: 12,
    hasCharges: true,
    accountsLastFiled: "2024-03-30",
    websiteGuess: "marksandspencer.com",
    source: "known",
  },
  "00233462": {
    companyNumber: "00233462",
    companyName: "JOHN LEWIS PARTNERSHIP PLC",
    status: "active",
    companyType: "Public limited company",
    incorporatedOn: "1928-04-27",
    registeredAddress: {
      line1: "171 Victoria Street",
      city: "London",
      postcode: "SW1E 5NN",
      country: "United Kingdom",
    },
    sicCodes: [
      { code: "47190", description: "Other retail sale in non-specialised stores" },
    ],
    industry: "Retail",
    officersCount: 13,
    hasCharges: false,
    accountsLastFiled: "2024-01-27",
    websiteGuess: "johnlewispartnership.co.uk",
    source: "known",
  },
};

// Lower-cased aliases -> CH number. Tweak freely.
const NAME_ALIASES: Record<string, string> = {
  greggs: "00502851",
  "greggs plc": "00502851",
  wetherspoon: "01709784",
  wetherspoons: "01709784",
  spoons: "01709784",
  "jd wetherspoon": "01709784",
  "j d wetherspoon": "01709784",
  "j d wetherspoon plc": "01709784",
  tesco: "00445790",
  "tesco plc": "00445790",
  sainsbury: "00185647",
  sainsburys: "00185647",
  "sainsbury's": "00185647",
  "j sainsbury": "00185647",
  "m&s": "04256886",
  "marks and spencer": "04256886",
  "marks & spencer": "04256886",
  "john lewis": "00233462",
  "john lewis partnership": "00233462",
};

export interface DemoCompanyRef {
  number: string;
  name: string;
}

export function demoCompanies(): DemoCompanyRef[] {
  return Object.values(KNOWN_COMPANIES).map((c) => ({
    number: c.companyNumber,
    name: c.companyName,
  }));
}

function lookupKnown(raw: string): CompaniesHouseCompany | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Number match (8 chars, alphanumeric).
  const num = normaliseCompanyNumber(trimmed);
  if (isValidCompanyNumberFormat(num) && KNOWN_COMPANIES[num]) {
    return KNOWN_COMPANIES[num];
  }

  // Name alias match (case-insensitive, ignores extra whitespace).
  const aliasKey = trimmed.toLowerCase().replace(/\s+/g, " ");
  const matchedNumber = NAME_ALIASES[aliasKey];
  if (matchedNumber && KNOWN_COMPANIES[matchedNumber]) {
    return KNOWN_COMPANIES[matchedNumber];
  }

  return null;
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

// --- Backend wiring ---

const BACKEND_URL: string | undefined = (() => {
  // Vite exposes env vars prefixed with VITE_ via import.meta.env.
  const raw = (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_PRICING_API_URL;
  return raw ? raw.replace(/\/+$/, "") : undefined;
})();

export function backendMode(): "live" | "mock" {
  return BACKEND_URL ? "live" : "mock";
}

interface BackendCompanyResponse {
  company_number?: string;
  company_name?: string;
  sic_codes?: string[];
  postcode?: string | null;
  address_line_1?: string | null;
  locality?: string | null;
  country?: string | null;
  incorporation_date?: string | null;
  status?: string | null;
  last_accounts_date?: string | null;
}

function mapBackendCompany(
  num: string,
  data: BackendCompanyResponse
): CompaniesHouseCompany {
  const sicCodes: CompaniesHouseSic[] = (data.sic_codes || []).map((code) => ({
    code,
    description: code,
  }));
  const statusRaw = (data.status ?? "").toLowerCase();
  const status: CompaniesHouseCompany["status"] =
    statusRaw === "active"
      ? "active"
      : statusRaw.includes("dissolv")
      ? "dissolved"
      : statusRaw.includes("liquid")
      ? "liquidation"
      : "active";
  return {
    companyNumber: data.company_number || num,
    companyName: data.company_name || "(unnamed)",
    status,
    companyType: "Private limited company",
    incorporatedOn: data.incorporation_date || "",
    registeredAddress: {
      line1: data.address_line_1 || "",
      city: data.locality || "",
      postcode: data.postcode || "",
      country: data.country || "United Kingdom",
    },
    sicCodes,
    industry: sicToIndustry(sicCodes.map((s) => s.code)),
    officersCount: 0,
    hasCharges: false,
    accountsLastFiled: data.last_accounts_date ?? undefined,
    source: "live",
  };
}

async function lookupViaBackend(
  raw: string
): Promise<CompaniesHouseCompany | null> {
  if (!BACKEND_URL) return null;
  const url = `${BACKEND_URL}/company/${encodeURIComponent(raw)}`;
  try {
    const resp = await fetch(url, { headers: { accept: "application/json" } });
    if (resp.status === 404) return null;
    if (!resp.ok) {
      console.warn(`[companies-house] backend returned ${resp.status}; falling back to mock`);
      return null;
    }
    const data = (await resp.json()) as BackendCompanyResponse;
    return mapBackendCompany(raw, data);
  } catch (err) {
    console.warn("[companies-house] backend call failed; falling back to mock", err);
    return null;
  }
}

function lookupMock(num: string): CompaniesHouseCompany {
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
    accountsLastFiled: new Date(
      incorporatedYear + 1 + Math.floor(rand() * 5),
      11,
      31
    ).toISOString(),
    websiteGuess: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`,
    source: "mock",
  };
}

export async function lookupCompaniesHouse(
  raw: string
): Promise<CompaniesHouseCompany | null> {
  const trimmed = (raw || "").trim();
  if (!trimmed) return null;

  // 1. Curated well-known companies. Fast path that works without a backend
  //    so demos return real data for recognisable UK companies (Greggs,
  //    Wetherspoon, Tesco, ...). Accepts the CH number OR a name alias.
  const known = lookupKnown(trimmed);
  if (known) {
    // Brief await so the UI's loading state still feels realistic.
    await new Promise((r) => setTimeout(r, 350));
    return known;
  }

  // 2. Live backend (Python FastAPI service that calls the real CH API).
  if (BACKEND_URL) {
    const live = await lookupViaBackend(trimmed);
    if (live) return live;
    // Fall through to mock on backend failure so the UI still works.
  }

  // 3. Deterministic mock keyed off the normalised number, so any
  //    8-character input still produces something reasonable.
  const num = normaliseCompanyNumber(trimmed);
  if (!isValidCompanyNumberFormat(num)) return null;
  if (!BACKEND_URL) {
    await new Promise((r) => setTimeout(r, 650));
  }
  return lookupMock(num);
}
