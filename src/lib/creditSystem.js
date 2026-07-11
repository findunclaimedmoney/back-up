/**
 * GLIMR Credit System — single source of truth.
 *
 * Conversion: $1 USD = 0.20 credits (1 credit = $5)
 *
 * Tiers grant a monthly credit allowance. Top-up packs add prepaid credits.
 * Credits are consumed per action: text messages, video minutes, voice replies.
 */

export const CREDITS_PER_DOLLAR = 0.20;

/** Convert USD to credits */
export function usdToCredits(usd) {
  return Math.round(usd * CREDITS_PER_DOLLAR * 100) / 100;
}

/** Convert credits to USD */
export function creditsToUsd(credits) {
  return Math.round((credits / CREDITS_PER_DOLLAR) * 100) / 100;
}

export const TIERS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    credits: 0,
    description: "Start your journey with GLIMR",
    ctaLabel: "Get Started",
    features: [
      "Text chat with all companions",
      "1 companion at a time",
      "Basic emotional memory",
      "Community support",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    price: 59,
    credits: 12,
    description: "See and hear your companion",
    ctaLabel: "Upgrade to Plus",
    features: [
      "Everything in Free",
      "12 credits / month",
      "Voice replies",
      "All companions unlocked",
      "Enhanced memory system",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 89,
    credits: 18,
    description: "Deep connection & romance",
    ctaLabel: "Upgrade to Pro",
    highlighted: true,
    badge: "popular",
    features: [
      "Everything in Plus",
      "18 credits / month",
      "Intimacy & Romantic layer",
      "Fantasy outfits & uniforms",
      "Companion's Diary",
      "Priority processing",
    ],
  },
  {
    id: "vip",
    name: "VIP",
    price: 349,
    credits: 70,
    description: "The full GLIMR experience",
    ctaLabel: "Request Invitation",
    badge: "vip",
    features: [
      "Everything in Pro",
      "70 credits / month",
      "Twin / Clone companion",
      "GLIMR Home holographic device",
      "Deepest intimacy & personalization",
      "Dedicated memory palace",
      "Early access to new companions",
    ],
  },
];

export const TIER_CREDITS = {
  free: 0,
  plus: 12,
  pro: 18,
  vip: 70,
};

export const TIER_LABELS = {
  free: "Free",
  plus: "Plus",
  pro: "Pro",
  vip: "VIP",
};

/** Credit cost per action */
export const CREDIT_COSTS = {
  text_message: 0.05,
  video_minute: 1.0,
  voice_reply: 0.04,
};

export const CONSUMPTION_ITEMS = [
  {
    key: "text_message",
    label: "Text message",
    cost: CREDIT_COSTS.text_message,
    description: "Each message you send to a companion",
  },
  {
    key: "video_minute",
    label: "Video minute",
    cost: CREDIT_COSTS.video_minute,
    description: "Live face-to-face video ($5.00 per minute — 1 credit = 1 minute)",
  },
  {
    key: "voice_reply",
    label: "Voice reply",
    cost: CREDIT_COSTS.voice_reply,
    description: "AI-generated voice message from your companion ($0.20 per reply)",
  },
];

/** Top-up credit packs — price in USD, credits = price × 0.20 */
export const TOPUP_PACKS = [
  { id: "pack_5", price: 5, credits: 1, popular: false },
  { id: "pack_10", price: 10, credits: 2, popular: true },
  { id: "pack_25", price: 25, credits: 5, popular: false },
  { id: "pack_50", price: 50, credits: 10, popular: false },
];

/** Calculate how many of a given action a credit balance can cover */
export function creditsToActions(credits, costPerAction) {
  if (costPerAction <= 0) return Infinity;
  return Math.floor(credits / costPerAction);
}