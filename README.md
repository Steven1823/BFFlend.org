# BFFlend.org

A peer‑to‑peer rental marketplace with M‑Pesa payments.

- `client/` — React + Vite + Tailwind (SPA)
- `server/` — Express server, controllers, in‑memory storage by default
- `api/` — Vercel serverless API routes (TypeScript) that reuse server controllers
- `shared/` — Shared types and schemas

Run locally as a monolith or deploy the SPA + API functions to Vercel.

## Quick Start

Prereqs
- Node 18+ and npm

Install and run (development)
```
npm install
npm run dev
```
The dev server runs Express and mounts Vite middleware for the client.

Production build + start (monolith)
```
npm run build
npm start
```
Build outputs the SPA to `dist/public` and the server bundle to `dist/index.js`.

## Configuration

Create a `.env` (or set env vars in your host). See `.env.example` for the full list.

Required for payments (Daraja / M‑Pesa)
- `DARAJA_CONSUMER_KEY`
- `DARAJA_CONSUMER_SECRET`
- `DARAJA_PASSKEY`
- `DARAJA_SHORT_CODE`
- `DARAJA_ENVIRONMENT` (sandbox|production)

Optional database (Supabase). If omitted, the app uses in‑memory storage.
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server‑side)

## API Overview

Health
- `GET /api/health`

Users
- `POST /api/users` — create user
- `GET /api/users/:id` — get by id
- `GET /api/users/username/:username` — get by username
- `PUT /api/users/:id` — update
- `DELETE /api/users/:id` — delete
- `GET /api/users/:id/payments` — list user payments

Payments
- `POST /api/payments/initiate` — start STK push
  - body: `{ phoneNumber: string, amount: number, accountReference: string, transactionDesc?: string, userId?: number }`
- `POST /api/payments/callback` — Daraja callback (called by M‑Pesa)
- `GET /api/payments/status/:checkoutRequestId` — check status

See `docs/api.md` for full request/response examples.

## Deployment

Vercel (SPA + Serverless API)
- `vercel.json` is configured to:
  - Build the SPA from `client/package.json` to `client/dist`
  - Route `/api/*` to functions in `api/*` (supports .ts)
- Set env vars in Vercel Project Settings → Environment Variables.

Monolith (single Node process)
- Build: `npm run build`
- Start: `npm start`
- Ensure env vars are set in your host.

More details in `docs/deployment.md` and `docs/configuration.md`.

## Project Structure

```
.
├─ api/                         # Vercel serverless handlers (TypeScript)
├─ client/                      # React SPA (Vite)
├─ server/
│  ├─ lib/                      # vite helper, storage, payments
│  └─ server/                   # controllers, db models
├─ shared/                      # shared schemas/types
├─ vite.config.ts               # root build (SPA → dist/public)
├─ vercel.json                  # Vercel config
└─ package.json                 # root scripts (dev/build/start)
```

## Notes
- Passwords are not hashed yet — add bcrypt before production use
- Add authentication/authorization for protected routes
- Consider rate limiting and monitoring for production

