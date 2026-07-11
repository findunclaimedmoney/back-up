import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const stripeKey = Deno.env.get('STRIPE_API_KEY');
    const res = await fetch('https://api.stripe.com/v1/account', {
      headers: { 'Authorization': `Bearer ${stripeKey}` },
    });
    const data = await res.json();

    if (data.error) return Response.json({ error: data.error }, { status: 400 });

    return Response.json({
      account_id: data.id,
      business_name: data.business_profile?.name || data.display_name || '(not set)',
      display_name: data.display_name,
      email: data.email,
      country: data.country,
      default_currency: data.default_currency,
      business_type: data.business_type,
      payouts_enabled: data.payouts_enabled,
      charges_enabled: data.charges_enabled,
      details_submitted: data.details_submitted,
      mode: data.livemode ? 'live' : 'test',
      statement_descriptor: data.settings?.payments?.statement_descriptor,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});