import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const stripeKey = Deno.env.get('STRIPE_API_KEY');
    const currentSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    // List all webhook endpoints
    const webhookRes = await fetch('https://api.stripe.com/v1/webhook_endpoints?limit=20', {
      headers: { 'Authorization': `Bearer ${stripeKey}` },
    });
    const webhookData = await webhookRes.json();

    return Response.json({
      current_stored_secret_prefix: currentSecret ? currentSecret.substring(0, 12) + '...' : 'NOT SET',
      webhook_endpoints: (webhookData.data || []).map(ep => ({
        id: ep.id,
        url: ep.url,
        status: ep.status,
        enabled_events: ep.enabled_events,
        api_version: ep.api_version,
        description: ep.description,
        secret_prefix: ep.secret ? ep.secret.substring(0, 12) + '...' : null,
        matches_stored_secret: ep.secret && currentSecret ? ep.secret === currentSecret : false,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});