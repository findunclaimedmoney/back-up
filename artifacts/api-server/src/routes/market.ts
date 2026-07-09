import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface MarketKeyStat {
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
}

interface MarketBrief {
  generatedAt: string;
  headline: string;
  snapshot: string;
  keyStats: MarketKeyStat[];
  talkingPoints: string[];
  outlook: string;
  hotMarkets: string[];
}

let cachedBrief: MarketBrief | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 4 * 60 * 60 * 1000;

let cachedMiaBrief: { content: string; date: string } | null = null;

async function generateBrief(force = false): Promise<MarketBrief> {
  const now = Date.now();
  if (!force && cachedBrief && now < cacheExpiry) return cachedBrief;

  const today = new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1200,
    messages: [
      {
        role: "user",
        content: `Today is ${today}. You are a senior Australian property market analyst. Generate a concise, data-rich residential property market brief for real estate agents.

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "generatedAt": "${new Date().toISOString()}",
  "headline": "One punchy, specific headline sentence about the current AU market (include a specific stat or number)",
  "snapshot": "2-3 sentence market overview an agent can read in 30 seconds. Be specific — mention actual conditions, buyer demand, supply constraints, and rate environment.",
  "keyStats": [
    {"label": "National clearance rate", "value": "XX%", "trend": "up"},
    {"label": "RBA cash rate", "value": "X.XX%", "trend": "neutral"},
    {"label": "Median days on market", "value": "XX days", "trend": "down"},
    {"label": "Annual price growth", "value": "+X.X%", "trend": "up"}
  ],
  "talkingPoints": [
    "First talking point agents can use verbatim with vendors — specific market condition creating urgency",
    "Second talking point — buyer demand or competition angle",
    "Third talking point — timing or opportunity angle for sellers"
  ],
  "outlook": "One forward-looking sentence for the next 60-90 days that helps agents position the market confidently.",
  "hotMarkets": ["Suburb, STATE", "Suburb, STATE", "Suburb, STATE", "Suburb, STATE", "Suburb, STATE"]
}

Use your most current knowledge of Australian property market conditions. Make all values realistic and specific to the Australian market. Return ONLY valid JSON.`,
      },
    ],
  });

  const rawText =
    response.content[0].type === "text" ? response.content[0].text.trim() : "{}";

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in Claude response");

  const brief: MarketBrief = JSON.parse(jsonMatch[0]);
  cachedBrief = brief;
  cacheExpiry = now + CACHE_TTL_MS;
  return brief;
}

router.get("/market/brief", async (req, res) => {
  try {
    const brief = await generateBrief();
    res.json(brief);
  } catch (err) {
    req.log.error({ err }, "Failed to generate market brief");
    res.status(500).json({ error: "Failed to generate market brief" });
  }
});

router.post("/market/brief/refresh", async (req, res) => {
  try {
    const brief = await generateBrief(true);
    res.json(brief);
  } catch (err) {
    req.log.error({ err }, "Failed to refresh market brief");
    res.status(500).json({ error: "Failed to refresh market brief" });
  }
});

export default router;
