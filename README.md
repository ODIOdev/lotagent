# LOTAGENT

Auction acquisition planning for automotive dealers and wholesale buyers.

The **UI is a blank slate**. Product screens were removed so we can rebuild only what you need.

Backend that remains:

- Calculation engine (`src/lib/calc`) — landed cost, max safe bid, ROI, decision rules, unit tests
- Demo data store (`src/lib/data`) — 12 sample vehicles, worksheets, fees, localStorage
- Provider adapters (`src/lib/providers`) — mock VIN, valuation, maps, transport, history
- Supabase clients + `la_*` schema (`src/lib/supabase`, `supabase/migrations`)

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test          # calculation engine
npm run typecheck
npm run lint
npm run build
```

## Supabase

Same project as LOTPILOT, isolated `la_*` tables only. Never writes to `lp_*`.

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. Schema: `supabase/migrations/20260831120000_lotagent_core.sql`.
