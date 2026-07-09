import type Stripe from "stripe";
import { getStripeClient, getUncachableStripeClient } from "./stripeClient";

export type CompanionPaidTier = "spark" | "flame";
export type CompanionTier = "free" | CompanionPaidTier;

const priceIdCache = new Map<CompanionPaidTier, string>();

/**
 * Looks up the active recurring Stripe price for a Glimr tier by product metadata
 * (`app: "glimr", plan: "spark" | "flame"`) rather than hardcoding price IDs, so
 * price changes in the Stripe dashboard don't require a code change.
 */
async function findPriceIdForTier(tier: CompanionPaidTier): Promise<string> {
  const cached = priceIdCache.get(tier);
  if (cached) return cached;

  const stripe = await getStripeClient();
  const prices = await stripe.prices.list({
    active: true,
    limit: 100,
    expand: ["data.product"],
  });

  for (const price of prices.data) {
    const product = price.product;
    if (
      typeof product === "object" &&
      product !== null &&
      !("deleted" in product && product.deleted) &&
      (product as Stripe.Product).metadata?.app === "glimr" &&
      (product as Stripe.Product).metadata?.plan === tier
    ) {
      priceIdCache.set(tier, price.id);
      return price.id;
    }
  }

  throw new Error(
    `No active Stripe price configured for Glimr tier "${tier}". ` +
      `Create a Stripe product with metadata { app: "glimr", plan: "${tier}" } and an active recurring price.`,
  );
}

/** Reads the Glimr tier (spark/flame) off a subscription's price/product metadata. */
export function extractCompanionTier(subscription: Stripe.Subscription): CompanionPaidTier | null {
  const item = subscription.items.data[0];
  if (!item) return null;

  const product = item.price.product;
  const meta =
    typeof product === "object" && product !== null && !("deleted" in product && product.deleted)
      ? (product as Stripe.Product).metadata?.plan
      : (item.price.metadata?.plan ?? undefined);

  return meta === "spark" || meta === "flame" ? meta : null;
}

export async function findOrCreateCustomerByEmail(email: string): Promise<Stripe.Customer> {
  const stripe = await getUncachableStripeClient();
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data[0]) return existing.data[0];
  return stripe.customers.create({ email, metadata: { app: "glimr" } });
}

export async function createCompanionCheckoutSession(
  tier: CompanionPaidTier,
  email: string | undefined,
  userId: string | undefined,
  successUrl: string,
  cancelUrl: string,
): Promise<Stripe.Checkout.Session> {
  const stripe = await getUncachableStripeClient();
  const priceId = await findPriceIdForTier(tier);

  const metadata: Record<string, string> = userId ? { app: "glimr", tier, userId } : { app: "glimr", tier };

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    metadata,
    subscription_data: { metadata },
  };

  if (email) {
    const customer = await findOrCreateCustomerByEmail(email);
    params.customer = customer.id;
  }

  return stripe.checkout.sessions.create(params);
}

export async function createCompanionPortalSession(
  customerId: string,
  returnUrl: string,
): Promise<Stripe.BillingPortal.Session> {
  const stripe = await getUncachableStripeClient();
  return stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
}

export async function retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  const stripe = await getUncachableStripeClient();
  return stripe.checkout.sessions.retrieve(sessionId, { expand: ["customer", "subscription"] });
}
