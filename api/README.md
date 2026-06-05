# Same-origin serverless API

This directory holds the serverless functions the React app calls from
the same origin so it never has to ship the Companies House API key in
the browser bundle.

## What's here

- `company/[id].ts` - resolves a CH number or company name to a
  normalised profile dict by proxying to
  `https://api.company-information.service.gov.uk`. Reads the key from
  `process.env.COMPANIES_HOUSE_API_KEY` at request time.

## Setting the API key

**Never commit the key.** It belongs in the deployment's environment
variables, not in the repo.

### Vercel
1. Open the project in the dashboard.
2. Settings > Environment Variables.
3. Add `COMPANIES_HOUSE_API_KEY` with your free key from
   <https://developer.company-information.service.gov.uk/>. Apply to
   Production, Preview and Development.
4. Redeploy (or trigger a new deploy from `main`). Vercel
   auto-detects the `api/` directory and wires `company/[id].ts` to
   `/api/company/{id}`.

### Netlify
Copy the handler body into `netlify/edge-functions/company.ts` and
register the route in `netlify.toml`:

```toml
[[edge_functions]]
function = "company"
path = "/api/company/*"
```

Set `COMPANIES_HOUSE_API_KEY` under Site Settings > Environment Variables.

### Cloudflare Pages
Rename to `functions/api/company/[[id]].ts` and export `onRequest`
instead of `default`. Set the binding in Pages > Settings >
Environment Variables.

## How the React app finds it

`src/lib/companiesHouse.ts:lookupCompaniesHouse` resolves a query in
this order:

1. Curated known companies (Greggs / Wetherspoon / Tesco / ...).
2. Live backend: `VITE_PRICING_API_URL/company/{id}` when that env var
   is set (used in dev against the Python FastAPI service).
3. Same-origin `/api/company/{id}` - **this directory's function**.
4. Deterministic mock keyed off the normalised number.

A pill on the resulting company card labels which path was taken:
"Curated demo data" (orange), "Companies House (live)" (green), or
"Mock data" (muted).
