# Deployment

This project supports two deployment modes:

1) Vercel (SPA + Serverless API)
- Vercel builds the client and runs API routes from `api/*`.
- vercel.json already contains the correct config.

Steps
- Connect your repo in Vercel → New Project
- Ensure Build & Output:
  - Framework Preset: Other
  - Build Command: `npm install && npm run build`
  - Output Directory: `dist/public`
  - Install Command: `npm install`
- Set Environment Variables (Project Settings → Environment Variables)
  - See `.env.example` for required keys
- Deploy

Notes
- API functions support TypeScript (`api/**/*.ts`) and run on Node 18.
- The SPA will be served from `client/dist` when deployed by Vercel’s static build, but the root build used by `npm run build` outputs to `dist/public`. Both are supported by the repo configuration.

2) Monolith (single Node process)
- Build the client and bundle the server:
  - `npm run build`
  - Output: `dist/public` (client) and `dist/index.js` (server)
- Start the server:
  - `npm start`
- Ensure env vars are set in your host.

Environment Variables
- Payments (required for M‑Pesa): `DARAJA_CONSUMER_KEY`, `DARAJA_CONSUMER_SECRET`, `DARAJA_PASSKEY`, `DARAJA_SHORT_CODE`, `DARAJA_ENVIRONMENT`
- Database (optional for Supabase): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

Troubleshooting
- Build fails → Confirm Node 18+ and run `npm install` at repo root
- 500s from API → Missing/incorrect env vars
- Payments issues → Check all `DARAJA_*` values and callback URL reachability
- DB connection issues → The app falls back to in‑memory storage if Supabase creds are absent

