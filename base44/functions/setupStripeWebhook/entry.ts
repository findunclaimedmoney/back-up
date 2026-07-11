import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const stripeKey = Deno.env.get('STRIPE_API_KEY');

    // Get payment links
    const linksRes = await fetch('https://api.stripe.com/v1/payment_links?limit=50', {
      headers: { 'Authorization': `Bearer ${stripeKey}` },
    });
    const linksData = await linksRes.json();

    // Get products
    const productsRes = await fetch('https://api.stripe.com/v1/products?limit=50', {
      headers: { 'Authorization': `Bearer ${stripeKey}` },
    });
    const productsData = await productsRes.json();

    // Get prices
    const pricesRes = await fetch('https://api.stripe.com/v1/prices?limit=50', {
      headers: { 'Authorization': `Bearer ${stripeKey}` },
    });
    const pricesData = await pricesRes.json();

    return Response.json({
      payment_links: (linksData.data || []).map(pl => ({
        id: pl.id,
        url: pl.url,
        active: pl.active,
        description: pl.description,
        line_items: pl.line_items?.data?.map(li => ({
          product: li.price?.product,
          amount: li.price?.unit_amount,
          currency: li.price?.currency,
          recurring: li.price?.recurring?.interval,
        })),
        created: pl.created ? new Date(pl.created * 1000).toISOString() : null,
      })),
      products: (productsData.data || []).map(p => ({
        id: p.id,
        name: p.name,
        active: p.active,
        description: p.description,
      })),
      prices: (pricesData.data || []).map(pr => ({
        id: pr.id,
        product: pr.product,
        amount: pr.unit_amount,
        currency: pr.currency,
        recurring: pr.recurring?.interval,
        type: pr.type,
      })),
      counts: {
        payment_links: linksData.data?.length || 0,
        products: productsData.data?.length || 0,
        prices: pricesData.data?.length || 0,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});