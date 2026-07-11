import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Text messages are unlimited — no monthly cap on any tier
function getClientIP(req) {
  const headers = req.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIP = headers.get("x-real-ip");
  if (realIP) return realIP.trim();
  return "unknown";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const fingerprint = body.device_fingerprint || null;
    const clientIP = getClientIP(req);

    const subs = await base44.entities.Subscription.filter({ created_by_id: user.id });

    // No subscription yet — create one for this first-time free user
    if (subs.length === 0) {
      await base44.entities.Subscription.create({
        tier: "free",
        daily_messages_used: 1,
        device_fingerprint: fingerprint,
        signup_ip: clientIP,
      });

      return Response.json({
        messages_used: 1,
        messages_limit: 0,
        messages_remaining: -1,
      });
    }

    // Existing subscription — just increment the counter
    const sub = subs[0];
    const monthlyUsed = (sub.daily_messages_used || 0) + 1;

    await base44.asServiceRole.entities.Subscription.update(sub.id, {
      daily_messages_used: monthlyUsed,
    });

    return Response.json({
      messages_used: monthlyUsed,
      messages_limit: 0,
      messages_remaining: -1,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});