---
name: Stripe webhook endpoint not registered
description: The connected Stripe (test-mode) account has no webhookEndpoints registered, so webhook-dependent sync code won't actually receive events yet.
---

Calling `stripe.webhookEndpoints.list()` on this project's Stripe connector returned an empty list (checked 2026-07-09, test mode). `webhookHandlers.ts` has correct handler logic for `customer.subscription.*` / `invoice.paid`, but nothing is actually delivering those events to `/api/stripe/webhook` yet.

**Why:** Webhook handler code can typecheck, unit-test, and even be exercised via a manually-crafted POST, while still never firing in real usage because no Stripe-side endpoint subscription exists pointing at this app's URL with matching enabled_events.

**How to apply:** Before treating any Stripe-webhook-driven feature (subscription status sync, invoice-based resets, etc.) as verified end-to-end, confirm a webhook endpoint is actually registered for this Stripe account/URL with the needed event types — don't infer it from handler code alone. If missing, this needs to be set up (Stripe dashboard or `stripe.webhookEndpoints.create(...)`) with a stable public URL before relying on live event delivery.

**Update 2026-07-09:** the webhook processor now fails closed (throws instead of trusting unsigned JSON) when the secret is missing and `NODE_ENV === 'production'`. That makes the missing-registration gap fail loudly instead of silently in prod — but registration still needs to happen for the endpoint to work at all.
