import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const stripeKey = Deno.env.get('STRIPE_API_KEY');
    const appId = Deno.env.get('BASE44_APP_ID') || '6a4ad4122d2c58f83324b2ce';
    const webhookUrl = `https://www.base44.com/apps/${appId}/functions/stripeWebhook`;

    // List existing endpoints
    const listRes = await fetch('https://api.stripe.com/v1/webhook_endpoints', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${stripeKey}` },
    });
    const existing = await listRes.json();
    const endpoint = (existing.data || []).find(ep => ep.url === webhookUrl);

    if (!endpoint) {
      return Response.json({ error: 'Webhook endpoint not found' }, { status: 404 });
    }

    // Delete the existing endpoint so we can recreate and capture the secret
    const delRes = await fetch(`https://api.stripe.com/v1/webhook_endpoints/${endpoint.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${stripeKey}` },
    });
    const delData = await delRes.json();

    if (delData.error) {
      return Response.json({ error: delData.error }, { status: 400 });
    }

    // Create new endpoint — the secret is only returned in the create response
    const params = new URLSearchParams();
    params.append('url', webhookUrl);
    params.append('description', 'GLIMR — payments, subscriptions, credits');
    params.append('enabled_events[]', 'checkout.session.completed');
    params.append('enabled_events[]', 'customer.subscription.deleted');
    params.append('enabled_events[]', 'customer.subscription.updated');
    params.append('enabled_events[]', 'invoice.payment_failed');

    const createRes = await fetch('https://api.stripe.com/v1/webhook_endpoints', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const created = await createRes.json();

    if (created.error) {
      return Response.json({ error: created.error }, { status: 400 });
    }

    // Compare the new secret with the one currently set
    const currentSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const newSecret = created.secret;
    const secretsMatch = currentSecret && newSecret && currentSecret === newSecret;

    return Response.json({
      action: 'recreated',
      id: created.id,
      url: created.url,
      enabled_events: created.enabled_events,
      status: created.status,
      webhook_secret: newSecret,
      current_secret_prefix: currentSecret ? currentSecret.substring(0, 15) + '...' : 'NOT SET',
      new_secret_prefix: newSecret ? newSecret.substring(0, 15) + '...' : 'NOT RETURNED',
      secrets_match: secretsMatch,
      needs_update: !secretsMatch,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});