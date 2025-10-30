# Configuration

The application reads configuration from environment variables. Create a `.env` in the project root for local use (or set variables in your hosting platform).

M‑Pesa (Daraja)
- `DARAJA_CONSUMER_KEY` — App consumer key
- `DARAJA_CONSUMER_SECRET` — App consumer secret
- `DARAJA_PASSKEY` — STK passkey
- `DARAJA_SHORT_CODE` — Paybill/Till short code
- `DARAJA_ENVIRONMENT` — `sandbox` or `production`

Supabase (optional)
- `VITE_SUPABASE_URL` — Project URL
- `VITE_SUPABASE_ANON_KEY` — Anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server side)

App
- `NODE_ENV` — `development` or `production`

Behavior
- If Supabase variables are missing, the server uses in‑memory storage (`MemStorage`).
- Payments require all `DARAJA_*` variables.

