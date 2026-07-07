import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DAILY_MESSAGE_LIMITS = {
  free: 20,
  plus: 0,
  pro: 0,
  vip: 0,
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const subs = await base44.entities.Subscription.filter({ created_by_id: user.id });
    const today = todayStr();

    if (subs.length === 0) {
      // Free tier with no subscription record
      const dailyLimit = DAILY_MESSAGE_LIMITS.free;
      return Response.json({
        daily_messages_used: 1,
        daily_messages_limit: dailyLimit,
        daily_messages_remaining: Math.max(0, dailyLimit - 1),
      });
    }

    const sub = subs[0];
    const tier = sub.tier || 'free';
    const dailyLimit = DAILY_MESSAGE_LIMITS[tier] ?? 0;

    // Reset if new day
    let dailyUsed = sub.daily_messages_used || 0;
    if (sub.daily_message_date !== today) {
      dailyUsed = 0;
    }
    dailyUsed += 1;

    await base44.entities.Subscription.update(sub.id, {
      daily_messages_used: dailyUsed,
      daily_message_date: today,
    });

    return Response.json({
      daily_messages_used: dailyUsed,
      daily_messages_limit: dailyLimit,
      daily_messages_remaining: dailyLimit > 0 ? Math.max(0, dailyLimit - dailyUsed) : -1,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});