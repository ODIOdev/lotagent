# LOTAGENT

Auction acquisition planning for automotive dealers and wholesale buyers. Calculate landed cost, max safe bid, projected profit, and ROI before you raise a paddle.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · Recharts · Supabase · Vitest

## Local setup (demo mode)

The app runs without API keys. Demo login loads 12 realistic auction vehicles into browser storage.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Continue with demo data**.

### Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

## Connect Supabase

LOTAGENT shares the same Supabase project as LOTPILOT but uses isolated `la_*` tables. It never writes to `lp_*`.

1. Project URL: `https://gqgamvavrqavifthxglc.supabase.co`
2. Put the **anon key** in `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY` (never commit it).
3. Apply the migration in `supabase/migrations/20260831120000_lotagent_core.sql` from the Supabase SQL editor or CLI.
4. Sign-up creates `la_profiles`, a dealership, membership, and default settings via trigger.
5. Until you sync worksheets to Postgres, the UI still uses the demo store when you click **Continue with demo data**.

Optional licensed adapters (VIN, valuation, maps, transport, history) are mock-only. Do **not** scrape Kelley Blue Book or similar protected services. Set placeholder keys in `.env.example` when a provider is contracted.

## Deploy on Vercel

Team: [vercel.com/over-drive0s](https://vercel.com/over-drive0s)

1. Push this repo to [github.com/ODIOdev/lotagent](https://github.com/ODIOdev/lotagent.git).
2. In Vercel, import `ODIOdev/lotagent` into the `over-drive0s` team.
3. Set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Leave provider keys empty to keep mocks.
4. Deploy. Demo login continues to work if you omit the anon key.

## Product map

| Route | Purpose |
|---|---|
| `/` | Acquisition dashboard |
| `/acquisitions/new` | Worksheet |
| `/live-bid` | Distraction-free bidding |
| `/values` | Trade-in / wholesale / retail |
| `/watchlist` | Opportunities |
| `/comparisons` | Up to 4 units |
| `/purchases` | Won → sold pipeline |
| `/transportation` | Mileage estimator |
| `/auction-fees` | Sample fee schedules (verify before use) |
| `/reports` | Spend, ROI, CSV export |
| `/settings` | Profile, defaults, decision thresholds |

Fee presets for Manheim, ADESA, Copart, IAA, ACV, Cars & Bids, and Bring a Trailer are **sample data**.
