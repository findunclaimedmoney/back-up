import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const MONTHLY_MESSAGE_LIMITS = {
  free: 10,
  plus: 0,
  pro: 0,
  vip: 0,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const subs = await base44.entities.Subscription.filter({ created_by_id: user.id });

    if (subs.length === 0) {
      const monthlyLimit = MONTHLY_MESSAGE_LIMITS.free;
      return Response.json({
        messages_used: 1,
        messages_limit: monthlyLimit,
        messages_remaining: Math.max(0, monthlyLimit - 1),
      });
    }

    const sub = subs[0];
    const tier = sub.tier || 'free';
    const monthlyLimit = MONTHLY_MESSAGE_LIMITS[tier] ?? 0;
    const monthlyUsed = (sub.daily_messages_used || 0) + 1;

    await base44.entities.Subscription.update(sub.id, {
      daily_messages_used: monthlyUsed,
    });

    return Response.json({
      messages_used: monthlyUsed,
      messages_limit: monthlyLimit,
      messages_remaining: monthlyLimit > 0 ? Math.max(0, monthlyLimit - monthlyUsed) : -1,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});