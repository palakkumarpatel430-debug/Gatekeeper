# GATEKEEPER — Public Website + Premium App

React 18 · TypeScript · Vite · Tailwind CSS · lucide-react

Two experiences in one build, matching the gatekeeper-v3 design system (zinc-950, amber #f59e0b,
Archivo 900, IBM Plex Mono, dot-grid):

**Public site** (anyone): Home (cursor-spotlight hero), Features (mock screenshots via the real
chart engine), How We Sort (zone-wise classification graphics + video slot), Pricing, About
(Michigan story), Contact — no customer data exposed.

**Premium app** (members only): Sort Entry, Dashboard, Records, Costing, Report, Root Cause,
Legal, Admin/Billing, Setup — loaded with the imported glass-sorting dataset.

## Run

```bash
npm install
npm run dev                                  # http://localhost:5173
npx vite build --config vite.config.single.ts  # single-file build → /tmp/gk-single/index.html
```

## The gate (demo → production)

The paywall/login is a **client-side demo**: accounts live in localStorage (`src/lib/auth.tsx`),
checkout is simulated. Flow: Register/Login → Pricing → "Pay" → premium flag set → app unlocks.

For production, replace only `src/lib/auth.tsx`:
1. **Supabase Auth** for register/login/logout (same function signatures).
2. **Stripe Checkout** for `purchase()` — set `premium`/`plan` from the webhook, server-side.
3. Move records out of localStorage into Supabase/Postgres behind row-level security.
4. Host the site (Vercel/Netlify) with the app on `app.` like worldwidequalitycontrol.com.

## Your video

Drop your sorting/zone-classification video at `public/sorting-video.mp4` and rebuild —
the player on the "How We Sort" page picks it up automatically (shows a styled placeholder until then).

## Map

- `src/site/` — public pages + SiteNav + auth page
- `src/views/` — the nine gated app views
- `src/lib/` — store, KPI engine, imported dataset (`data.ts`), demo auth
- `src/components/` — hero (spotlight), app navbar, chart engine, UI primitives
