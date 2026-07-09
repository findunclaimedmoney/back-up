# LensFlow AI

Full-stack real estate video pipeline app + marketing site. Real estate agencies paste a listing URL and LensFlow automatically writes a Claude AI script, synthesises an ElevenLabs voiceover, and renders a professional AI presenter video — in one click.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (port 8080, proxied via `/api`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Auth: Replit OIDC + session-based (`SESSION_SECRET` env)
- AI: Anthropic Claude (`claude-sonnet-4-5`) for script generation
- Voice: ElevenLabs voices (Mia, Oliver, Sophie)
- CRM: HubSpot connector (auto-syncs contacts on login)

## Where things live

- `artifacts/lensflow/` — pipeline app (React+Vite, serves at `/pipeline/`)
- `artifacts/lensflow-site/` — marketing site (React+Vite, serves at `/`)
- `artifacts/api-server/` — Express 5 API (serves at `/api`)
- `lib/db/` — Drizzle schema + migrations
- `lib/api-spec/openapi.yaml` — OpenAPI source of truth
- `lib/api-client-react/` — generated React Query hooks
- `lib/api-zod/` — generated Zod schemas

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed hooks + Zod validation on both client and server
- Pipeline simulation: all 5 steps run server-side; steps 01–03 are live (URL parse, Claude AI, ElevenLabs), steps 04–05 are simulated placeholders
- URL metadata extraction: `parse-listing-url.ts` parses suburb/state/type/beds from listing URL path — passed as context to Claude for property-specific scripts
- HubSpot contact sync: fire-and-forget in `upsertUser` — never blocks login, logs warn on failure
- Job ownership: all job queries filter by `req.user.id`; unauthenticated users can't see any jobs

## Product

- **Marketing site** (`/`): hero, presenters (Mia, Oliver, Sophie), pricing (Starter $79, Elite $199, Concierge $399), comparison table, FAQs, Morgan AI chat widget, lead capture
- **Pipeline app** (`/pipeline/`): personalized dashboard with stats (Videos Completed, Scripts Generated, Hours Saved, Failed), My Videos list, New Job form with live URL platform detection and presenter picker, Job Detail with 5-stage pipeline timeline, extracted metadata display, AI script panel (copy + download), voiceover player, Share button, Re-run + New Listing CTAs, Webhooks page, Settings page with API key display
- **Morgan AI**: floating chat widget powered by Claude — context-aware for both marketing site visitors and pipeline users; captures HubSpot leads

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Never call `pnpm dev` at workspace root — run via workflow restart
- Mobile "Create" flow branches into self-record (agent films with scrolling teleprompter) vs AI presenter; self-record uses `POST /jobs/generate-script` (script only, no job) then `POST /jobs/self-recorded` (completed job, `inputMode "selfie"`)
- `inputMode "selfie"` is free-text (no DB migration); Job/JobDetail openapi enums include `selfie`; job detail hides the pipeline timeline for selfie jobs
- `POST /storage/uploads/request-url` requires auth; `/jobs/self-recorded` validates `videoUrl` is an `/api/storage/` URL
- `pipelineStepsTable` has `outputData text` column (added manually, not from original scaffold)
- `generate_script` step stores the raw script in `outputData`; downstream `create_voiceover` uses it
- `generatedScript` local variable carries script across steps in `runSimulation()` without DB re-fetch
- `@assets` alias resolves to `/attached_assets/` at repo root
- HubSpot connector ID: `conn_hubspot_01KSYB2VWDD2DRFF5DDN92TJ1X`
- ElevenLabs voices: Mia=`x3PfG9wL6FOEApZ1VJ9H`, Oliver=`jfIS2w2yJi0grJZPyEsk`, Sophie=`69h9o7wh5u0isWHzdogD`, James=`yXFr3XVHzrViCIHi1yoc`, Morgan=`g5fH9S068t9I3i8Y9u4`
- HeyGen avatars (custom, set via env vars): Mia=`91141b5f57114fccb565ab32ca058a1a`, Oliver=`b88ace7a30a34a76ae92a16dd84c18af`, Sophie=`267832a040cd46998928c37498777215`, James=`9f2454deef0840008f9d6f6753c6de7b` — all on jmorganink HeyGen account; set via HEYGEN_AVATAR_MIA/OLIVER/SOPHIE/JAMES env vars
- HeyGen avatar **group** IDs (same values used in HEYGEN_GROUP_* env vars / hardcoded defaults): Mia=`1602766f0e7344199b7b1a8bcf7b7855`, Oliver=`b88ace7a30a34a76ae92a16dd84c18af`, Sophie=`267832a040cd46998928c37498777215`, James=`9f2454deef0840008f9d6f6753c6de7b` — verified 2026-06-08 via `/v2/avatar_group/{id}/avatars`
- Oliver's looks were originally named "James in ..." in HeyGen and were renamed in the dashboard on 2026-06-08; server also applies `replace(/^James/i, "Oliver")` as safety net
- Shotstack: sandbox key → `https://api.shotstack.io/edit/stage`; prod key → `https://api.shotstack.io/edit/v1`; `colour` asset type removed — use `shape`; `fadeOut`/`fadeIn` → `fade`; trim whitespace from keys; HeyGen CDN video URLs expire — always use freshly-generated URLs in Shotstack renders
- HeyGen `POST /v3/videos` rejects some avatars with `avatar_consent_required` unless a one-time likeness-consent flow has been completed on the account; when adding a new HeyGen video feature, reuse an already-approved avatar ID from `lib/heygen.ts` (e.g. `AVATAR_MIA`) rather than picking a fresh ID off `/v2/avatars` — Glimr's companion video route reuses the LensFlow Mia ID for this reason
- Glimr companion is a separate product embedded in this same monorepo (`artifacts/api-server/src/routes/companion.ts`, `lib/db/src/schema/companion.ts`); it intentionally does not reuse LensFlow's job/pipeline schema — `companion_subscribers` (billing/tier) replaced the ground-truth export's raw `companion_messages` chat log, which was dropped since the product only needs summarized memory (`companion_sessions.summary`) + structured facts (`companion_facts`)
- Glimr billing: Stripe test-mode products Spark (`prod_Ur0ZN1B5WJOenI`/`price_1TrIYTKGiC6xuC8cdsPRyhIH`, $9.99/mo) and Flame (`prod_Ur0ZlKBBTEMwRc`/`price_1TrIYUKGiC6xuC8cs0yApTOM`, $19.99/mo), both tagged `metadata: {app: "glimr", plan: <tier>}` — price IDs are looked up by this metadata at runtime (`lib/companionStripe.ts`), never hardcoded, so dashboard price changes don't need a code change
- Glimr entitlements (`lib/companionEntitlements.ts`): free=0 voice replies/session-only memory, spark=200 voice replies+30-day memory, flame=unlimited voice+long memory+video calls; `companion_subscribers.active` gates everything — a row existing doesn't mean paid, always check `active`
- Glimr subscribe endpoints (`/api/companion/subscribe/{checkout,verify,status,portal}`) match the ground-truth `use-subscription.ts` hook contract exactly (checkout accepts optional `email`, verify resolves email from the completed Checkout session, status/portal require `email`) — Task #15 frontend can consume as-is
- Glimr and LensFlow share one Stripe webhook endpoint/secret (`webhookHandlers.ts`) — `customer.subscription.*` and `invoice.paid` events are routed to both LensFlow's and Glimr's handlers; a customer not found in one is expected/normal, not an error, since it likely belongs to the other product
- Glimr free-tier's "10 messages/day" text-chat cap (from `Pricing.tsx`) is NOT yet enforced server-side — only voice/memory/persona/video gating is wired up; needs a per-day counter design before implementing (session ids aren't stable per-user for anonymous free users)
- `handleCompanionSubscriptionEvent` (webhookHandlers.ts) re-retrieves the subscription with `expand: ['items.data.price.product']` before reading the tier — webhook payloads carry unexpanded price/product, and skipping this made portal tier upgrades silently fail to sync; also only creates a *new* companion_subscribers row when `subscription.metadata.app === 'glimr'` (set at checkout) so LensFlow subscriptions on the same Stripe account can't accidentally get companion entitlements
- `/api/stripe/webhook` fails closed (throws) if `STRIPE_WEBHOOK_SECRET`/connector webhook secret is missing AND `NODE_ENV === 'production'` — unverified JSON is only accepted in dev/sandbox; still needs a webhook endpoint actually registered on the Stripe account before this matters (see `.agents/memory/stripe-webhook-endpoint-not-configured.md`)
- SECURITY GAP for Task #14: `/companion/subscribe/portal` and `/status` are looked up by client-supplied email with no auth — anyone who knows a subscriber's email can open their live Stripe Billing Portal (view/cancel billing). Task #14 (login/account) MUST bind `/portal` (and ideally `/status`) to the authenticated session instead of trusting the request body's email

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

