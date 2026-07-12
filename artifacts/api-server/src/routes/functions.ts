import { Router } from "express";
import { db, usersTable, entitiesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();
router.use(requireAuth);

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_PRICES: Record<string, { name: string; amountCents: number; credits: number }> = {
  plus: { name: "GLIMR Plus",  amountCents: 5900, credits: 12 },
  pro:  { name: "GLIMR Pro",   amountCents: 9900, credits: 20 },
};

const TOPUP_PRICES: Record<string, { name: string; amountCents: number; credits: number }> = {
  pack_5:  { name: "1 credit",   amountCents: 500,  credits: 1 },
  pack_10: { name: "2 credits",  amountCents: 1000, credits: 2 },
  pack_25: { name: "5 credits",  amountCents: 2500, credits: 5 },
  pack_50: { name: "10 credits", amountCents: 5000, credits: 10 },
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
        return res.json({
          data: {
            tier:                        d.tier                   ?? "free",
            status:                      d.status                 ?? "active",
            credit_balance:              d.creditBalance          ?? 0,
            monthly_credits:             d.monthlyCredits         ?? 0,
            credits_used:                d.creditsUsed            ?? 0,
            video_minutes_used:          d.videoMinutesUsed       ?? 0,
            intimacy_package:            d.intimacyPackage        ?? false,
            twin_enabled:                d.twinEnabled            ?? false,
            intimacy_sessions_completed: d.intimacySessions       ?? 0,
            plan:                        d.tier                   ?? "free",
            credits:                     d.monthlyCredits         ?? 0,
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

        // Top-up / add-on
        const packId = (params.duration ?? params.pack_id) as string;
        const pack = TOPUP_PRICES[packId];
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
          metadata: { userId, addon: (params.addon ?? "topup") as string, packId, credits: String(pack.credits) },
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

        if (meta.credits) {
          const addCredits = parseInt(meta.credits, 10);
          const currentBalance = (existing?.data as any)?.creditBalance ?? 0;
          const updated = await upsertSubEntity(userId, existing, {
            creditBalance: currentBalance + addCredits,
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

      // ── Live avatar / HeyGen ─────────────────────────────────────────────

      case "anamSession":
      case "liveavatarEmbed":
      case "createLiveAvatar":
        // These are now handled by /api/heygen/* proxy routes.
        // Return a signal to the frontend to use the new WebRTC flow.
        return res.json({ data: { useWebRTC: true, message: "Use /api/heygen/* for live avatar" } });

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

      // ── Marketing (no-op) ─────────────────────────────────────────────────

      case "convertVisit":
      case "grantFacebookBonus":
      case "notifyAdminSignup":
      case "sendUserFollowupEmail":
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
