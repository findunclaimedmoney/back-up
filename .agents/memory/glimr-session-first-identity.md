---
name: Glimr session-first billing identity
description: The pattern used to derive companion subscriber identity from the authenticated session instead of a client-supplied email, and where it's applied.
---

Glimr originally resolved billing/entitlement identity from a client-supplied `email` (or a `localStorage`-cached email) on every request, which let anyone who knew a subscriber's email view/manage their Stripe billing portal. The fix is a consistent **session-first, email-fallback** pattern:

```ts
const subscriber = req.isAuthenticated()
  ? await getSubscriberForUser(req.user)
  : email
    ? await getSubscriberByEmail(email)
    : undefined;
```

- `getSubscriberForUser` (in `lib/companionEntitlements.ts`) looks up `companion_subscribers` by `userId`.
- Routes that expose or mutate billing state for a *specific* identity (`/companion/subscribe/status`, `/companion/subscribe/portal`) must **not** fall back to a client-supplied email at all — they require `req.isAuthenticated()` and return 401 otherwise. The email fallback is only acceptable for routes that gate a feature by tier without exposing another person's account (e.g. persona-create, video-call, chat voice-gating), where a stale/wrong email just means "treated as free tier," not an account takeover.
- `/companion/subscribe/checkout` still accepts an optional client email, but only as an anonymous-checkout prefill — never used to look up an existing subscriber.

**Why:** the original ground-truth design assumed a single email-based identity with no login; retrofitting real auth means every place that resolves a subscriber by email needs a case-by-case judgment call on whether the client-supplied identity is a convenience default (fine) or a security boundary (must require session auth).

**How to apply:** when adding a new companion/billing route, ask "does this reveal or act on someone else's account state if the email is wrong/spoofed?" If yes, require `req.isAuthenticated()` and use only `req.user`. If no (pure feature-gating), the session-first/email-fallback pattern above is fine.
