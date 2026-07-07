# GLIMR Pricing Handover

**Last updated:** 2026-07-07
**Purpose:** Permanent reference of all pricing, packages, and payment logic so it survives conversation compaction.

---

## 1. SUBSCRIPTION TIERS (Monthly, Stripe recurring billing)

| Tier | Price (USD) | Key Features |
|------|------------|--------------|
| **One-Off Session** | $19.99 (one-off) | Create avatar from photo, pick voice & scene, one 5-min live video session, no subscription needed |
| **Spark** ⭐ MOST LOVED | $12.99 /mo | Unlimited text chat, intimate connection mode 💛, voice replies (200/mo), 1 custom companion from photo, create live avatar, 30-day memory |
| **Flame** | $18.99 /mo | Everything in Spark + deep intimacy & romance, unlimited voice replies, 3 custom companions, full long-term memory, daily check-in |
| **Live** | $97.99 /mo | Everything in Flame + deepest intimate connection, real-time live video avatar, custom live avatar included, 30 live video min/mo, top up more minutes anytime |

**Note:** Old tiers (Free / Plus / Pro / VIP) are DEPRECATED. New tier names: spark, flame, live.

---

## 2. SESSIONS WITH YOUR AVATAR (One-off, 5 min each, never expire)

Powered by **Anam** (not HeyGen/LiveAvatar).

| Pack | Price | Per Session |
|------|-------|-------------|
| 1 session | $19.99 | $19.99 |
| 5 sessions ⭐ BEST VALUE | $49.99 | $10.00 |
| 20 sessions | $199.90 | $9.99 |

---

## 3. TOP-UP LIVE MINUTES (Live plan required, minutes never expire, stack on monthly allowance)

Powered by **LiveAvatar / HeyGen**.

| Minutes | Price |
|---------|-------|
| 10 min | $4 |
| 30 min ⭐ BEST VALUE | $12 |
| 60 min | $24 |

**Cost basis (HeyGen/LiveAvatar):**
- Starter: $19 = 150 credits/mo
- Essential: $99 = 1,000 credits/mo
- Business: $475 = 5,000 credits/mo
- Enterprise: Custom

---

## 4. SURPRISE MESSAGES (One-off, never expire, works on every plan)

| Pack | Price |
|------|-------|
| 5 messages | $4.99 |
| 15 messages ⭐ BEST VALUE | $9.99 |

---

## 5. INTIMACY PACKAGES

**GATING RULE:** Intimacy packages are ONLY available after a user has created an avatar first.

### Old intimacy packages (credit-based, pre-redesign):
| Duration | Price |
|----------|-------|
| 15 min | $4 |
| 30 min | $8 |
| 60 min | $15 |

### Status:
> ⚠️ **CONFIRM NEEDED:** These prices ($4/$8/$15) were carried over from the old pricing model. User needs to confirm whether to keep them or set new durations/prices. Intimacy is the ONLY package where GLIMR has full pricing control (not tied to HeyGen/LiveAvatar costs).

---

## 6. PAYMENT METHODS

### Stripe (Primary)
- Handles all subscription tiers and one-off purchases
- Secrets: `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`
- Backend functions: `createCheckout`, `confirmSubscription`, `stripeWebhook`, `manageBilling`

### Crypto (Alternative — Kraken)
- Handles tiers, top-ups, and intimacy via Kraken deposit addresses
- Assets: USDC, BTC, ETH
- Secrets: `KRAKEN_API_KEY`, `KRAKEN_PRIVATE_KEY`
- Backend functions: `createCryptoCheckout`, `checkCryptoPayment`, `processPendingCryptoOrders`

---

## 7. VIDEO ENGINE INTEGRATIONS

| Engine | Used For | Secret |
|--------|----------|--------|
| **Anam** | One-off 5-min sessions | `ANAM_API_KEY` |
| **LiveAvatar** | Subscription live video, top-up minutes | `LIVEAVATAR_API_KEY` |
| **HeyGen** | Avatar creation (Mia) | `HEYGEN_API_KEY`, `HEYGEN_AVATAR_MIA` |
| **ElevenLabs** | Voice synthesis | `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` |
| **OpenAI** | LLM / chat | `OPENAI_API_KEY` |

