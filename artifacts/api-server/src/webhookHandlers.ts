import { eq } from 'drizzle-orm';
import { db, companionSubscribersTable } from '@workspace/db';
import { getStripeClient, getStripeWebhookSecret } from './lib/stripeClient';
import { stripeStorage } from './lib/stripeService';
import { extractCompanionTier } from './lib/companionStripe';
import { logger } from './lib/logger';
import type Stripe from 'stripe';

const PLAN_NAME_MAP: Record<string, string> = {
  starter: 'Starter',
  elite: 'Elite',
  concierge: 'Concierge',
};

function extractPlanName(subscription: Stripe.Subscription): string | null {
  const item = subscription.items.data[0];
  if (!item) return null;
  const meta = (item.price.product as Stripe.Product | null)?.metadata?.plan_id
    ?? (item.price.metadata?.plan_id ?? '');
  return PLAN_NAME_MAP[meta] ?? item.price.nickname ?? null;
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  const user = await stripeStorage.getUserByStripeCustomerId(customerId);
  if (!user) {
    // Expected for customers belonging to other products on this same Stripe account
    // (e.g. Glimr companion subscribers) — not a LensFlow user, so nothing to sync here.
    logger.debug({ customerId }, 'Stripe webhook: no LensFlow user found for customer');
    return;
  }

  if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    await stripeStorage.updateUserStripeInfo(user.id, {
      stripeSubscriptionId: undefined,
      planName: undefined,
    });
    logger.info({ userId: user.id, status: subscription.status }, 'Subscription cancelled/unpaid — cleared');
    return;
  }

  const stripe = await getStripeClient();
  const expanded = await stripe.subscriptions.retrieve(subscription.id, {
    expand: ['items.data.price.product'],
  });

  const planName = extractPlanName(expanded);
  await stripeStorage.updateUserStripeInfo(user.id, {
    stripeSubscriptionId: subscription.id,
    planName: planName ?? undefined,
  });
  logger.info({ userId: user.id, subscriptionId: subscription.id, planName }, 'Subscription upserted');
}

async function getCompanionSubscriberByCustomerId(customerId: string) {
  const [row] = await db
    .select()
    .from(companionSubscribersTable)
    .where(eq(companionSubscribersTable.stripeCustomerId, customerId))
    .limit(1);
  return row;
}

async function handleCompanionSubscriptionEvent(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  const existing = await getCompanionSubscriberByCustomerId(customerId);

  // Webhook payloads carry unexpanded line items (price.product is just an id), so
  // extractCompanionTier can't read the plan off product metadata without this
  // expanded re-fetch — without it, tier changes (e.g. a portal upgrade) never sync.
  const stripe = await getStripeClient();
  const expanded = await stripe.subscriptions.retrieve(subscription.id, {
    expand: ['items.data.price.product'],
  });
  const tier = extractCompanionTier(expanded) ?? existing?.tier ?? 'free';

  if (existing) {
    await db
      .update(companionSubscribersTable)
      .set({
        tier,
        active: isActive,
        stripeSubscriptionId: isActive ? subscription.id : null,
        updatedAt: new Date(),
      })
      .where(eq(companionSubscribersTable.id, existing.id));
    logger.info({ email: existing.email, tier, active: isActive }, 'Companion subscriber synced from webhook');
    return;
  }

  // Subscriber row doesn't exist yet. Only create one for subscriptions that were
  // actually started for Glimr (metadata set in createCompanionCheckoutSession) —
  // otherwise this would create a companion row (and grant entitlements) for any
  // LensFlow subscriber on this same Stripe account whose customer we haven't seen yet.
  if (subscription.metadata?.app !== 'glimr') {
    logger.debug({ customerId }, 'Subscription webhook: not a Glimr subscription, skipping companion sync');
    return;
  }

  // Webhook raced ahead of /subscribe/verify — create the row from the Stripe
  // customer's email so state stays consistent even if the client never calls back.
  const customer = await stripe.customers.retrieve(customerId);
  const email = !customer.deleted ? customer.email : null;
  if (!email) {
    logger.warn({ customerId }, 'Companion webhook: no email on Stripe customer, cannot create subscriber');
    return;
  }

  const normalizedEmail = email.toLowerCase();
  await db
    .insert(companionSubscribersTable)
    .values({
      email: normalizedEmail,
      stripeCustomerId: customerId,
      stripeSubscriptionId: isActive ? subscription.id : null,
      tier,
      active: isActive,
    })
    .onConflictDoUpdate({
      target: companionSubscribersTable.email,
      set: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: isActive ? subscription.id : null,
        tier,
        active: isActive,
        updatedAt: new Date(),
      },
    });
  logger.info({ email: normalizedEmail, tier, active: isActive }, 'Companion subscriber created from webhook');
}

async function handleCompanionInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const existing = await getCompanionSubscriberByCustomerId(customerId);
  if (!existing) return;

  const periodEnd = invoice.lines.data[0]?.period?.end;
  const resetAt = periodEnd ? new Date(periodEnd * 1000) : new Date(Date.now() + 30 * 86_400_000);

  await db
    .update(companionSubscribersTable)
    .set({ voiceMessagesThisMonth: 0, voiceMonthResetAt: resetAt, updatedAt: new Date() })
    .where(eq(companionSubscribersTable.id, existing.id));
  logger.info({ email: existing.email, resetAt }, 'Companion voice usage reset on invoice payment');
}

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const webhookSecret = await getStripeWebhookSecret();
    let event: Stripe.Event;

    if (webhookSecret) {
      const stripe = await getStripeClient();
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } else if (process.env.NODE_ENV === 'production') {
      // Fail closed in production: without signature verification, anyone who finds
      // this endpoint could POST a forged `customer.subscription.created` event and
      // grant themselves paid entitlements. Only sandbox/dev may skip verification.
      throw new Error(
        'STRIPE_WEBHOOK_SECRET not set — refusing to process unverified webhook in production.',
      );
    } else {
      logger.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification (sandbox only)');
      event = JSON.parse(payload.toString()) as Stripe.Event;
    }

    logger.info({ type: event.type }, 'Stripe webhook received');

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionEvent(subscription);
        await handleCompanionSubscriptionEvent(subscription);
        break;
      }
      case 'invoice.paid':
        await handleCompanionInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }
  }
}
