import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// MoonPay asset code mapping
const MOONPAY_CURRENCY = {
  BTC: 'btc',
  ETH: 'eth',
  USDC: 'usdc',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { order_id } = await req.json();

    // Fetch the existing crypto order to get the deposit address + asset + amount
    const order = await base44.entities.CryptoOrder.get(order_id);
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    if (order.status !== 'pending') return Response.json({ error: 'Order is no longer pending' }, { status: 400 });

    const moonpayCurrency = MOONPAY_CURRENCY[order.crypto_asset];
    if (!moonpayCurrency) return Response.json({ error: 'Unsupported asset for MoonPay' }, { status: 400 });

    const publicKey = Deno.env.get('MOONPAY_PUBLIC_KEY');
    if (!publicKey) return Response.json({ error: 'MoonPay public key not configured' }, { status: 500 });

    // Build the widget URL with the deposit address as the wallet destination
    const params = new URLSearchParams({
      apiKey: publicKey,
      currencyCode: moonpayCurrency,
      walletAddress: order.deposit_address,
      baseCurrencyCode: 'usd',
      baseCurrencyAmount: String(order.usd_amount),
      lockAmount: 'true',
    });

    return Response.json({ url: `https://buy.moonpay.com?${params.toString()}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});