---

## 8. BACKEND FUNCTIONS (Existing)

| Function | Purpose |
|----------|---------|
| `createCheckout` | Stripe checkout for tiers + add-ons |
| `confirmSubscription` | Confirm Stripe session, update tier/balance |
| `stripeWebhook` | Stripe webhook handler |
| `manageBilling` | Stripe billing portal |
| `createCryptoCheckout` | Kraken crypto checkout |
| `checkCryptoPayment` | Check crypto payment status |
| `processPendingCryptoOrders` | Auto-process pending crypto orders |
| `liveavatarEmbed` | Create LiveAvatar session, deduct credits/minutes |
| `createLiveAvatar` | Create avatar from photo |
| `getSubscription` | Get user's subscription status |
| `trackUsage` | Track video minute usage |
| `trackMessageUsage` | Track message usage |
| `checkIntimacyTraining` | Check intimacy training progression |
| `sendWelcomeEmail` | Send welcome email |
| `proactiveCheckin` | Proactive companion check-in |
| `getDashboardStats` | Admin dashboard stats |
| `grantPro` | Admin: grant pro access |
| `healthCheck` | System health check |
| `inviteUser` | Invite user to app |

---

## 9. ENTITY SCHEMA CHANGES NEEDED

### Subscription entity
- `tier` enum: update from `["free","plus","pro","vip"]` → `["free","spark","flame","live"]`
- `video_minutes_limit`: update defaults per new tiers
- Keep `credit_balance` for intimacy/top-up credits
- Add `session_credits` field for one-off session packs (1/5/20 sessions)
- Add `surprise_message_credits` field

### CryptoOrder entity
- `order_type` enum: add `"session"`, `"surprise"` (in addition to "tier", "topup", "intimacy")
- `reference`: needs to support new pack IDs

---

## 10. FILES TO UPDATE

### Frontend
- `src/pages/Pricing.jsx` — full rewrite of tier definitions, add session/surprise sections
- `src/components/pricing/TierCard.jsx` — update for new tier names/badges
- `src/components/pricing/IntimacyAddOnCard.jsx` — gate behind avatar creation
- `src/components/pricing/TopUpCard.jsx` — update to 10/30/60 min at $4/$12/$24
- `src/components/pricing/CryptoPaymentModal.jsx` — add session/surprise tabs
- **NEW:** `src/components/pricing/SessionPackCard.jsx` — one-off session packs
- **NEW:** `src/components/pricing/SurpriseMessageCard.jsx` — surprise message packs

### Backend
- `base44/functions/createCheckout/entry.ts` — new tier prices, session/surprise handling
- `base44/functions/confirmSubscription/entry.ts` — new tier mapping, session/surprise fulfillment
- `base44/functions/createCryptoCheckout/entry.ts` — new prices, new order types
- `base44/functions/checkCryptoPayment/entry.ts` — new fulfillment logic
- `base44/functions/processPendingCryptoOrders/entry.ts` — new fulfillment logic
- `base44/functions/liveavatarEmbed/entry.ts` — session credit deduction, intimacy gating
- `base44/functions/getSubscription/entry.ts` — new tier limits

### Entity schemas
- `base44/entities/Subscription.jsonc` — new tier enum, new credit fields
- `base44/entities/CryptoOrder.jsonc` — new order types

---

## 11. OPEN ITEMS / CONFIRMATION NEEDED

1. **Intimacy package prices** — keep $4/$8/$15 for 15/30/60 min, or set new prices?
2. **Surprise messages** — powered by which integration? (LLM-generated text + generated images?)
3. **Session credits vs minute credits** — one-off sessions (Anam) are 5-min each; top-up minutes (LiveAvatar) are real-time. These are separate credit pools?
4. **Free tier** — still exists? What does it include? (Text chat only?)