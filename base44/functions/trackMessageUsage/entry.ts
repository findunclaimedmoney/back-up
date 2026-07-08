import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const MONTHLY_MESSAGE_LIMITS = {
  free: 10,
  plus: 0,
  pro: 0,
  vip: 0,
};

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

    // No subscription yet — this is a first-time free user
    if (subs.length === 0) {
      // Check if this device fingerprint or IP already has a free-tier subscription
      if (fingerprint) {
        const existingByFingerprint = await base44.asServiceRole.entities.Subscription.filter({
          device_fingerprint: fingerprint,
          tier: "free",
        });
        const fromOtherUser = existingByFingerprint.find((s) => s.created_by_id !== user.id);
        if (fromOtherUser) {
          return Response.json({
            messages_used: 10,
            messages_limit: 10,
            messages_remaining: 0,
            blocked: true,
            message: "This device has already used the free message limit. Upgrade to continue.",
          });
        }
      }

      // Check by IP
      if (clientIP && clientIP !== "unknown") {
        const existingByIP = await base44.asServiceRole.entities.Subscription.filter({
          signup_ip: clientIP,
          tier: "free",
        });
        const fromOtherUserIP = existingByIP.find((s) => s.created_by_id !== user.id);
        if (fromOtherUserIP) {
          return Response.json({
            messages_used: 10,
            messages_limit: 10,
            messages_remaining: 0,
            blocked: true,
            message: "This network has already used the free message limit. Upgrade to continue.",
          });
        }
      }

      // No duplicates found — create the free subscription with fingerprint + IP
      await base44.entities.Subscription.create({
        tier: "free",
        daily_messages_used: 1,
        device_fingerprint: fingerprint,
        signup_ip: clientIP,
      });

      return Response.json({
        messages_used: 1,
        messages_limit: 10,
        messages_remaining: 9,
      });
    }

    // Existing subscription — just increment
    const sub = subs[0];
    const tier = sub.tier || 'free';
    const monthlyLimit = MONTHLY_MESSAGE_LIMITS[tier] ?? 0;
    const monthlyUsed = (sub.daily_messages_used || 0) + 1;

    await base44.asServiceRole.entities.Subscription.update(sub.id, {
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