import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@17.0.0';

const TIER_CONFIG = {
  plus: { price: 2900, name: 'GLIMR Plus', description: '80 min HD video, voice replies, all companions' },
  pro: { price: 4900, name: 'GLIMR Pro', description: '160 min HD video, intimacy & romantic layer, fantasy outfits, diary' },
  vip: { price: 29900, name: 'GLIMR VIP', description: '500 min HD video, twin companion, GLIMR Home device, deepest intimacy' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tier } = await req.json();
    const config = TIER_CONFIG[tier];
    if (!config) return Response.json({ error: 'Invalid tier' }, { status: 400 });

    const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));
    const origin = req.headers.get('origin') || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: config.name,
            description: config.description,
          },
          unit_amount: config.price,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      success_url: `${origin}/pricing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      client_reference_id: user.id,
      metadata: { tier, user_id: user.id },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});