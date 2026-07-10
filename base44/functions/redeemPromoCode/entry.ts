import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { code } = await req.json();
    if (!code || typeof code !== 'string') {
      return Response.json({ error: 'Please enter a code.' }, { status: 400 });
    }

    const normalized = code.trim().toUpperCase();

    // Look up the promo code (service role — entity is admin-only)
    const codes = await base44.asServiceRole.entities.PromoCode.filter({
      code: normalized
    });

    if (codes.length === 0) {
      return Response.json({ error: 'Invalid promo code.' }, { status: 404 });
    }

    const promo = codes[0];

    // Validate status
    if (promo.status !== 'active') {
      return Response.json({ error: 'This code is no longer active.' }, { status: 400 });
    }

    // Validate expiry
    if (promo.expires_date) {
      if (new Date(promo.expires_date) < new Date()) {
        return Response.json({ error: 'This code has expired.' }, { status: 400 });
      }
    }

    // Validate usage limit
    if (promo.max_uses > 0 && promo.used_count >= promo.max_uses) {
      return Response.json({ error: 'This code has reached its usage limit.' }, { status: 400 });
    }

    // Prevent double redemption
    const redeemedIds = promo.redeemed_user_ids || [];
    if (redeemedIds.includes(user.id)) {
      return Response.json({ error: 'You have already redeemed this code.' }, { status: 400 });
    }

    // Find or create the user's subscription
    let subs = await base44.asServiceRole.entities.Subscription.filter({
      owner_user_id: user.id
    });

    let sub;
    if (subs.length === 0) {
      // Also check created_by_id
      subs = await base44.asServiceRole.entities.Subscription.filter({
        created_by_id: user.id
      });
    }

    if (subs.length === 0) {
      // Create a free-tier subscription with the promo credits
      sub = await base44.asServiceRole.entities.Subscription.create({
        tier: 'free',
        monthly_credits: 0,
        credits_used: 0,
        credit_balance: promo.credit_amount,
        video_minutes_used: 0,
        video_minutes_limit: 0,
        intimacy_package: false,
        intimacy_sessions_completed: 0,
        twin_enabled: false,
        owner_user_id: user.id
      });
    } else {
      sub = subs[0];
      const newBalance = (sub.credit_balance || 0) + promo.credit_amount;
      await base44.asServiceRole.entities.Subscription.update(sub.id, {
        credit_balance: newBalance
      });
    }

    // Increment usage and track redemption
    await base44.asServiceRole.entities.PromoCode.update(promo.id, {
      used_count: (promo.used_count || 0) + 1,
      redeemed_user_ids: [...redeemedIds, user.id]
    });

    const newBalance = sub.id
      ? (sub.credit_balance || 0) + promo.credit_amount
      : promo.credit_amount;

    return Response.json({
      success: true,
      credits_granted: promo.credit_amount,
      new_balance: newBalance
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});