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
            metadata: { userId, tier: params.tier as string },
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

      // ── Crypto (stub) ─────────────────────────────────────────────────────

      case "createCryptoCheckout":
      case "checkCryptoPayment":
      case "createMoonPayUrl":
        return res.json({ data: { url: null, message: "Crypto payments not configured." } });

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

      // ── Marketing (no-op) ─────────────────────────────────────────────────

      case "convertVisit":
      case "grantFacebookBonus":
      case "trackMessageUsage":
      case "marketingAction":
      case "trackVisit":
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
