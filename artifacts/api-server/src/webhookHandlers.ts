import { getStripeClient, getStripeWebhookSecret } from './lib/stripeClient';
import { stripeStorage } from './lib/stripeService';
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
    logger.warn({ customerId }, 'Stripe webhook: no user found for customer');
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
    } else {
      logger.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification (sandbox only)');
      event = JSON.parse(payload.toString()) as Stripe.Event;
    }

    logger.info({ type: event.type }, 'Stripe webhook received');

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  }
}
