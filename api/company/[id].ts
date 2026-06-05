/**
 * Same-origin proxy to the UK Companies House public API.
 *
 * The browser can't call CH directly: CH requires HTTP Basic auth with
 * an API key as the username (blank password), and the production API
 * doesn't send permissive CORS headers. So this serverless function
 * runs alongside the React app, holds the key in a server-side env
 * var (`COMPANIES_HOUSE_API_KEY`), and exposes a small JSON endpoint
 * the frontend talks to.
 *
 * Deployment:
 *   Vercel  - drops in here verbatim (auto-detects `api/`).
 *             Set COMPANIES_HOUSE_API_KEY in Project -> Settings ->
 *             Environment Variables.
 *   Netlify - copy the handler body into
 *             netlify/edge-functions/company.ts and add a route in
 *             netlify.toml. Set the env var in Site Settings ->
 *             Environment Variables.
 *   Cloudflare Pages - works as-is under Pages Functions if dropped
 *             at functions/api/company/[[id]].ts (rename onRequest).
 *
 * Free CH key from https://developer.company-information.service.gov.uk/.
 */

export const config = { runtime: "edge" };

const CH_BASE = "https://api.company-information.service.gov.uk";
const NUMBER_RE = /^[A-Za-z0-9]{8}$/;

interface ChAddress {
  address_line_1?: string;
  address_line_2?: string;
  locality?: string;
  postal_code?: string;
  country?: string;
}

interface ChProfile {
  company_number?: string;
  company_name?: string;
  sic_codes?: string[];
  registered_office_address?: ChAddress;
  date_of_creation?: string;
  company_status?: string;
  type?: string;
}

interface ChSearchItem {
  company_number?: string;
  score?: number;
}

interface ChSearchResponse {
  items?: ChSearchItem[];
}

interface ChFiling {
  date?: string;
}

interface ChFilingHistory {
  items?: ChFiling[];
}

function jsonResponse(status: number, body: unknown, cache = false): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...(cache ? { "cache-control": "public, max-age=300" } : {}),
    },
  });
}

async function chFetch<T>(apiKey: string, path: string): Promise<T | null> {
  const auth = `Basic ${btoa(`${apiKey}:`)}`;
  const resp = await fetch(`${CH_BASE}${path}`, {
    headers: { Authorization: auth, Accept: "application/json" },
  });
  if (resp.status === 404) return null;
  if (!resp.ok) return null;
  return (await resp.json()) as T;
}

function ageYears(iso?: string): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / (365.25 * 24 * 60 * 60 * 1000)));
}

function formatProfile(profile: ChProfile, filings: ChFilingHistory | null) {
  const addr = profile.registered_office_address ?? {};
  return {
    company_number: profile.company_number ?? null,
    company_name: profile.company_name ?? null,
    sic_codes: profile.sic_codes ?? [],
    postcode: addr.postal_code ?? null,
    address_line_1: addr.address_line_1 ?? null,
    address_line_2: addr.address_line_2 ?? null,
    locality: addr.locality ?? null,
    country: addr.country ?? null,
    incorporation_date: profile.date_of_creation ?? null,
    company_age_years: ageYears(profile.date_of_creation),
    status: profile.company_status ?? null,
    company_type: profile.type ?? null,
    last_accounts_date: filings?.items?.[0]?.date ?? null,
    // Both require XBRL parsing of filed accounts — a separate workstream.
    turnover_estimate: null,
    employee_band: null,
  };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, {
      error: "COMPANIES_HOUSE_API_KEY not configured on the server.",
    });
  }

  // The dynamic segment lands as the last path part. Decode and trim.
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const raw = decodeURIComponent(parts[parts.length - 1] ?? "").trim();
  if (!raw) return jsonResponse(400, { error: "Missing company id or name" });

  // Resolve to a Companies House number. 8-character alphanumeric goes
  // straight to /company/{number}. Anything else is a name -> search
  // first, take the top score.
  let number: string | null = null;
  if (NUMBER_RE.test(raw)) {
    number = raw.toUpperCase();
  } else {
    const search = await chFetch<ChSearchResponse>(
      apiKey,
      `/search/companies?q=${encodeURIComponent(raw)}&items_per_page=5`,
    );
    const items = (search?.items ?? []).slice().sort(
      (a, b) => (b.score ?? 0) - (a.score ?? 0),
    );
    const top = items[0]?.company_number;
    if (!top) return jsonResponse(404, { error: "No company matched" });
    number = top;
  }

  const profile = await chFetch<ChProfile>(apiKey, `/company/${number}`);
  if (!profile) return jsonResponse(404, { error: "Company not found" });

  const filings = await chFetch<ChFilingHistory>(
    apiKey,
    `/company/${number}/filing-history?category=accounts&items_per_page=5`,
  );

  return jsonResponse(200, formatProfile(profile, filings), true);
}
