import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// Function routes require authentication
router.use(requireAuth);

// POST /api/functions/:name
router.post("/:name", async (req, res) => {
  const { name } = req.params;
  const session = req.session as any;
  const params = req.body || {};
  req.log.info({ name }, "functions invoke");

  switch (name) {
    // Subscription / billing
    case "getSubscription":
      return res.json({ data: { tier: "free", status: "active", credits: 100, plan: "free" } });

    case "manageBilling":
    case "createCheckout":
    case "createCompanionProduct":
      return res.json({ data: { url: null, message: "Billing not yet configured on Replit. Connect Stripe via the integrations panel." } });

    case "confirmSubscription":
      return res.json({ data: { success: true, tier: "free" } });

    // Account management
    case "deleteAccount":
      await db.delete(usersTable).where(eq(usersTable.id, session.userId));
      req.session.destroy(() => {});
      return res.json({ success: true });

    // Crypto payments
    case "createCryptoCheckout":
    case "checkCryptoPayment":
    case "createMoonPayUrl":
      return res.json({ data: { url: null, message: "Crypto payments not yet configured." } });

    // Voice / audio
    case "generateVoice":
    case "generateSupportVoice":
      return res.json({ data: { audio_url: null, message: "Voice generation requires ElevenLabs API key configuration." } });

    case "grantVoiceBonus":
      return res.json({ data: { success: true } });

    // Live avatar (HeyGen / Anam)
    case "anamSession":
    case "liveavatarEmbed":
    case "createLiveAvatar":
      return res.json({ data: { url: null, message: "Live avatar requires HeyGen/Anam API key configuration." } });

    // Companion setup
    case "setupCompanion":
      if (params?.action === "list_voices") {
        return res.json({ data: { voices: [] } });
      }
      return res.json({ data: { success: true } });

    case "getCompanionDashboard":
      return res.json({ data: { stats: {} } });

    case "exportCompanionToSheet":
      return res.json({ data: { url: null, message: "Google Sheets export not configured." } });

    // Marketing
    case "convertVisit":
    case "grantFacebookBonus":
    case "notifyAdminSignup":
    case "sendUserFollowupEmail":
    case "trackMessageUsage":
    case "marketingAction":
      return res.json({ data: { success: true } });

    case "requestCustomVideo":
      return res.json({ data: { success: true, message: "Request received." } });

    // AI/customer service
    case "miaCustomerService":
      return res.json({ data: { reply: "Customer service AI not yet configured." } });

    // Promo codes
    case "redeemPromoCode":
      return res.json({ data: { success: false, message: "Promo code system not yet configured." } });

    // Twin clone
    case "createTwinClone":
      return res.json({ data: { success: false, message: "Twin clone feature requires additional configuration." } });

    // Health check
    case "healthCheck":
      return res.json({ data: { status: "ok" } });

    default:
      req.log.warn({ name }, "Unknown function invoked — returning stub");
      return res.json({ data: null, message: `Function '${name}' not yet implemented` });
  }
});

export default router;
