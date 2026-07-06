import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const subs = await base44.entities.Subscription.filter({ created_by_id: user.id });

    if (subs.length === 0) {
      return Response.json({
        tier: 'free',
        video_minutes_used: 0,
        video_minutes_limit: 0,
        intimacy_package: false,
        credit_balance: 0,
        twin_enabled: false,
        remaining: 0
      });
    }

    const sub = subs[0];
    const used = sub.video_minutes_used || 0;
    const limit = sub.video_minutes_limit || 0;

    return Response.json({
      tier: sub.tier || 'free',
      video_minutes_used: used,
      video_minutes_limit: limit,
      intimacy_package: sub.intimacy_package || false,
      credit_balance: sub.credit_balance || 0,
      twin_enabled: sub.twin_enabled || false,
      remaining: Math.max(0, limit - used)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});