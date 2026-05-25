# Pup Club

A bar-side arcade loyalty app for the Deaf Puppy Comedy Club (DPCC). Patrons play mini arcade games on their phones, climb a live leaderboard, earn XP tiers, browse the menu, and check upcoming events.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VENUE_SLUG`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS, Zustand for state, React Query (Orval hooks)
- API: Express 5, Supabase (anon key, direct from server)
- DB: Supabase PostgreSQL (external — migration SQL in attached_assets zip)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod schemas for server validation
- `artifacts/pup-club/src/` — frontend (React + Vite)
- `artifacts/pup-club/src/store/useStore.ts` — Zustand global state
- `artifacts/pup-club/src/games/PongGame.tsx` — HTML5 Canvas Pong game
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/supabase.ts` — Supabase client for server

## Architecture decisions

- Database is Supabase (external), not Replit's built-in Postgres — the starter zip included an existing Supabase project with all tables, views, and seed data already applied.
- The server uses the Supabase anon key (row-level security handles access control on the Supabase side).
- Frontend uses a tab-swap pattern (Zustand `activeTab`) instead of a client-side router — the app is a single-screen mobile PWA.
- Session tokens are generated once client-side and persisted in localStorage via Zustand `persist` middleware.
- XP is awarded server-side on score submission: 10 XP per score point, capped at 500 per game.

## Product

- **Onboarding** — first-visit modal asking for display name (required) and email (optional). Patron is created in Supabase.
- **Game Hub** — 3 game cards (Pong live, Neon Invaders and Laser Tug-of-War coming soon).
- **Pong** — HTML5 Canvas game with touch/mouse controls, AI opponent, 7-point game, score submission on completion.
- **Leaderboard** — Today and All-Time tabs, filterable by game.
- **Menu** — Drinks and food grouped by category, specials highlighted.
- **Events** — Upcoming comedy shows from Supabase events table.
- **Profile** — Patron XP, tier badge, progress bar to next tier.

## Gotchas

- After adding new API endpoints, run `pnpm --filter @workspace/api-spec run codegen` before using the generated hooks.
- The Supabase `leaderboard_today` and `leaderboard_alltime` are VIEWs — they're created by the migration SQL in the zip file.
- Do NOT use `pnpm dev` at the workspace root. Use the workflow restart button or `restart_workflow`.
- `VITE_` prefixed secrets are passed through to both the frontend (via Vite) and the API server (as regular env vars).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Supabase migration SQL is in `attached_assets/pup-club-starter_1779697087344.zip` → `pup-club/supabase_migration.sql`
