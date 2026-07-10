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

    // Verify the Stripe checkout session belongs to the authenticated user.
    // Prevents session reuse: another user's paid session_id cannot grant tiers/credit.
    const sessionUserId = session.metadata?.user_id || session.client_reference_id;
    if (sessionUserId !== user.id) {
      return Response.json({ error: 'This payment session does not belong to your account' }, { status: 403 });
    }

    // --- Add-on confirmation (one-time payment) ---
    if (session.metadata?.type === 'addon') {
      const addon = session.metadata.addon;
      const duration = session.metadata.duration;

      // Custom avatar creation — trigger avatar processing, no credits added
      if (addon === 'custom_avatar') {
        const companionId = session.metadata?.companion_id;
        if (!companionId) return Response.json({ error: 'Missing companion ID' }, { status: 400 });

        const companion = await base44.entities.CustomCompanion.get(companionId);
        if (!companion) return Response.json({ error: 'Companion not found' }, { status: 404 });

        await base44.entities.CustomCompanion.update(companionId, {
          avatar_status: 'processing',
        });

        try {
          const avatarRes = await base44.functions.invoke('createLiveAvatar', {
            image_url: companion.image_url,
            companion_name: companion.name,
            companion_id: companionId,
          });
          if (avatarRes.data?.avatar_id) {
            await base44.entities.CustomCompanion.update(companionId, {
              avatar_id: avatarRes.data.avatar_id,
            });
          }
        } catch (avatarErr) {
          console.error('Avatar creation failed:', avatarErr);
        }

        // Add $19.90 starter credits to the user's balance
        const STARTER_CREDIT = 19.90;
        const existingSubs = await base44.entities.Subscription.filter({ created_by_id: user.id });
        if (existingSubs.length > 0) {
          const sub = existingSubs[0];
          const newBalance = (sub.credit_balance || 0) + STARTER_CREDIT;
          await base44.entities.Subscription.update(sub.id, {
            credit_balance: newBalance,
            stripe_customer_id: session.customer?.toString() || sub.stripe_customer_id,
          });
        } else {
          await base44.entities.Subscription.create({
            tier: 'free',
            video_minutes_limit: 0,
            video_minutes_used: 0,
            credit_balance: STARTER_CREDIT,
            stripe_customer_id: session.customer?.toString() || null,
          });
        }

        return Response.json({ companion_id: companionId, companion_name: companion.name, credit_added: STARTER_CREDIT });
      }

      const CREDIT_AMOUNTS = {
        intimacy: { '15min': 4.00, '30min': 8.00, '60min': 15.00 },
        topup: { 'pack_5': 5.00, 'pack_10': 10.00, 'pack_25': 25.00, 'pack_50': 50.00 },
        feature_session: { '15min': 2.99, '30min': 4.99, '60min': 8.99 },
      };

      const creditToAdd = CREDIT_AMOUNTS[addon]?.[duration] || 0;
      if (creditToAdd === 0) {
        return Response.json({ error: 'Unknown add-on or duration' }, { status: 400 });
      }

      const existing = await base44.entities.Subscription.filter({ created_by_id: user.id });

      if (existing.length > 0) {
        const sub = existing[0];
        const newBalance = (sub.credit_balance || 0) + creditToAdd;
        await base44.entities.Subscription.update(sub.id, {
          credit_balance: newBalance,
          stripe_customer_id: session.customer?.toString() || sub.stripe_customer_id,
        });
        return Response.json({ addon, credit_added: creditToAdd, new_balance: newBalance });
      } else {
        await base44.entities.Subscription.create({
          tier: 'free',
          video_minutes_limit: 0,
          video_minutes_used: 0,
          credit_balance: creditToAdd,
          stripe_customer_id: session.customer?.toString() || null,
        });
        return Response.json({ addon, credit_added: creditToAdd, new_balance: creditToAdd });
      }
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

    // Send welcome email after successful tier upgrade
    try {
      await base44.functions.invoke('sendWelcomeEmail', {
        to_email: user.email,
        to_name: user.full_name || '',
      });
    } catch (emailErr) {
      // Don't fail the confirmation if email fails
      console.error('Welcome email failed:', emailErr);
    }

    return Response.json({ tier, minutes: config.minutes, intimacy: config.intimacy });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});