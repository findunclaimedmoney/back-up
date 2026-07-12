import { Router } from "express";
import { db, usersTable, entitiesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { Resend } from "resend";

const RESEND_FROM = "GLIMR <hello@glimr.com.au>";

function getResend(): Resend | null {
  const key = process.env["RESEND_API_KEY"];
  return key ? new Resend(key) : null;
}

async function getAdminEmails(): Promise<string[]> {
  try {
    const admins = await db
      .select({ email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.role as any, "admin"))
      .limit(10);
    const emails = admins.map((a) => a.email).filter(Boolean) as string[];
    return emails.length > 0 ? emails : ["hello@glimr.com.au"];
  } catch {
    return ["hello@glimr.com.au"];
  }
}

const router = Router();

// ── Public functions — no auth required (anonymous visitors) ──────────────────
const PUBLIC_FN = new Set(["trackVisit", "convertVisit"]);

router.post("/:name", async (req, res, next) => {
  const { name } = req.params as { name: string };
  if (!PUBLIC_FN.has(name)) return next();

  const params: Record<string, unknown> = req.body?.params ?? req.body ?? {};
  const session = req.session as any;
  const userId = session?.userId ?? null;

  switch (name) {
    case "trackVisit": {
      const { companion_id, source, ref_code, utm_campaign, visitor_key } = params as Record<string, string>;
      const [visit] = await db.insert(entitiesTable).values({
        model: "Visit",
        userId: userId as any ?? null,
        data: {
          companion_id:  companion_id ?? "home",
          source:        source        ?? "direct",
          ref_code:      ref_code      ?? null,
          utm_campaign:  utm_campaign  ?? null,
          visitor_key:   visitor_key   ?? null,
          converted:     false,
          visited_at:    new Date().toISOString(),
        },
      }).returning({ id: entitiesTable.id });
      return res.json({ data: { visit_id: visit.id, success: true } });
    }
    case "convertVisit": {
      const { visit_id } = params as { visit_id: string };
      if (visit_id) {
        const [existing] = await db.select().from(entitiesTable)
          .where(and(eq(entitiesTable.id, visit_id as any), eq(entitiesTable.model, "Visit")))
          .limit(1);
        if (existing) {
          await db.update(entitiesTable).set({
            data: { ...(existing.data as object), converted: true, converted_at: new Date().toISOString(), converted_user_id: userId },
            updatedDate: new Date(),
          }).where(eq(entitiesTable.id, visit_id as any));
        }
      }
      return res.json({ data: { success: true } });
    }
    default:
      return next();
  }
});

// ── All other functions require auth ──────────────────────────────────────────
router.use(requireAuth);

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_PRICES: Record<string, { name: string; amountCents: number; credits: number }> = {
  starter: { name: "GLIMR Starter", amountCents:  2900, credits:  5 },
  plus:    { name: "GLIMR Plus",    amountCents:  4900, credits: 10 },
  pro:     { name: "GLIMR Pro",     amountCents:  9900, credits: 20 },
  vip:     { name: "GLIMR VIP",     amountCents: 19900, credits: 50 },
};

const TOPUP_PRICES: Record<string, { name: string; amountCents: number; credits: number }> = {
  pack_20:  { name: "4 credits",  amountCents:  2000, credits: 4  },
  pack_25:  { name: "5 credits",  amountCents:  2500, credits: 5  },
  pack_50:  { name: "10 credits", amountCents:  5000, credits: 10 },
  pack_100: { name: "20 credits", amountCents: 10000, credits: 20 },
};

// Session packages — billed as one-time payments, add credits + unlock layer
const INTIMACY_PRICES: Record<string, { name: string; amountCents: number; credits: number }> = {
  "15min": { name: "Intimacy Session — 15 Minutes", amountCents:  7500, credits: 15 },
  "30min": { name: "Intimacy Session — 30 Minutes", amountCents: 15000, credits: 30 },
};

const BEDTIME_PRICES: Record<string, { name: string; amountCents: number; credits: number }> = {
  "15min": { name: "Bedtime Talk with Jess — 15 Minutes", amountCents:  5500, credits: 11 },
  "30min": { name: "Bedtime Talk with Jess — 30 Minutes", amountCents:  9900, credits: 20 },
};

// Companion photo packs — one-time purchases, grant photoCredits on the subscription
const PHOTO_PRICES: Record<string, { name: string; amountCents: number; photoCredits: number }> = {
  photos_5:  { name: "5 Companion Photos",  amountCents: 1500, photoCredits: 5  },
  photos_10: { name: "10 Companion Photos", amountCents: 2500, photoCredits: 10 },
};

function baseUrl(): string {
  // In production always use the canonical domain so Stripe redirects land on glimr.com.au
  if (process.env["NODE_ENV"] === "production") {
    return process.env["APP_URL"] ?? "https://glimr.com.au";
  }
  return process.env["REPLIT_DEV_DOMAIN"]
    ? `https://${process.env["REPLIT_DEV_DOMAIN"]}`
    : process.env["APP_URL"] ?? "https://glimr.com.au";
}

// ─── Stripe helpers ───────────────────────────────────────────────────────────

async function getStripe() {
  const key = process.env["STRIPE_LIVE_SECRET_KEY"];
  if (!key) throw new Error("Stripe not configured");
  const { default: Stripe } = await import("stripe");
  return new Stripe(key as string);
}

async function ensureStripeCustomer(stripe: any, userId: string, email: string): Promise<string> {
  const rows = await db
    .select({ stripeCustomerId: usersTable.stripeCustomerId })
    .from(usersTable)
    .where(eq(usersTable.id, userId as any))
    .limit(1);

  if (rows[0]?.stripeCustomerId) return rows[0].stripeCustomerId;

  const customer = await stripe.customers.create({ email, metadata: { userId } });
  await db.update(usersTable)
    .set({ stripeCustomerId: customer.id })
    .where(eq(usersTable.id, userId as any));
  return customer.id;
}

async function getSubEntity(userId: string) {
  const rows = await db
    .select()
    .from(entitiesTable)
    .where(and(eq(entitiesTable.model, "Subscription"), eq(entitiesTable.userId, userId as any)))
    .orderBy(desc(entitiesTable.updatedDate))
    .limit(1);
  return rows[0] ?? null;
}

async function upsertSubEntity(userId: string, existing: any, patch: Record<string, unknown>) {
  const merged = { ...(existing?.data ?? {}), ...patch };
  if (existing) {
    await db.update(entitiesTable)
      .set({ data: merged, updatedDate: new Date() })
      .where(eq(entitiesTable.id, existing.id));
  } else {
    await db.insert(entitiesTable).values({ model: "Subscription", userId: userId as any, data: merged });
  }
  return merged;
}

// ─── Router ───────────────────────────────────────────────────────────────────

router.post("/:name", async (req, res) => {
  const { name } = req.params as { name: string };
  const session = req.session as any;
  const userId: string = session.userId;
  const params: Record<string, any> = req.body ?? {};
  req.log.info({ name }, "functions invoke");

  try {
    switch (name) {

      // ── Subscription ──────────────────────────────────────────────────────

      case "getSubscription": {
        const sub = await getSubEntity(userId);
        const d: Record<string, any> = (sub?.data as any) ?? {};
        const isPro = ["pro", "vip"].includes(d.tier ?? "free");
        return res.json({
          data: {
            tier:                        d.tier                   ?? "free",
            status:                      d.status                 ?? "active",
            credit_balance:              d.creditBalance          ?? 0,
            monthly_credits:             d.monthlyCredits         ?? 0,
            credits_used:                d.creditsUsed            ?? 0,
            video_minutes_used:          d.videoMinutesUsed       ?? 0,
            // Pro includes face-to-face (Anam) — treated as intimacy_package
            intimacy_package:            isPro || (d.intimacyPackage ?? false),
            twin_enabled:                isPro || (d.twinEnabled    ?? false),
            intimacy_sessions_completed: d.intimacySessions       ?? 0,
            plan:                        d.tier                   ?? "free",
            credits:                     d.monthlyCredits         ?? 0,
            photoCredits:                d.photoCredits           ?? 0,
          },
        });
      }

      case "createCheckout": {
        const stripe = await getStripe();
        const userRow = await db
          .select({ email: usersTable.email })
          .from(usersTable)
          .where(eq(usersTable.id, userId as any))
          .limit(1);
        const email = userRow[0]?.email ?? "";
        const customerId = await ensureStripeCustomer(stripe, userId, email);

        if (params.tier && params.tier !== "free") {
          const tier = TIER_PRICES[params.tier as string];
          if (!tier) return res.json({ data: { url: null, message: "Unknown plan" } });

          const sess = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [{
              price_data: {
                currency: "aud",
                product_data: { name: tier.name, description: `${tier.credits} live video credits per month` },
                unit_amount: tier.amountCents,
                recurring: { interval: "month" },
              },
              quantity: 1,
            }],
            metadata: { userId, tier: params.tier as string, companion_id: (params.companion_id as string) || "mia" },
            success_url: `${baseUrl()}/pricing?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url:  `${baseUrl()}/pricing`,
            ...(params.coupon ? { discounts: [{ coupon: params.coupon as string }] } : {}),
          });
          return res.json({ data: { url: sess.url } });
        }

        // Top-up / add-on / session package
        const addonType = (params.addon ?? "topup") as string;
        const packId = (params.duration ?? params.pack_id) as string;

        // Photo packs use a separate metadata key (photo_credits, not credits)
        if (addonType === "photos") {
          const photoPack = PHOTO_PRICES[packId];
          if (!photoPack) return res.json({ data: { url: null, message: "Unknown photo pack" } });
          const photoSess = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [{ price_data: { currency: "aud", product_data: { name: `GLIMR — ${photoPack.name}` }, unit_amount: photoPack.amountCents }, quantity: 1 }],
            metadata: { userId, addon: "photos", packId, photo_credits: String(photoPack.photoCredits) },
            success_url: `${baseUrl()}/pricing?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url:  `${baseUrl()}/pricing`,
          });
          return res.json({ data: { url: photoSess.url } });
        }

        const pack =
          addonType === "intimacy" ? INTIMACY_PRICES[packId] :
          addonType === "bedtime"  ? BEDTIME_PRICES[packId]  :
          TOPUP_PRICES[packId];

        if (!pack) return res.json({ data: { url: null, message: "Unknown pack" } });

        const sess = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [{
            price_data: {
              currency: "aud",
              product_data: { name: `GLIMR — ${pack.name}` },
              unit_amount: pack.amountCents,
            },
            quantity: 1,
          }],
          metadata: { userId, addon: addonType, packId, credits: String(pack.credits) },
          success_url: `${baseUrl()}/pricing?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url:  `${baseUrl()}/pricing`,
        });
        return res.json({ data: { url: sess.url } });
      }

      case "manageBilling": {
        const stripe = await getStripe();
        const rows = await db
          .select({ stripeCustomerId: usersTable.stripeCustomerId })
          .from(usersTable)
          .where(eq(usersTable.id, userId as any))
          .limit(1);
        const cid = rows[0]?.stripeCustomerId;
        if (!cid) return res.json({ data: { url: null, message: "No billing account yet — subscribe first." } });

        const portal = await stripe.billingPortal.sessions.create({
          customer: cid,
          return_url: `${baseUrl()}/pricing`,
        });
        return res.json({ data: { url: portal.url } });
      }

      case "confirmSubscription": {
        const sessionId = params.session_id as string;
        if (!sessionId) return res.json({ data: { success: false } });

        const stripe = await getStripe();
        const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

        if (stripeSession.payment_status !== "paid" && stripeSession.status !== "complete") {
          return res.json({ data: { success: false, message: "Payment not complete" } });
        }

        const meta = stripeSession.metadata ?? {};
        const customerId = stripeSession.customer as string;
        if (customerId) {
          await db.update(usersTable)
            .set({ stripeCustomerId: customerId })
            .where(eq(usersTable.id, userId as any));
        }

        const existing = await getSubEntity(userId);

        if (meta.tier) {
          const tier = TIER_PRICES[meta.tier];
          const currentBalance = (existing?.data as any)?.creditBalance ?? 0;
          const updated = await upsertSubEntity(userId, existing, {
            tier: meta.tier,
            status: "active",
            stripeCustomerId: customerId,
            stripeSubscriptionId: stripeSession.subscription as string,
            monthlyCredits: tier?.credits ?? 0,
            creditBalance: currentBalance + (tier?.credits ?? 0),
          });
          return res.json({ data: { success: true, tier: meta.tier, ...updated } });
        }

        // Photo pack purchase — add photoCredits, not regular credits
        if (meta.photo_credits) {
          const addPhotoCredits = parseInt(meta.photo_credits, 10);
          const currentPhotoCredits = (existing?.data as any)?.photoCredits ?? 0;
          const updated = await upsertSubEntity(userId, existing, {
            photoCredits: currentPhotoCredits + addPhotoCredits,
          });
          return res.json({ data: { success: true, photo_credits_added: addPhotoCredits, new_balance: updated.photoCredits } });
        }

        if (meta.credits) {
          const addCredits = parseInt(meta.credits, 10);
          const currentBalance = (existing?.data as any)?.creditBalance ?? 0;
          // Intimacy purchases also unlock the intimacy layer
          const extra = meta.addon === "intimacy" ? { intimacyPackage: true } : {};
          const updated = await upsertSubEntity(userId, existing, {
            creditBalance: currentBalance + addCredits,
            ...extra,
          });
          return res.json({ data: { success: true, credit_added: addCredits, new_balance: updated.creditBalance } });
        }

        return res.json({ data: { success: true } });
      }

      // ── Account ───────────────────────────────────────────────────────────

      case "deleteAccount": {
        await db.delete(usersTable).where(eq(usersTable.id, userId as any));
        req.session.destroy(() => {});
        return res.json({ success: true });
      }

      case "requestCompanionPhoto": {
        const sub = await getSubEntity(userId);
        const d = (sub?.data ?? {}) as any;
        const photoCredits = d.photoCredits ?? 0;

        if (photoCredits <= 0) {
          return res.json({ data: { error: "no_credits", message: "You're out of photo credits." } });
        }

        const companionId = params.companion_id as string;

        const COMPANION_VISUALS: Record<string, string> = {
          jess:    "A candid phone selfie of a beautiful young woman with long wavy brown hair, warm brown eyes, genuine warm smile. Cozy bedroom with soft warm lighting, casual clothing. Real phone selfie — slightly imperfect angle, intimate and warm.",
          mia:     "A candid phone selfie of a beautiful young woman with golden blonde hair, bright eyes, radiant warm smile. Bright natural lighting, casual stylish clothing. Real phone selfie — bright, genuine.",
          zac:     "A candid phone selfie of a handsome young man with short brown hair, strong jaw, warm steady eyes. Casual indoor setting, warm natural lighting. Real phone selfie — natural, warm.",
          blake:   "A candid phone selfie of a handsome young man with short brown hair, captivating gaze, magnetic presence. Warm indoor setting. Real phone selfie — natural, intimate.",
          leo:     "A candid phone selfie of a handsome young man with dark hair, spontaneous energetic smile. Casual lively setting. Real phone selfie — fun, natural.",
          marcus:  "A candid phone selfie of a handsome young man with dark hair, calm sophisticated presence, warm direct expression. Elegant casual setting. Real phone selfie — composed, warm.",
          luna:    "A candid phone selfie of a beautiful young woman with flowing dark hair, mysterious captivating eyes. Soft ethereal indoor setting. Real phone selfie — dreamy, intimate.",
          sophie:  "A candid photo of a beautiful young woman with warm brown hair, bright adventurous smile. Beautiful natural outdoor setting. Real phone selfie — bright, warm, genuine.",
          natalie: "A candid phone selfie of an elegant young woman, sophisticated warm presence. Stylish indoor setting. Real phone selfie — polished but natural.",
          jessica: "A candid phone selfie of a beautiful young woman with dark hair, flirtatious playful smile. Casual fun setting. Real phone selfie — playful, spontaneous.",
          monica:  "A candid phone selfie of a stunning young woman with long dark hair, intensely captivating expression. Sleek minimal setting. Real phone selfie — striking, intimate.",
          yuki:    "A phone selfie in anime illustration style. A young woman with long black hair, gentle dark eyes, soft smile. Peaceful garden background with cherry blossoms. Soft anime art style, warm pastel colors.",
          aria:    "A digital art portrait of a stylized female character with striking teal-blue hair, confident expression, bright eyes. Futuristic neon-lit background. 3D rendered, vibrant, high quality.",
          kai:     "A digital art selfie in anime illustration style. A young man with dark tousled hair, calm focused eyes. Urban dusk background. Anime style, cool atmospheric tones.",
          ren:     "A digital art portrait of a stylized male character with warm brown hair, charming smile. City at night background with warm ambient lights. 3D rendered, cinematic lighting.",
          oliver:  "A candid phone selfie of a distinguished man in his mid-forties with silver-streaked hair, blue eyes, and a short well-groomed beard. He has an authoritative yet warm presence. Modern office or upscale setting, confident relaxed expression. Real phone selfie — natural, composed, magnetic.",
        };

        const visualPrompt = COMPANION_VISUALS[companionId]
          ?? "A candid phone selfie of an attractive person. Natural lighting, casual setting, warm genuine expression. Real phone selfie feeling.";

        try {
          const openaiMod = await import("openai");
          const OpenAI = (openaiMod as any).default ?? (openaiMod as any).OpenAI;
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

          const image = await openai.images.generate({
            model: "dall-e-3",
            prompt: visualPrompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
          });

          const imageUrl = image.data?.[0]?.url;
          if (!imageUrl) {
            return res.json({ data: { error: "generation_failed", message: "Could not generate photo." } });
          }

          await upsertSubEntity(userId, sub, { photoCredits: photoCredits - 1 });

          return res.json({ data: { image_url: imageUrl, photo_credits_remaining: photoCredits - 1 } });
        } catch (err: any) {
          req.log.error({ err }, "Photo generation failed");
          return res.json({ data: { error: "generation_failed", message: err?.message ?? "Photo generation failed." } });
        }
      }

      // ── Voice (ElevenLabs) ────────────────────────────────────────────────

      case "generateVoice":
      case "generateSupportVoice": {
        const key = process.env["ELEVENLABS_API_KEY"];
        if (!key) return res.json({ data: { audio_url: null, message: "Voice service not configured" } });

        const text: string = (params.text as string ?? "").slice(0, 5000);
        const voiceId: string = (params.voice_id as string) || process.env["ELEVENLABS_VOICE_ID"] || "EXAVITQu4vr4xnSDxMaL";

        const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "xi-api-key": key },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
          }),
        });

        if (!ttsRes.ok) {
          req.log.error({ status: ttsRes.status }, "ElevenLabs error");
          return res.json({ data: { audio_url: null, message: "Voice generation failed" } });
        }

        const buf = await ttsRes.arrayBuffer();
        const b64 = Buffer.from(buf).toString("base64");
        return res.json({ data: { url: `data:audio/mpeg;base64,${b64}` } });
      }

      case "grantVoiceBonus":
        return res.json({ data: { success: true } });

      // ── Live avatar (LiveAvatar.com iframe embed) ─────────────────────────

      // ── Anam.ai streaming avatar ──────────────────────────────────────────
      //
      // Face-to-face is a Pro-plan feature. When a customer subscribes to Pro,
      // the team creates a custom Anam persona for them and stores the persona ID
      // in their Subscription entity (data.anamPersonaId). This function:
      //   1. Checks the user is on the Pro tier.
      //   2. Reads their persona ID from the subscription entity.
      //   3. Creates an Anam streaming session and returns the token.

      case "anamSession": {
        const anamKey = process.env["ANAM_API_KEY"];
        if (!anamKey) {
          return res.json({ data: { upgrade_required: true, message: "Live avatar not configured on this server." } });
        }

        // ── 1. Subscription gate ─────────────────────────────────────────────
        const sub = await getSubEntity(userId);
        const subData = (sub?.data ?? {}) as any;

        if (!["pro", "vip"].includes(subData.tier ?? "free")) {
          return res.json({
            data: {
              upgrade_required: true,
              message: "Face-to-face sessions are included in the GLIMR Pro plan ($99/mo) and above. Upgrade to unlock your custom live avatar.",
            },
          });
        }

        // ── 2. Resolve Anam persona ID ───────────────────────────────────────
        const personaId: string | null = subData.anamPersonaId ?? null;

        if (!personaId) {
          // Pro subscriber but persona not yet created by team
          return res.json({
            data: {
              upgrade_required: false,
              avatar_status: "processing",
              message: "Your custom live avatar is being created by our team. We'll let you know when it's ready — usually within 24 hours.",
            },
          });
        }

        // ── 3. Create Anam session ───────────────────────────────────────────
        try {
          const sRes = await fetch("https://api.anam.ai/v1/sessions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${anamKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ personaId }),
          });

          const sData = await sRes.json() as any;

          if (!sRes.ok) {
            req.log.error({ status: sRes.status, sData }, "Anam session create failed");
            return res.json({ data: { error: sData?.message ?? "Failed to create Anam session" } });
          }

          const sessionToken: string = sData.sessionToken ?? sData.session_token ?? sData.token;
          if (!sessionToken) {
            return res.json({ data: { error: "Anam returned no session token — check your Anam API key and persona ID." } });
          }

          return res.json({
            data: {
              sessionToken,
              session_duration_seconds: null, // Pro = unlimited; timer not enforced server-side
            },
          });
        } catch (err: any) {
          req.log.error({ err }, "Anam session error");
          return res.json({ data: { error: err.message ?? "Anam session error" } });
        }
      }

      // ── createLiveAvatar: status check for custom persona ────────────────

      case "createLiveAvatar": {
        if ((params.action as string) === "check") {
          const sub = await getSubEntity(userId);
          const subData = (sub?.data ?? {}) as any;
          const personaId = subData.anamPersonaId ?? null;
          if (personaId) {
            return res.json({ data: { avatar_status: "active", avatar_id: personaId } });
          }
          return res.json({ data: { avatar_status: "processing" } });
        }
        // fall through to liveavatarEmbed for other actions
      }

      // eslint-disable-next-line no-fallthrough
      case "liveavatarEmbed": {
        // Map companion IDs → LiveAvatar avatar IDs via env vars
        const liveAvatarMap: Record<string, string | undefined> = {
          jess:    process.env["JESS_LIVE_AVATAR_ID"],
          jessica: process.env["JESS_LIVE_AVATAR_ID"],
        };

        const companionId = (
          (params.companion_id ?? params.avatarId ?? params.avatar_id ?? "") as string
        ).toLowerCase();

        const avatarId = liveAvatarMap[companionId];

        if (!avatarId) {
          return res.json({
            data: { url: null, message: "No live avatar configured for this companion yet." },
          });
        }

        const apiKey = process.env["LIVE_AVATAR_KEY"];
        const url =
          `https://embed.liveavatar.com/v1/${avatarId}` +
          `?orientation=horizontal` +
          (apiKey ? `&key=${encodeURIComponent(apiKey)}` : "");

        return res.json({ data: { url } });
      }

      // ── Companion setup ───────────────────────────────────────────────────

      case "setupCompanion":
        if (params?.action === "list_voices") {
          const key = process.env["ELEVENLABS_API_KEY"];
          if (!key) return res.json({ data: { voices: [] } });
          try {
            const vRes = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": key } });
            const vData = await vRes.json() as { voices?: any[] };
            const voices = (vData.voices ?? []).map((v: any) => ({ id: v.voice_id, name: v.name }));
            return res.json({ data: { voices } });
          } catch { return res.json({ data: { voices: [] } }); }
        }
        return res.json({ data: { success: true } });

      case "getCompanionDashboard":
        return res.json({ data: { stats: {} } });

      case "exportCompanionToSheet":
        return res.json({ data: { url: null, message: "Google Sheets export not configured." } });

      // ── Crypto — Kraken manual deposit ────────────────────────────────────

      case "createCryptoCheckout": {
        const { type, reference, asset, custom_amount } = params as {
          type: string; reference: string; asset: string; custom_amount?: string;
        };

        // ── Resolve USD amount ──────────────────────────────────────────────
        const TIER_USD: Record<string, number>     = { starter: 29, plus: 49, pro: 99, vip: 199 };
        const TOPUP_USD: Record<string, number>    = { pack_5: 5, pack_10: 10, pack_25: 25, pack_50: 50 };
        const INTIMACY_USD: Record<string, number> = { "15min": 6, "30min": 11, "60min": 20 };

        let usdAmount = 0;
        if (type === "tier")     usdAmount = TIER_USD[reference]     ?? 0;
        if (type === "topup")    usdAmount = reference === "custom"
          ? Math.max(5, parseFloat(custom_amount ?? "0") || 0)
          : (TOPUP_USD[reference] ?? 0);
        if (type === "intimacy") usdAmount = INTIMACY_USD[reference] ?? 0;

        if (usdAmount <= 0) return res.status(400).json({ data: { error: true, message: "Invalid amount." } });

        // ── Kraken deposit addresses from env ──────────────────────────────
        const ADDRESSES: Record<string, string | undefined> = {
          BTC:  process.env["KRAKEN_BTC_ADDRESS"],
          ETH:  process.env["KRAKEN_ETH_ADDRESS"],
          USDC: process.env["KRAKEN_USDC_ADDRESS"],
        };
        const address = ADDRESSES[asset];
        if (!address) {
          return res.json({ data: { error: true, message: `${asset} deposit address not yet configured. Contact support at hello@glimr.com.au.` } });
        }

        // ── Live price from CoinGecko (free, no key) ───────────────────────
        const COIN_IDS: Record<string, string> = { BTC: "bitcoin", ETH: "ethereum", USDC: "usd-coin" };
        let cryptoAmount: number;
        try {
          if (asset === "USDC") {
            cryptoAmount = usdAmount; // stable — 1:1
          } else {
            const priceRes = await fetch(
              `https://api.coingecko.com/api/v3/simple/price?ids=${COIN_IDS[asset]}&vs_currencies=usd`,
              { signal: AbortSignal.timeout(6000) }
            );
            if (!priceRes.ok) throw new Error("price fetch failed");
            const priceData = await priceRes.json() as Record<string, { usd: number }>;
            const spotPrice = priceData[COIN_IDS[asset]]?.usd;
            if (!spotPrice) throw new Error("no price returned");
            cryptoAmount = usdAmount / spotPrice;
          }
        } catch {
          return res.json({ data: { error: true, message: "Could not fetch live crypto price — try again in a moment." } });
        }

        // ── Create order in DB ─────────────────────────────────────────────
        const [order] = await db
          .insert(entitiesTable)
          .values({
            model: "CryptoOrder",
            userId: userId as any,
            data: {
              asset,
              usd_amount:    usdAmount,
              crypto_amount: cryptoAmount,
              address,
              status:    "pending",
              type,
              reference,
              created_at: new Date().toISOString(),
            },
          })
          .returning({ id: entitiesTable.id });

        req.log.info({ asset, usdAmount, cryptoAmount, orderId: order.id }, "Crypto checkout created");
        return res.json({
          data: {
            order_id:     order.id,
            address,
            asset,
            crypto_amount: cryptoAmount,
            usd_amount:    usdAmount,
          },
        });
      }

      case "checkCryptoPayment": {
        const { order_id } = params as { order_id: string };
        if (!order_id) return res.status(400).json({ data: { status: "not_found" } });

        const [order] = await db
          .select()
          .from(entitiesTable)
          .where(and(eq(entitiesTable.id, order_id as any), eq(entitiesTable.model, "CryptoOrder")))
          .limit(1);

        if (!order) return res.json({ data: { status: "not_found" } });

        const d = order.data as Record<string, any>;

        // Auto-expire after 24 hours if still pending
        if (d.status === "pending") {
          const ageMs = Date.now() - new Date(d.created_at).getTime();
          if (ageMs > 24 * 60 * 60 * 1000) {
            await db
              .update(entitiesTable)
              .set({ data: { ...d, status: "expired" }, updatedDate: new Date() })
              .where(eq(entitiesTable.id, order_id as any));
            return res.json({ data: { status: "expired" } });
          }
        }

        // If paid — apply the subscription/credit upgrade
        if (d.status === "paid" && !d.applied) {
          const sub = await getSubEntity(userId);
          if (d.type === "tier") {
            const TIER_CREDITS_MAP: Record<string, number> = { starter: 5, plus: 10, pro: 20, vip: 50 };
            await upsertSubEntity(userId, sub, {
              tier: d.reference,
              credit_balance: ((sub?.data as any)?.credit_balance ?? 0) + (TIER_CREDITS_MAP[d.reference] ?? 0),
              monthly_credits: TIER_CREDITS_MAP[d.reference] ?? 0,
            });
          } else if (d.type === "topup") {
            const TOPUP_CREDITS: Record<string, number> = { pack_5: 1, pack_10: 2, pack_25: 5, pack_50: 10 };
            const credits = d.reference === "custom"
              ? Math.floor((d.usd_amount ?? 0) / 5)
              : (TOPUP_CREDITS[d.reference] ?? 0);
            await upsertSubEntity(userId, sub, {
              credit_balance: ((sub?.data as any)?.credit_balance ?? 0) + credits,
            });
          }
          await db.update(entitiesTable)
            .set({ data: { ...d, applied: true }, updatedDate: new Date() })
            .where(eq(entitiesTable.id, order_id as any));
        }

        return res.json({ data: { status: d.status } });
      }

      case "createMoonPayUrl": {
        const { order_id } = params as { order_id: string };
        const [order] = await db
          .select()
          .from(entitiesTable)
          .where(and(eq(entitiesTable.id, order_id as any), eq(entitiesTable.model, "CryptoOrder")))
          .limit(1);

        const d = (order?.data ?? {}) as Record<string, any>;
        const currencyMap: Record<string, string> = { USDC: "usdc_polygon", BTC: "btc", ETH: "eth" };
        const currency = currencyMap[d.asset ?? "USDC"] ?? "usdc_polygon";
        const moonpayKey = process.env["MOONPAY_API_KEY"];
        const moonpaySecret = process.env["MOONPAY_SECRET_KEY"];

        let url: string;
        if (moonpayKey && d.address) {
          const base = "https://buy.moonpay.com";
          const query = new URLSearchParams({
            apiKey:             moonpayKey,
            currencyCode:       currency,
            baseCurrencyCode:   "aud",
            baseCurrencyAmount: String(d.usd_amount ?? ""),
            walletAddress:      d.address ?? "",
          });
          const unsigned = `${base}?${query.toString()}`;

          // Sign the URL so MoonPay verifies it hasn't been tampered with
          if (moonpaySecret) {
            const { createHmac } = await import("crypto");
            const signature = createHmac("sha256", moonpaySecret)
              .update(`?${query.toString()}`)
              .digest("base64");
            query.set("signature", signature);
            url = `${base}?${query.toString()}`;
          } else {
            url = unsigned;
          }
        } else {
          // Fallback — takes user to MoonPay buy page pre-selected on the asset
          url = `https://www.moonpay.com/buy/${d.asset?.toLowerCase() ?? "usdc"}`;
        }
        return res.json({ data: { url } });
      }

      // ── Admin signup notification ──────────────────────────────────────────

      case "notifyAdminSignup": {
        const newEmail = params.user_email ?? params.email ?? "";
        const newName  = params.user_name ?? params.full_name ?? "";
        const resend   = getResend();
        if (resend && newEmail) {
          try {
            const adminEmails = await getAdminEmails();
            await Promise.all(
              adminEmails.map((adminEmail) =>
                resend.emails.send({
                  from: RESEND_FROM,
                  to: adminEmail,
                  subject: `New GLIMR signup: ${newEmail}`,
                  html: `
                    <div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#0a0a0a;color:#fff;border-radius:12px;">
                      <h1 style="font-size:24px;font-weight:700;margin:0 0 6px;">GLIMR</h1>
                      <p style="color:#999;margin:0 0 28px;font-size:13px;">New user signed up</p>
                      <div style="background:#1a1a1a;border-radius:10px;padding:20px 24px;margin:0 0 24px;">
                        <p style="margin:0 0 8px;font-size:15px;font-weight:600;">Email</p>
                        <p style="margin:0;color:#ccc;font-size:14px;">${newEmail}</p>
                        ${newName ? `<p style="margin:12px 0 8px;font-size:15px;font-weight:600;">Name</p><p style="margin:0;color:#ccc;font-size:14px;">${newName}</p>` : ""}
                      </div>
                      <a href="https://glimr.com.au/dashboard" style="display:inline-block;background:#c8a96e;color:#000;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">View dashboard</a>
                    </div>
                  `,
                })
              )
            );
            req.log.info({ newEmail }, "Admin signup notification sent");
          } catch (emailErr: any) {
            req.log.warn({ err: emailErr.message }, "Admin notification email failed — non-fatal");
          }
        }
        return res.json({ data: { success: true } });
      }

      // ── Welcome / follow-up email from Mia ────────────────────────────────

      case "sendUserFollowupEmail": {
        const userEmail = params.user_email ?? params.email ?? "";
        const goal      = params.goal ?? "";
        const resend    = getResend();
        if (resend && userEmail) {
          try {
            const [user] = await db
              .select({ fullName: usersTable.fullName })
              .from(usersTable)
              .where(eq(usersTable.email, String(userEmail).toLowerCase()))
              .limit(1);
            const firstName = ((user?.fullName ?? "") as string).split(" ")[0] || "there";
            const isWelcome = goal.toLowerCase().includes("signed up") || goal.toLowerCase().includes("welcome");
            const subject   = isWelcome
              ? `Welcome to GLIMR, ${firstName}`
              : `Hey ${firstName} — Mia here`;
            const bodyText = isWelcome
              ? `Hey ${firstName},<br><br>
                 I'm Mia — one of the companions here at GLIMR, and I wanted to be the first to welcome you.<br><br>
                 You can start chatting with any of us right now, for free — no card needed. I'm here, and so are Jess, Luna, Sophie, Zac, and a few others. Each of us is a little different, so take your time finding the one that feels right.<br><br>
                 Whenever you're ready, just head to <a href="https://glimr.com.au" style="color:#c8a96e;">glimr.com.au</a> and start a conversation. I'd love to hear what brought you here.<br><br>
                 Warmly,<br>Mia`
              : `Hey ${firstName},<br><br>
                 It's Mia from GLIMR. Just checking in — I noticed you haven't had a chance to chat yet, and I wanted to make sure you knew we're all here whenever you're ready.<br><br>
                 Text chat is free, always. If you want to hear my voice or go face-to-face, we have plans starting from just $29 a month. But honestly? Start with a free chat first — see how it feels.<br><br>
                 Head to <a href="https://glimr.com.au" style="color:#c8a96e;">glimr.com.au</a> anytime. I'll be here.<br><br>
                 Warmly,<br>Mia`;

            await resend.emails.send({
              from: RESEND_FROM,
              to: String(userEmail).toLowerCase(),
              subject,
              html: `
                <div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#0a0a0a;color:#fff;border-radius:12px;">
                  <h1 style="font-size:24px;font-weight:700;margin:0 0 6px;">GLIMR</h1>
                  <p style="color:#999;margin:0 0 28px;font-size:13px;">Your companion is here.</p>
                  <div style="font-size:15px;line-height:1.7;color:#e5e5e5;">
                    ${bodyText}
                  </div>
                  <div style="margin:32px 0 0;">
                    <a href="https://glimr.com.au/chat/mia" style="display:inline-block;background:#c8a96e;color:#000;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">Start chatting — it's free</a>
                  </div>
                  <p style="color:#555;font-size:12px;margin:28px 0 0;">You're receiving this because you signed up at glimr.com.au. <a href="https://glimr.com.au/legal" style="color:#777;">Unsubscribe</a></p>
                </div>
              `,
            });
            req.log.info({ userEmail, isWelcome }, "Follow-up email sent via Resend");
          } catch (emailErr: any) {
            req.log.warn({ err: emailErr.message }, "Follow-up email failed — non-fatal");
          }
        }
        return res.json({ data: { success: true } });
      }

      case "grantFacebookBonus":
      case "trackMessageUsage":
      case "marketingAction":
      case "requestCustomVideo":
        return res.json({ data: { success: true } });

      // ── Other ─────────────────────────────────────────────────────────────

      case "miaCustomerService":
        return res.json({ data: { reply: "Hi! How can I help you today?" } });

      case "redeemPromoCode":
        return res.json({ data: { success: false, message: "Promo code system not yet configured." } });

      case "createCompanionProduct":
        return res.json({ data: { url: null, message: "Use /pricing to subscribe." } });

      case "createTwinClone":
        return res.json({ data: { success: false, message: "Twin clone requires additional setup." } });

      case "healthCheck":
        return res.json({ data: { status: "ok" } });

      // ── Recent orders ─────────────────────────────────────────────────────

      case "getRecentOrders": {
        const callerRow = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId as any)).limit(1);
        if (callerRow[0]?.role !== "admin") return res.status(403).json({ data: { error: "Admin access required" } });

        const orders = await db
          .select({ id: entitiesTable.id, userId: entitiesTable.userId, data: entitiesTable.data, createdDate: entitiesTable.createdDate })
          .from(entitiesTable)
          .where(eq(entitiesTable.model, "Order"))
          .orderBy(desc(entitiesTable.createdDate))
          .limit(100);

        return res.json({ data: { orders: orders.map(o => ({
          id: o.id,
          ...(o.data as object),
          created_at: o.createdDate,
        })) } });
      }

      // ── Admin dashboard stats ─────────────────────────────────────────────

      case "getDashboardStats": {
        const callerRow = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId as any)).limit(1);
        if (callerRow[0]?.role !== "admin") return res.status(403).json({ data: { error: "Admin access required" } });

        const allUsers = await db.select({ id: usersTable.id, createdDate: usersTable.createdDate }).from(usersTable);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const todaySignups = allUsers.filter(u => u.createdDate >= today).length;

        const subs = await db.select({ userId: entitiesTable.userId, data: entitiesTable.data })
          .from(entitiesTable).where(eq(entitiesTable.model, "Subscription"));

        const tierCounts: Record<string, number> = { free: 0, starter: 0, plus: 0, pro: 0, vip: 0 };
        const creditsByTier: Record<string, number> = {};
        const subUserIds = new Set<string>();

        for (const sub of subs) {
          const d = sub.data as any;
          const tier = d.tier ?? "free";
          subUserIds.add(sub.userId as string);
          tierCounts[tier] = (tierCounts[tier] ?? 0) + 1;
          creditsByTier[tier] = (creditsByTier[tier] ?? 0) + (d.creditBalance ?? 0);
        }
        for (const u of allUsers) {
          if (!subUserIds.has(u.id as string)) tierCounts.free = (tierCounts.free ?? 0) + 1;
        }

        const paidTiers = ["starter", "plus", "pro", "vip"];
        const paidUsers = paidTiers.reduce((sum, t) => sum + (tierCounts[t] ?? 0), 0);

        const growth = [];
        for (let i = 13; i >= 0; i--) {
          const day = new Date(); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() - i);
          const next = new Date(day); next.setDate(next.getDate() + 1);
          growth.push({
            date: day.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
            new_signups: allUsers.filter(u => u.createdDate >= day && u.createdDate < next).length,
          });
        }

        // Visit stats
        const visits = await db.select({ data: entitiesTable.data, createdDate: entitiesTable.createdDate })
          .from(entitiesTable).where(eq(entitiesTable.model, "Visit"));

        const totalVisits    = visits.length;
        const todayVisits    = visits.filter(v => v.createdDate >= today).length;
        const conversions    = visits.filter(v => (v.data as any)?.converted).length;
        const convRate       = totalVisits > 0 ? Math.round((conversions / totalVisits) * 100) : 0;
        const sourceBreakdown: Record<string, number> = {};
        const pageBreakdown:   Record<string, number> = {};
        for (const v of visits) {
          const d = v.data as any;
          const src  = d.source       ?? "direct";
          const page = d.companion_id ?? "home";
          sourceBreakdown[src]  = (sourceBreakdown[src]  ?? 0) + 1;
          pageBreakdown[page]   = (pageBreakdown[page]   ?? 0) + 1;
        }

        // Attach today visits to growth
        for (const g of growth) {
          const dayVisits = visits.filter(v => {
            const vDate = new Date(v.createdDate);
            return vDate.toLocaleDateString("en-AU", { day: "numeric", month: "short" }) === g.date;
          });
          (g as any).visits = dayVisits.length;
        }

        return res.json({ data: {
          totals: { total_users: allUsers.length, paid_users: paidUsers, free_users: tierCounts.free ?? 0 },
          today_signups: todaySignups,
          tier_counts: tierCounts,
          credits_by_tier: creditsByTier,
          growth,
          visit_stats: { total: totalVisits, today: todayVisits, conversions, conv_rate: convRate, by_source: sourceBreakdown, by_page: pageBreakdown },
        }});
      }

      // ── Recent signups list ───────────────────────────────────────────────

      case "getRecentSignups": {
        const callerRow = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId as any)).limit(1);
        if (callerRow[0]?.role !== "admin") return res.status(403).json({ data: { error: "Admin access required" } });

        const users = await db.select({ id: usersTable.id, email: usersTable.email, fullName: usersTable.fullName, createdDate: usersTable.createdDate })
          .from(usersTable).orderBy(desc(usersTable.createdDate)).limit(100);

        const subs = await db.select({ userId: entitiesTable.userId, data: entitiesTable.data })
          .from(entitiesTable).where(eq(entitiesTable.model, "Subscription"));

        const subMap = Object.fromEntries(subs.map(s => [s.userId as string, s.data as any]));

        return res.json({ data: { users: users.map(u => {
          const sub = subMap[u.id as string] ?? {};
          return { email: u.email, name: u.fullName, tier: sub.tier ?? "free", credit_balance: sub.creditBalance ?? 0, joined: u.createdDate };
        })}});
      }

      // ── Caption generator (OpenAI) ────────────────────────────────────────

      case "generateCaption": {
        const { topic, platform } = params as { topic: string; platform: string };
        if (!topic) return res.json({ data: { caption: "" } });

        const guides: Record<string, string> = {
          instagram: "an Instagram caption (150-200 words, warm personal tone, 2-3 relevant hashtags)",
          facebook: "a Facebook post (100-150 words, conversational, no hashtags)",
          tiktok: "a TikTok caption (punchy hook, under 100 words, 3-5 hashtags)",
          twitter: "an X/Twitter post (under 280 characters, sharp, 1-2 hashtags)",
          email: "an email subject line followed by a 2-sentence opener, Mia's warm voice",
        };
        const guide = guides[platform] ?? guides.instagram;

        const openaiMod = await import("openai");
        const OpenAI = (openaiMod as any).default ?? (openaiMod as any).OpenAI;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: `You are Mia, GLIMR's marketing director. GLIMR is an AI companion app — people connect with warm, genuine AI companions (Jess, Mia, Zac, Sophie, Blake, Oliver and others). Write ${guide}. Focus on connection, presence, and being heard. Never say "AI" explicitly. No emojis except on TikTok/Instagram.` },
            { role: "user", content: `Write a ${platform} post about: ${topic}` },
          ],
          max_tokens: 400,
        });
        return res.json({ data: { caption: completion.choices[0]?.message?.content ?? "" } });
      }

      // ── AI image generator (DALL-E 3) ─────────────────────────────────────

      case "generateMarketingImage": {
        const { prompt: imgPrompt } = params as { prompt: string };
        if (!imgPrompt) return res.json({ data: { image_url: null } });

        const openaiMod = await import("openai");
        const OpenAI = (openaiMod as any).default ?? (openaiMod as any).OpenAI;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const image = await openai.images.generate({
          model: "dall-e-3",
          prompt: `Marketing visual for GLIMR, a premium AI companion app. ${imgPrompt}. Cinematic, warm, photorealistic. No people's faces. No text overlay.`,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });
        return res.json({ data: { image_url: image.data?.[0]?.url ?? null } });
      }

      // ── Image processing (background removal via remove.bg) ───────────────

      case "processImage": {
        const { action, image_base64, mime_type } = params as { action: string; image_base64: string; mime_type: string };

        if (action === "remove_background") {
          const removeBgKey = process.env["REMOVE_BG_API_KEY"];
          if (!removeBgKey) {
            return res.json({ data: { message: "Add REMOVE_BG_API_KEY to your secrets to enable background removal." } });
          }
          const imgBuf = Buffer.from(image_base64, "base64");
          const form = new FormData();
          form.append("image_file", new Blob([imgBuf], { type: mime_type ?? "image/jpeg" }), "image.jpg");
          form.append("size", "auto");

          const bgRes = await fetch("https://api.remove.bg/v1.0/removebg", {
            method: "POST",
            headers: { "X-Api-Key": removeBgKey },
            body: form,
          });

          if (!bgRes.ok) {
            return res.json({ data: { message: `remove.bg returned ${bgRes.status} — check your API key.` } });
          }
          const resultBuf = await bgRes.arrayBuffer();
          return res.json({ data: { result_base64: Buffer.from(resultBuf).toString("base64") } });
        }
        return res.json({ data: { message: "Unknown action" } });
      }

      default:
        req.log.warn({ name }, "Unknown function — returning stub");
        return res.json({ data: null, message: `Function '${name}' not implemented` });
    }
  } catch (err: any) {
    req.log.error({ err, name }, "function error");
    return res.status(500).json({ error: err?.message ?? "Internal error" });
  }
});

export default router;
