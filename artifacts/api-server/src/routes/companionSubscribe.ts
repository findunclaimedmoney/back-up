import { Router, type IRouter, type Request } from "express";
import { db, companionSubscribersTable } from "@workspace/db";
import type Stripe from "stripe";
import {
  createCompanionCheckoutSession,
  createCompanionPortalSession,
  retrieveCheckoutSession,
  extractCompanionTier,
} from "../lib/companionStripe";
import { getSubscriberForUser, computeEntitlements } from "../lib/companionEntitlements";
import {
  CreateCompanionCheckoutBody,
  CreateCompanionCheckoutResponse,
  VerifyCompanionCheckoutBody,
  VerifyCompanionCheckoutResponse,
  GetCompanionSubscribeStatusBody,
  GetCompanionSubscribeStatusResponse,
  CreateCompanionPortalBody,
  CreateCompanionPortalResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Glimr is served behind the shared proxy at the /glimr/ base path (see
// artifacts/glimr/artifact.toml). Checkout/portal redirect URLs must include it.
const GLIMR_BASE_PATH = "/glimr";

function companionOrigin(req: Request): string {
  return `${req.protocol}://${req.get("host")}`;
}

router.post("/companion/subscribe/checkout", async (req, res): Promise<void> => {
  const parsed = CreateCompanionCheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { tier } = parsed.data;
  // Prefer the verified session email for signed-in users; the request body
  // email is only used as a convenience prefill for anonymous checkout.
  const email = (req.isAuthenticated() ? req.user.email : undefined) ?? parsed.data.email;
  const userId = req.isAuthenticated() ? req.user.id : undefined;

  try {
    const origin = companionOrigin(req);
    const session = await createCompanionCheckoutSession(
      tier,
      email ?? undefined,
      userId,
      `${origin}${GLIMR_BASE_PATH}/pricing?session_id={CHECKOUT_SESSION_ID}`,
      `${origin}${GLIMR_BASE_PATH}/pricing`,
    );

    if (!session.url) {
      res.status(502).json({ error: "Failed to create checkout session" });
      return;
    }

    res.json(CreateCompanionCheckoutResponse.parse({ checkoutUrl: session.url }));
  } catch (err) {
    req.log.error({ err }, "companion checkout error");
    res.status(502).json({ error: "Failed to create checkout session" });
  }
});

router.post("/companion/subscribe/verify", async (req, res): Promise<void> => {
  const parsed = VerifyCompanionCheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { sessionId } = parsed.data;

  try {
    const session = await retrieveCheckoutSession(sessionId);
    const customer = session.customer as Stripe.Customer | null;
    const subscription = session.subscription as Stripe.Subscription | null;
    const email = (customer && !customer.deleted ? customer.email : null) ?? session.customer_email;

    if (!email || !subscription) {
      res.status(400).json({ error: "Checkout session is not a completed subscription" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const tier = extractCompanionTier(subscription) ?? "free";
    const isActive = subscription.status === "active" || subscription.status === "trialing";
    const customerId = typeof session.customer === "string" ? session.customer : (customer?.id ?? null);
    // Trust only the signed-in session for linking a userId, never the checkout
    // session's own metadata — a client can't forge req.user.
    const userId = req.isAuthenticated() ? req.user.id : undefined;

    await db
      .insert(companionSubscribersTable)
      .values({
        email: normalizedEmail,
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        tier,
        active: isActive,
      })
      .onConflictDoUpdate({
        target: companionSubscribersTable.email,
        set: {
          ...(userId ? { userId } : {}),
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          tier,
          active: isActive,
          updatedAt: new Date(),
        },
      });

    res.json(VerifyCompanionCheckoutResponse.parse({ email: normalizedEmail, tier }));
  } catch (err) {
    req.log.error({ err }, "companion verify checkout error");
    res.status(400).json({ error: "Checkout session is not a completed subscription" });
  }
});

router.post("/companion/subscribe/status", async (req, res): Promise<void> => {
  const parsed = GetCompanionSubscribeStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Identity must come from the authenticated session — a client-supplied email
  // is never trusted for looking up someone else's subscription/billing state.
  const subscriber = req.isAuthenticated() ? await getSubscriberForUser(req.user) : undefined;
  const entitlements = computeEntitlements(subscriber);

  res.json(
    GetCompanionSubscribeStatusResponse.parse({
      tier: entitlements.tier,
      active: entitlements.active,
      voiceLimit: entitlements.voiceLimit,
      voiceRemaining: entitlements.voiceRemaining,
    }),
  );
});

router.post("/companion/subscribe/portal", async (req, res): Promise<void> => {
  const parsed = CreateCompanionPortalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Sign in required" });
    return;
  }

  const subscriber = await getSubscriberForUser(req.user);
  if (!subscriber?.stripeCustomerId) {
    res.status(404).json({ error: "No billing account found for this user" });
    return;
  }

  try {
    const origin = companionOrigin(req);
    const session = await createCompanionPortalSession(
      subscriber.stripeCustomerId,
      `${origin}${GLIMR_BASE_PATH}/account`,
    );
    res.json(CreateCompanionPortalResponse.parse({ portalUrl: session.url }));
  } catch (err) {
    req.log.error({ err }, "companion portal error");
    res.status(502).json({ error: "Failed to open billing portal" });
  }
});

export default router;
