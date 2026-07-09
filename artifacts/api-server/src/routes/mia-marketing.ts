import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { logger } from "../lib/logger";

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface MarketingPack {
  instagram: { caption: string; hashtags: string[] };
  facebook: { post: string };
  linkedin: { post: string };
  email: { subject: string; body: string };
  schedule: { platform: string; time: string; note: string }[];
}

// POST /mia/marketing-pack
router.post("/mia/marketing-pack", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { listingUrl, listingTitle, suburb, propertyType, bedrooms, price, agentName, agentPhone } =
    req.body as {
      listingUrl?: string;
      listingTitle?: string;
      suburb?: string;
      propertyType?: string;
      bedrooms?: string | number;
      price?: string;
      agentName?: string;
      agentPhone?: string;
    };

  if (!listingUrl && !listingTitle) {
    res.status(400).json({ error: "Provide listingUrl or listingTitle" });
    return;
  }

  const contextLines: string[] = [];
  if (listingTitle)   contextLines.push(`Title: ${listingTitle}`);
  if (listingUrl)     contextLines.push(`URL: ${listingUrl}`);
  if (suburb)         contextLines.push(`Suburb: ${suburb}`);
  if (propertyType)   contextLines.push(`Property type: ${propertyType}`);
  if (bedrooms)       contextLines.push(`Bedrooms: ${bedrooms}`);
  if (price)          contextLines.push(`Price guide: ${price}`);
  if (agentName)      contextLines.push(`Agent name: ${agentName}`);
  if (agentPhone)     contextLines.push(`Agent phone: ${agentPhone}`);

  const prompt = `You are Mia, LensFlow AI's marketing advisor PA. Generate a complete, publication-ready social media and email marketing pack for this Australian real estate listing. Write as if you are the listing agent — confident, warm, and professional.

PROPERTY DETAILS:
${contextLines.join("\n")}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "instagram": {
    "caption": "Full Instagram caption. Start with a hook line (no hashtags in the caption body — keep the copy clean). Max 2200 chars. End with a CTA like 'Link in bio to enquire'.",
    "hashtags": ["array", "of", "15", "relevant", "hashtags", "without", "the", "hash", "symbol"]
  },
  "facebook": {
    "post": "Facebook post. More conversational and story-driven than Instagram. 200-350 words. Include the listing URL at the end if provided. Use line breaks for readability."
  },
  "linkedin": {
    "post": "LinkedIn post. Professional tone. Lead with a market insight or data point about the suburb/property type. 150-250 words. Position the agent as a local expert."
  },
  "email": {
    "subject": "Email subject line. Compelling but not spammy. Max 60 chars.",
    "body": "Email body to agent's buyer/vendor database. Personal, conversational. 150-250 words. Include a clear CTA (call or email to book inspection). Sign off with the agent name if provided, otherwise 'The Team'."
  },
  "schedule": [
    { "platform": "Instagram", "time": "Today · 7:00 am", "note": "Morning commute scroll — highest reach" },
    { "platform": "Facebook", "time": "Today · 12:00 pm", "note": "Lunch break browsing peak" },
    { "platform": "LinkedIn", "time": "Today · 8:30 am", "note": "Business hours — investor and referral audience" },
    { "platform": "Email", "time": "Today · 9:00 am", "note": "First thing — high open rate window" },
    { "platform": "Instagram Story", "time": "Today · 5:30 pm", "note": "Evening peak — swipe-up to listing" }
  ]
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.error({ raw }, "Mia marketing pack — no JSON in response");
      res.status(500).json({ error: "Failed to generate marketing pack" });
      return;
    }

    const pack = JSON.parse(jsonMatch[0]) as MarketingPack;
    logger.info({ listingUrl, suburb }, "Mia marketing pack generated");
    res.json(pack);
  } catch (err) {
    logger.error({ err }, "Mia marketing pack generation failed");
    res.status(500).json({ error: "Failed to generate marketing pack" });
  }
});

export default router;
