import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@17.0.0';

const TIER_CONFIG = {
  plus: { price: 2900, name: 'GLIMR Plus', description: '80 min HD video, voice replies, all companions' },
  pro: { price: 4900, name: 'GLIMR Pro', description: '160 min HD video, intimacy & romantic layer, fantasy outfits, diary' },
  vip: { price: 29900, name: 'GLIMR VIP', description: '500 min HD video, twin companion, GLIMR Home device, deepest intimacy' },
};

const ADDON_CONFIG = {
  intimacy: {
    '7d':  { price: 999,  name: 'Intimacy Layer — 7 Days',  description: 'Unlock the romantic & intimacy layer for 7 days',  days: 7 },
    '30d': { price: 1999, name: 'Intimacy Layer — 30 Days', description: 'Unlock the romantic & intimacy layer for 30 days', days: 30 },
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));
    const origin = req.headers.get('origin') || 'http://localhost:5173';

    // --- Add-on checkout (one-time payment) ---
    if (body.addon) {
      const addonConfig = ADDON_CONFIG[body.addon]?.[body.duration];
      if (!addonConfig) return Response.json({ error: 'Invalid add-on or duration' }, { status: 400 });

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: addonConfig.name, description: addonConfig.description },
            unit_amount: addonConfig.price,
          },
          quantity: 1,
        }],
        success_url: `${origin}/pricing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing`,
        client_reference_id: user.id,
        metadata: { type: 'addon', addon: body.addon, duration: body.duration, user_id: user.id },
      });

      return Response.json({ url: session.url });
    }

    // --- Tier checkout (monthly subscription) ---
    const { tier } = body;
    const config = TIER_CONFIG[tier];
    if (!config) return Response.json({ error: 'Invalid tier' }, { status: 400 });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: config.name, description: config.description },
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