import { Router, type IRouter, type Request, type Response } from "express";
import { stripeStorage, stripeService } from "../lib/stripeService";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// GET /api/stripe/plans — public; used by pricing page
router.get("/stripe/plans", async (_req: Request, res: Response) => {
  try {
    const rows = await stripeStorage.listProductsWithPrices();

    const productsMap = new Map<string, {
      id: string;
      name: string;
      description: string;
      active: boolean;
      metadata: Record<string, string>;
      prices: Array<{ id: string; unit_amount: number; currency: string; recurring: unknown }>;
    }>();

    for (const row of rows as any[]) {
      if (!productsMap.has(row.product_id)) {
        productsMap.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          active: row.product_active,
          metadata: row.product_metadata ?? {},
          prices: [],
        });
      }
      if (row.price_id) {
        productsMap.get(row.product_id)!.prices.push({
          id: row.price_id,
          unit_amount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
        });
      }
    }

    res.json({ plans: Array.from(productsMap.values()) });
  } catch (err) {
    logger.error({ err }, "stripe/plans error");
    res.status(500).json({ error: "Failed to load plans" });
  }
});

// POST /api/stripe/checkout — requires auth; creates Stripe Checkout session
router.post("/stripe/checkout", async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { priceId } = req.body as { priceId?: string };
  if (!priceId) { res.status(400).json({ error: "priceId is required" }); return; }

  try {
    const dbUser = await stripeStorage.getUser(user.id);

    let customerId = dbUser?.stripeCustomerId ?? null;
    if (!customerId) {
      const customer = await stripeService.createCustomer(
        dbUser?.email ?? user.email ?? "",
        user.id
      );
      await stripeStorage.updateUserStripeInfo(user.id, { stripeCustomerId: customer.id });
      customerId = customer.id;
    }

    const origin = `${req.protocol}://${req.get("host")}`;
    const session = await stripeService.createCheckoutSession(
      customerId,
      priceId,
      `${origin}/pipeline/billing?success=1`,
      `${origin}/pricing?cancelled=1`
    );

    res.json({ url: session.url });
  } catch (err) {
    logger.error({ err }, "stripe/checkout error");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// POST /api/stripe/portal — requires auth; opens Stripe billing portal
router.post("/stripe/portal", async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    const dbUser = await stripeStorage.getUser(user.id);
    if (!dbUser?.stripeCustomerId) {
      res.status(400).json({ error: "No billing account found" }); return;
    }

    const origin = `${req.protocol}://${req.get("host")}`;
    const session = await stripeService.createPortalSession(
      dbUser.stripeCustomerId,
      `${origin}/pipeline/billing`
    );

    res.json({ url: session.url });
  } catch (err) {
    logger.error({ err }, "stripe/portal error");
    res.status(500).json({ error: "Failed to open billing portal" });
  }
});

// POST /api/stripe/credit-checkout — requires auth; creates one-time checkout for credit packs
router.post("/stripe/credit-checkout", async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { packId } = req.body as { packId?: string };
  if (!packId) { res.status(400).json({ error: "packId is required" }); return; }

  // Credit pack price IDs (Stripe one-time prices). In production these would be env vars.
  const CREDIT_PACKS: Record<string, { priceId: string; credits: number }> = {
    starter: { priceId: "price_credit_starter", credits: 100 },
    pro:     { priceId: "price_credit_pro",     credits: 500 },
    agency:  { priceId: "price_credit_agency",  credits: 2000 },
  };

  const pack = CREDIT_PACKS[packId];
  if (!pack) { res.status(400).json({ error: "Unknown pack" }); return; }

  try {
    const dbUser = await stripeStorage.getUser(user.id);
    let customerId = dbUser?.stripeCustomerId ?? null;
    if (!customerId) {
      const customer = await stripeService.createCustomer(
        dbUser?.email ?? user.email ?? "",
        user.id
      );
      await stripeStorage.updateUserStripeInfo(user.id, { stripeCustomerId: customer.id });
      customerId = customer.id;
    }

    const origin = `${req.protocol}://${req.get("host")}`;
    const session = await stripeService.createCheckoutSession(
      customerId,
      pack.priceId,
      `${origin}/pipeline/billing?credits=success`,
      `${origin}/pipeline/billing?credits=cancel`
    );

    res.json({ url: session.url });
  } catch (err) {
    logger.error({ err }, "stripe/credit-checkout error");
    res.status(500).json({ error: "Failed to create credit checkout" });
  }
});

// GET /api/stripe/subscription — requires auth; returns current subscription
router.get("/stripe/subscription", async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    const dbUser = await stripeStorage.getUser(user.id);
    if (!dbUser?.stripeSubscriptionId) {
      res.json({ subscription: null, planName: null }); return;
    }

    const subscription = await stripeStorage.getSubscription(dbUser.stripeSubscriptionId);
    res.json({ subscription, planName: dbUser.planName ?? null });
  } catch (err) {
    logger.error({ err }, "stripe/subscription error");
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

export default router;
