import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@17.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    let event;
    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    // Handle subscription deleted → downgrade to free
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = subscription.customer?.toString();

      const subs = await base44.asServiceRole.entities.Subscription.filter({ stripe_customer_id: customerId });
      if (subs.length > 0) {
        const sub = subs[0];
        await base44.asServiceRole.entities.Subscription.update(sub.id, {
          tier: 'free',
          video_minutes_limit: 0,
          video_minutes_used: 0,
          intimacy_package: false,
          twin_enabled: false,
          stripe_subscription_id: null,
          current_period_end: null,
        });
      }
    }

    // Handle subscription updated → sync renewal + tier
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const customerId = subscription.customer?.toString();

      const subs = await base44.asServiceRole.entities.Subscription.filter({ stripe_customer_id: customerId });
      if (subs.length > 0) {
        const sub = subs[0];
        const periodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;

        // Reset usage on renewal (when period resets)
        const shouldReset = sub.current_period_end && periodEnd && new Date(periodEnd) > new Date(sub.current_period_end);

        await base44.asServiceRole.entities.Subscription.update(sub.id, {
          stripe_subscription_id: subscription.id,
          current_period_end: periodEnd,
          ...(shouldReset ? { video_minutes_used: 0, daily_messages_used: 0 } : {}),
        });
      }
    }

    // Handle failed payment → downgrade to free
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const customerId = invoice.customer?.toString();

      const subs = await base44.asServiceRole.entities.Subscription.filter({ stripe_customer_id: customerId });
      if (subs.length > 0) {
        const sub = subs[0];
        await base44.asServiceRole.entities.Subscription.update(sub.id, {
          tier: 'free',
          video_minutes_limit: 0,
          intimacy_package: false,
          twin_enabled: false,
        });
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});