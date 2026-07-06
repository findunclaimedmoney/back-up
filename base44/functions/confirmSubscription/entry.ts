import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@17.0.0';

const TIER_CONFIG = {
  plus: { minutes: 80, intimacy: false, twin: false },
  pro: { minutes: 160, intimacy: true, twin: false },
  vip: { minutes: 500, intimacy: true, twin: true },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { session_id } = await req.json();
    const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return Response.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // --- Add-on confirmation (one-time payment) ---
    if (session.metadata?.type === 'addon') {
      const addon = session.metadata.addon;
      const duration = session.metadata.duration;

      if (addon === 'intimacy') {
        const CREDIT_AMOUNTS = { '15min': 4.00, '30min': 8.00, '60min': 15.00 };
        const creditToAdd = CREDIT_AMOUNTS[duration] || 0;

        const existing = await base44.entities.Subscription.filter({ created_by_id: user.id });

        if (existing.length > 0) {
          const sub = existing[0];
          const newBalance = (sub.credit_balance || 0) + creditToAdd;
          await base44.entities.Subscription.update(sub.id, {
            credit_balance: newBalance,
            stripe_customer_id: session.customer?.toString() || sub.stripe_customer_id,
          });
          return Response.json({ addon: 'intimacy', credit_added: creditToAdd, new_balance: newBalance });
        } else {
          await base44.entities.Subscription.create({
            tier: 'free',
            video_minutes_limit: 0,
            video_minutes_used: 0,
            credit_balance: creditToAdd,
            stripe_customer_id: session.customer?.toString() || null,
          });
          return Response.json({ addon: 'intimacy', credit_added: creditToAdd, new_balance: creditToAdd });
        }
      }

      return Response.json({ error: 'Unknown add-on' }, { status: 400 });
    }

    // --- Tier confirmation (monthly subscription) ---
    const tier = session.metadata?.tier;
    const config = TIER_CONFIG[tier];
    if (!config) return Response.json({ error: 'Invalid tier in session' }, { status: 400 });

    const periodEnd = session.expires_at
      ? new Date(session.expires_at * 1000 + 30 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const existing = await base44.entities.Subscription.filter({ created_by_id: user.id });

    if (existing.length > 0) {
      const sub = existing[0];
      await base44.entities.Subscription.update(sub.id, {
        tier,
        video_minutes_limit: config.minutes,
        video_minutes_used: 0,
        intimacy_package: config.intimacy,
        twin_enabled: config.twin,
        stripe_customer_id: session.customer?.toString() || sub.stripe_customer_id,
        stripe_subscription_id: session.subscription?.toString() || sub.stripe_subscription_id,
        current_period_end: periodEnd,
      });
    } else {
      await base44.entities.Subscription.create({
        tier,
        video_minutes_limit: config.minutes,
        video_minutes_used: 0,
        intimacy_package: config.intimacy,
        twin_enabled: config.twin,
        stripe_customer_id: session.customer?.toString() || null,
        stripe_subscription_id: session.subscription?.toString() || null,
        current_period_end: periodEnd,
      });
    }

    return Response.json({ tier, minutes: config.minutes, intimacy: config.intimacy });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});