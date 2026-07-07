import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const TIER_PRICES = { plus: 29, pro: 49, vip: 299 };
const ADDON_PRICES = {
  intimacy: { '15min': 4, '30min': 8, '60min': 15 },
  topup: { 'pack_5': 5, 'pack_10': 10, 'pack_25': 25, 'pack_50': 50 },
};
const ASSET_CONFIG = {
  USDC: { krakenAsset: 'USDC', pair: null, decimals: 2 },
  BTC: { krakenAsset: 'XBT', pair: 'XXBTZUSD', decimals: 8 },
  ETH: { krakenAsset: 'ETH', pair: 'XETHZUSD', decimals: 8 },
};

let _nonceSeq = 0;
async function krakenRequest(path, params, apiKey, apiSecret) {
  _nonceSeq++;
  const nonce = (Date.now() * 1000 + _nonceSeq).toString();
  const body = new URLSearchParams({ nonce, ...params }).toString();
  const sha256buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce + body));
  const sha256hex = Array.from(new Uint8Array(sha256buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  const keyBytes = Uint8Array.from(atob(apiSecret), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(path + sha256hex));
  const sigb64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  const res = await fetch('https://api.kraken.com' + path, {
    method: 'POST',
    headers: { 'API-Key': apiKey, 'API-Sign': sigb64, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  return res.json();
}

async function getPrice(asset) {
  if (asset === 'USDC') return 1;
  const cfg = ASSET_CONFIG[asset];
  const res = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${cfg.pair}`);
  const data = await res.json();
  const key = Object.keys(data.result)[0];
  return parseFloat(data.result[key].c[0]);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, reference, asset } = await req.json();
    if (!ASSET_CONFIG[asset]) return Response.json({ error: 'Unsupported asset' }, { status: 400 });

    let usdAmount;
    if (type === 'tier') usdAmount = TIER_PRICES[reference];
    else if (type === 'topup' || type === 'intimacy') usdAmount = ADDON_PRICES[type]?.[reference];

    if (!usdAmount) return Response.json({ error: 'Invalid purchase' }, { status: 400 });

    if (type === 'intimacy') {
      const subs = await base44.entities.Subscription.filter({ created_by_id: user.id });
      const minutesUsed = subs[0]?.video_minutes_used || 0;
      if (minutesUsed < 160) {
        return Response.json({ error: 'Minimum 160 video minutes required', minimum_required: true }, { status: 403 });
      }
    }

    const apiKey = Deno.env.get('KRAKEN_API_KEY');
    const apiSecret = Deno.env.get('KRAKEN_PRIVATE_KEY');
    if (!apiKey || !apiSecret) return Response.json({ error: 'Kraken keys not configured' }, { status: 500 });

    const price = await getPrice(asset);
    let cryptoAmount;
    if (asset === 'USDC') {
      cryptoAmount = Math.round((usdAmount + 0.1 + Math.random() * 0.89) * 100) / 100;
    } else {
      const base = usdAmount / price;
      const jitter = base * (0.001 + Math.random() * 0.004);
      cryptoAmount = Math.round((base + jitter) * 1e8) / 1e8;
    }

    const krakenAsset = ASSET_CONFIG[asset].krakenAsset;
    const addrParams = { asset: krakenAsset };

    // Some assets (e.g. USDC) have multiple deposit networks — fetch the method list and pick one.
    const methodsRes = await krakenRequest('/0/private/DepositMethods', { asset: krakenAsset }, apiKey, apiSecret);
    if (methodsRes.error || !methodsRes.result || methodsRes.result.length === 0) {
      const errMsg = methodsRes.error ? (Array.isArray(methodsRes.error) ? methodsRes.error.join('; ') : methodsRes.error) : 'No methods returned';
      return Response.json({ error: `DepositMethods for ${krakenAsset}: ${errMsg}`, debug: methodsRes }, { status: 502 });
    }
    const methods = methodsRes.result;
    if (methods.length > 0 && methods[0].method) {
      addrParams.method = methods[0].method;
    }

    const addrRes = await krakenRequest('/0/private/DepositAddresses', addrParams, apiKey, apiSecret);
    if (addrRes.error && (!addrRes.result || addrRes.result.length === 0)) {
      const errMsg = Array.isArray(addrRes.error) ? addrRes.error.join('; ') : (typeof addrRes.error === 'string' ? addrRes.error : 'Kraken error');
      return Response.json({ error: `DepositAddresses: ${errMsg}`, debug_methods: methods, debug_addr_params: addrParams }, { status: 502 });
    }
    const addresses = addrRes.result || [];
    let address = null;
    for (const a of addresses) {
      if (typeof a === 'string') { address = a; break; }
      if (a && a.address) { address = a.address; break; }
    }
    if (!address) return Response.json({ error: 'Could not retrieve deposit address' }, { status: 502 });

    const order = await base44.entities.CryptoOrder.create({
      order_type: type,
      reference,
      usd_amount: usdAmount,
      crypto_asset: asset,
      crypto_amount: cryptoAmount,
      deposit_address: address,
      status: 'pending',
    });

    return Response.json({ order_id: order.id, asset, address, crypto_amount: cryptoAmount, usd_amount: usdAmount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});