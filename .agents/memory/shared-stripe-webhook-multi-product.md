---
name: Shared Stripe webhook across multiple products
description: Lessons for extending one Stripe webhook handler to serve two unrelated products (LensFlow + Glimr) on the same account.
---

When one Stripe account/webhook endpoint serves multiple unrelated products, each per-product handler must positively identify events belonging to it — not just fall back to "no match found elsewhere, so it must be mine."

**Why:** A per-product handler for product B that runs on every `customer.subscription.*` event and, upon not finding an existing row for the customer, falls back to *creating* one is unsafe — it will happily create a product-B entitlement row for a product-A customer it has simply never seen before. The failure is silent (no error, just wrong data) and only shows up as a data-integrity/entitlement leak later.

**How to apply:** Tag product-specific subscriptions at creation time (`subscription_data.metadata.app = "<product>"` in the Checkout session) and gate any webhook-driven *create* path on that metadata. Update-only paths (matching an already-tagged existing row by customer id) don't need the guard since the row was already scoped correctly when created. Also: webhook event payloads carry unexpanded nested objects (e.g. `price.product` is just an id) — if a handler reads metadata off a nested object, it must re-retrieve with `expand: [...]` or it will silently read `null` and fall back to a stale value.
