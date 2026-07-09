import { Router, type IRouter, type Request } from "express";
import { db, companionSubscribersTable } from "@workspace/db";
import type Stripe from "stripe";
import {
  createCompanionCheckoutSession,
  createCompanionPortalSession,
  retrieveCheckoutSession,
  extractCompanionTier,
} from "../lib/companionStripe";
import { getSubscriberByEmail, computeEntitlements } from "../lib/companionEntitlements";
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

// The Glimr companion frontend (Task #15) isn't built yet — `/companion` is the
// ground-truth base path convention used by the exported frontend (see
// use-subscription hook). Update here once the frontend artifact is registered
// if its actual served path differs.
function companionOrigin(req: Request): string {
  return `${req.protocol}://${req.get("host")}`;
}

router.post("/companion/subscribe/checkout", async (req, res): Promise<void> => {
  const parsed = CreateCompanionCheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { tier, email } = parsed.data;

  try {
    const origin = companionOrigin(req);
    const session = await createCompanionCheckoutSession(
      tier,
      email,
      `${origin}/companion?session_id={CHECKOUT_SESSION_ID}`,
      `${origin}/companion`,
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

    await db
      .insert(companionSubscribersTable)
      .values({
        email: normalizedEmail,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        tier,
        active: isActive,
      })
      .onConflictDoUpdate({
        target: companionSubscribersTable.email,
        set: {
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

  const subscriber = await getSubscriberByEmail(parsed.data.email);
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

  const subscriber = await getSubscriberByEmail(parsed.data.email);
  if (!subscriber?.stripeCustomerId) {
    res.status(404).json({ error: "No billing account found for that email" });
    return;
  }

  try {
    const origin = companionOrigin(req);
    const session = await createCompanionPortalSession(subscriber.stripeCustomerId, `${origin}/companion`);
    res.json(CreateCompanionPortalResponse.parse({ portalUrl: session.url }));
  } catch (err) {
    req.log.error({ err }, "companion portal error");
    res.status(502).json({ error: "Failed to open billing portal" });
  }
});

export default router;
