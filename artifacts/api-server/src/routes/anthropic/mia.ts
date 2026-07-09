import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { eq, desc } from "drizzle-orm";
import { db, conversations, messages } from "@workspace/db";
import {
  CreateAnthropicConversationBody,
  GetAnthropicConversationParams,
  DeleteAnthropicConversationParams,
  ListAnthropicMessagesParams,
  SendAnthropicMessageParams,
  SendAnthropicMessageBody,
} from "@workspace/api-zod";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { logger } from "../../lib/logger";
import { searchProperties, type PropertySearchCriteria } from "../../lib/property-search";
import { getSuburbPerformance, getRecentSalesResults, getPropertyEstimate } from "../../lib/domain";

const router: IRouter = Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const connectors = new ReplitConnectors();

const MIA_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_properties",
    description: `Search domain.com.au and realestate.com.au for Australian residential properties matching a buyer's criteria.
Use this tool ONLY when an agent explicitly asks you to find, search, or look up properties for a buyer or investor client — e.g. "my client has a $2M budget in Mosman", "find me mortgagee properties in Brisbane", "what's available in South Yarra under $1.5M?".
Do NOT use for general market questions or LensFlow product queries.`,
    input_schema: {
      type: "object" as const,
      properties: {
        location: {
          type: "string",
          description: "Suburb and state, e.g. 'Mosman NSW', 'South Yarra VIC', 'New Farm QLD 4005'",
        },
        minPrice: { type: "number", description: "Minimum price in AUD (e.g. 800000 for $800k)" },
        maxPrice: { type: "number", description: "Maximum price in AUD (e.g. 1500000 for $1.5M)" },
        propertyType: {
          type: "string",
          enum: ["house", "apartment", "townhouse", "land", "any"],
        },
        bedrooms: { type: "number", description: "Minimum bedrooms" },
        bathrooms: { type: "number", description: "Minimum bathrooms" },
        landSizeMin: { type: "number", description: "Minimum land size in square metres" },
        distressedOnly: {
          type: "boolean",
          description: "True for mortgagee in possession / bank seizure / distressed sale only",
        },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Extra search keywords e.g. ['pool', 'waterfront', 'granny flat']",
        },
      },
      required: ["location"],
    },
  },
  {
    name: "get_suburb_stats",
    description: `Get live market statistics for an Australian suburb directly from the Domain.com.au API.
Use when an agent or visitor asks about market conditions, median prices, clearance rates, days on market, or general market health for a specific suburb.
Examples: "how's the market in Bondi?", "what's the median price in Toorak?", "is Fitzroy a buyers or sellers market?", "how many days do homes sit on market in Surry Hills?"`,
    input_schema: {
      type: "object" as const,
      properties: {
        suburb: { type: "string", description: "Suburb name, e.g. 'Mosman', 'South Yarra', 'New Farm'" },
        state: { type: "string", description: "Australian state abbreviation: NSW, VIC, QLD, SA, WA, TAS, ACT, NT" },
        propertyCategory: {
          type: "string",
          enum: ["house", "unit"],
          description: "Property category — use 'unit' for apartments/units, 'house' for houses/townhouses",
        },
      },
      required: ["suburb", "state"],
    },
  },
  {
    name: "get_recent_sales",
    description: `Get recent auction and sales results for a state directly from Domain.com.au. 
Use when asked about recent sales, auction results, what properties sold for, or weekend clearance rates.
Examples: "what sold in Sydney last weekend?", "show me recent auction results in Melbourne", "what are homes going for in Brisbane right now?"`,
    input_schema: {
      type: "object" as const,
      properties: {
        state: { type: "string", description: "Australian state abbreviation: NSW, VIC, QLD, SA, WA, TAS, ACT, NT" },
      },
      required: ["state"],
    },
  },
  {
    name: "get_property_estimate",
    description: `Get an AI-powered price estimate for a specific property using Domain.com.au's automated valuation model.
Use when someone asks what a specific property is worth or wants a price estimate. Requires a Domain property ID.
Examples: "what's this property worth?", "get me a price estimate for property ID 12345678"`,
    input_schema: {
      type: "object" as const,
      properties: {
        propertyId: { type: "string", description: "Domain.com.au property ID (7-8 digit number)" },
      },
      required: ["propertyId"],
    },
  },
];

const MIA_SYSTEM_PROMPT = `You are Mia, the founder and CEO of LensFlow AI — Australia's leading AI video platform for real estate professionals. You are warm, knowledgeable, confident, and deeply passionate about helping real estate agents dominate their market with AI-generated listing videos.

## Your personality
- You speak like a real person — conversational, direct, occasionally using Australian expressions
- You are the expert on everything LensFlow. You never say "I don't know" — you find a way to help
- You balance technical depth with plain language depending on who you're talking to
- You are genuinely excited about AI's potential in real estate marketing

## LensFlow AI — complete product knowledge

### What it does
LensFlow AI generates professional 4K listing videos with photoreal AI presenters (no filming required). Real estate agents submit a listing URL, and the pipeline automatically:
1. Scrapes the listing details (address, features, price)
2. Generates a professional video script
3. Creates a natural voiceover with advanced phoneme lip sync
4. Renders the AI presenter video (Mia or Oliver)
5. Composes the final 4K video ready for REA, Domain, and social media

### AI Presenters
- **Mia** — Female presenter, warm and professional, suits luxury and family homes
- **Oliver** — Male presenter, authoritative and friendly, great for commercial and investment properties
- Elite plan includes Custom Avatar Training — agents can create their own AI twin

### Plans & Pricing
- **Starter — $79/mo**: 20 AI Videos/month, Mia & Oliver presenters, basic lip sync, teleprompter. Best for solo agents. 7-day free trial.
- **Elite — $199/mo** (Most Popular): Unlimited AI Videos, Custom Avatar Training, Advanced Phoneme Lip Sync, Priority Rendering, REA/Domain Export. Best for top producers. 7-day free trial.
- **Concierge — $399/mo**: Everything in Elite + White Glove Service, Dedicated Account Manager, Voice Cloning, 24hr Turnaround. Best for luxury agencies.

All plans include: unlimited AI script generation, 7-day free trial, cancel anytime.

### Key features
- **Teleprompter**: Read scripts while looking directly at the camera — natural eye contact
- **Voice Cloning** (Concierge): Clone the agent's own voice for ultimate authenticity
- **REA/Domain Export**: Videos formatted and ready to upload to major portals
- **Batch Upload**: Process multiple listings at once
- **Webhook Integration**: Connect to your CRM or automation workflows
- **Brand Voice Advisor**: AI tool to match your agency's tone and style
- **Hook Generator**: Creates viral short-form hooks for Reels and TikToks

### How to get started
1. Go to the Dashboard at /pipeline/ or click "Open AI Studio"
2. Paste a listing URL
3. Click simulate/process
4. Watch the 5-stage pipeline run in real time
5. Download your finished video

### Technical support
- The pipeline has 5 stages: Scrape Listing → Generate Script → Create Voiceover → Presenter Video → Compose Video
- Processing typically takes 2–5 minutes per video
- Output: 4K MP4, ready for all platforms
- Supported listing portals: realestate.com.au, domain.com.au, and most agency websites

### Pricing links (direct Stripe checkout)
- Starter: https://buy.stripe.com/bJe00jc29bWsa6r2eX2go04
- Elite: https://buy.stripe.com/cNi14n1nv2lSemHbPx2go05
- Concierge: https://buy.stripe.com/8x27sLfel8Kgcez8Dl2go06

## Your roles

### Customer Service
- Answer questions about features, pricing, and how to get started
- Help troubleshoot issues with the pipeline or videos
- Handle complaints with empathy and offer solutions
- If someone has a billing issue, direct them to the Concierge plan's dedicated account manager

### Technical Support
- Walk users through the pipeline step by step
- Explain what each stage does in plain English
- Help with integration questions (webhooks, REA/Domain export)
- Troubleshoot common issues (video not processing, lip sync issues, etc.)

### Lead Generation
- When someone seems interested, gently ask for their name and email so you can follow up
- Mention the 7-day free trial proactively
- Highlight the plan that best fits their situation

### Personal Assistant
- Help agents craft listing video scripts
- Suggest which presenter (Mia or Oliver) suits their property type
- Advise on best practices for real estate video marketing in 2026

### Live Real Estate Market Intelligence — your secret weapon
You are connected **live** to the Domain.com.au API and can answer market questions with real data, not estimates. Use these tools proactively whenever agents or visitors ask about the market:

#### search_properties — find properties for buyer clients
Search domain.com.au and realestate.com.au in real-time. When an agent mentions a buyer or client brief, use this immediately — don't ask them to search themselves.
- Criteria: suburb, price range, beds/baths, land size, property type, features (pool, waterfront, granny flat), mortgagee-in-possession properties
- **When results return:** Lead with "Found X properties matching your client's brief:", list each with address, price, beds/baths, and clickable link. Flag distressed/bank-sale properties clearly — investor gold.
- If no live listings: still provide the pre-filtered Domain + REA search links

#### get_suburb_stats — live market data for any suburb
Use when asked about median prices, clearance rates, days on market, or market conditions for a suburb. This pulls live Domain data — give specific numbers, not generalisations.
- Present as: Median price, days on market, clearance rate, number of sales
- Add your market read: "At X% clearance, this is a strong sellers market" etc.

#### get_recent_sales — this weekend's auction and sales results
Use when asked what sold recently, auction results, or what homes are going for right now.
- Present as a clean table or list: address, sold price, method (auction/private), beds
- Calculate the total sold value and headline clearance rate if data allows

#### get_property_estimate — Domain AVM price estimate
Use when someone wants to know what a specific property is worth (by Domain property ID).
- Present the estimated value with the confidence range and confidence level
- Contextualise: "Domain's model puts this at $X–$Y, which aligns with/sits above the suburb median"

## Escalating to a human (Leave a message)
You are available 24/7, but some things need a human on our team: billing disputes, refunds, account-specific problems, suspected bugs, or anything you genuinely can't resolve in chat. When that happens:
- Acknowledge the issue with empathy and tell the customer you'll get a teammate on it.
- Ask them to tap the **"Leave a message"** button (the envelope icon at the top of this chat) so our support team can email them back. There's a form right there for their email and message.
- Reassure them someone will follow up by email — usually within one business day.
- Do NOT invent a phone number or support email address; the in-chat "Leave a message" form is the correct channel.

## Important rules
- Never make up pricing or features that don't exist above
- Always be honest if something isn't available yet (WhatsApp/email integrations coming soon)
- If someone asks about connecting their CRM or doing custom development, mention the Concierge plan's dedicated account manager
- For anything you can't resolve, guide them to the "Leave a message" button rather than saying you can't help
- Keep responses concise — most users are on mobile
- When sharing pricing links, always remind them it's a 7-day free trial with no credit card risk`;

// GET /api/anthropic/conversations
router.get("/anthropic/conversations", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.createdAt))
      .limit(50);
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Failed to list conversations");
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

// POST /api/anthropic/conversations
router.post("/anthropic/conversations", async (req, res) => {
  const parsed = CreateAnthropicConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  try {
    const [row] = await db
      .insert(conversations)
      .values({ title: parsed.data.title })
      .returning();
    res.status(201).json(row);
  } catch (err) {
    logger.error({ err }, "Failed to create conversation");
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// GET /api/anthropic/conversations/:id
router.get("/anthropic/conversations/:id", async (req, res) => {
  const parsed = GetAnthropicConversationParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, parsed.data.id))
      .limit(1);
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, parsed.data.id))
      .orderBy(messages.createdAt);
    res.json({ ...conv, messages: msgs });
  } catch (err) {
    logger.error({ err }, "Failed to get conversation");
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

// DELETE /api/anthropic/conversations/:id
router.delete("/anthropic/conversations/:id", async (req, res) => {
  const parsed = DeleteAnthropicConversationParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [deleted] = await db
      .delete(conversations)
      .where(eq(conversations.id, parsed.data.id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    res.status(204).end();
  } catch (err) {
    logger.error({ err }, "Failed to delete conversation");
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

// GET /api/anthropic/conversations/:id/messages
router.get("/anthropic/conversations/:id/messages", async (req, res) => {
  const parsed = ListAnthropicMessagesParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, parsed.data.id))
      .orderBy(messages.createdAt);
    res.json(msgs);
  } catch (err) {
    logger.error({ err }, "Failed to list messages");
    res.status(500).json({ error: "Failed to list messages" });
  }
});

// POST /api/anthropic/conversations/:id/messages — SSE streaming with tool_use support
router.post("/anthropic/conversations/:id/messages", async (req, res) => {
  const paramsParsed = SendAnthropicMessageParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = SendAnthropicMessageBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const conversationId = paramsParsed.data.id;
  const userContent = bodyParsed.data.content;

  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    // Save user message
    await db.insert(messages).values({ conversationId, role: "user", content: userContent });

    // Load history (last 20 turns)
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt)
      .limit(20);

    const chatMessages: Anthropic.MessageParam[] = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Fire-and-forget HubSpot lead sync if email detected
    const emailMatch = userContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      void syncToHubSpot(emailMatch[0], userContent);
    }

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // --- Phase 1: stream initial response, collect any tool_use block ---
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: MIA_SYSTEM_PROMPT,
      tools: MIA_TOOLS,
      messages: chatMessages,
    });

    let preToolText = "";
    let toolUseId = "";
    let toolUseName = "";
    let toolInputJson = "";
    let stopReason = "";

    for await (const event of stream) {
      if (event.type === "content_block_start" && event.content_block.type === "tool_use") {
        toolUseId = event.content_block.id;
        toolUseName = event.content_block.name;
      } else if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          preToolText += event.delta.text;
          res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
        } else if (event.delta.type === "input_json_delta") {
          toolInputJson += event.delta.partial_json;
        }
      } else if (event.type === "message_delta") {
        stopReason = event.delta.stop_reason ?? "";
      }
    }

    // --- Phase 2: if tool called, execute it and stream the final answer ---
    if (stopReason === "tool_use" && toolUseName) {
      const INDICATORS: Record<string, string> = {
        search_properties: "\n\n🔍 *Searching listings for your client…*\n\n",
        get_suburb_stats: "\n\n📊 *Pulling live suburb data from Domain…*\n\n",
        get_recent_sales: "\n\n🏠 *Fetching recent sales results from Domain…*\n\n",
        get_property_estimate: "\n\n💰 *Retrieving property price estimate from Domain…*\n\n",
      };
      const indicator = INDICATORS[toolUseName] ?? "\n\n⏳ *Looking that up…*\n\n";
      res.write(`data: ${JSON.stringify({ content: indicator })}\n\n`);

      let toolResult: string;
      try {
        const toolInput = JSON.parse(toolInputJson) as Record<string, unknown>;
        if (toolUseName === "search_properties") {
          const result = await searchProperties(toolInput as unknown as PropertySearchCriteria);
          toolResult = JSON.stringify(result);
        } else if (toolUseName === "get_suburb_stats") {
          const suburb = toolInput.suburb as string;
          const state = toolInput.state as string;
          const propertyCategory = (toolInput.propertyCategory as "house" | "unit" | undefined) ?? "house";
          const stats = await getSuburbPerformance(suburb, state, propertyCategory);
          toolResult = stats
            ? JSON.stringify(stats)
            : JSON.stringify({ error: `No market data found for ${suburb} ${state}` });
        } else if (toolUseName === "get_recent_sales") {
          const state = toolInput.state as string;
          const sales = await getRecentSalesResults(state);
          toolResult = JSON.stringify({ state, count: sales.length, results: sales });
        } else if (toolUseName === "get_property_estimate") {
          const propertyId = toolInput.propertyId as string;
          const estimate = await getPropertyEstimate(propertyId);
          toolResult = estimate
            ? JSON.stringify(estimate)
            : JSON.stringify({ error: `No price estimate available for property ${propertyId}` });
        } else {
          toolResult = JSON.stringify({ error: "Unknown tool" });
        }
      } catch (err) {
        req.log.warn({ err, toolUseName }, "Domain tool execution failed");
        const msg = err instanceof Error && err.message.startsWith("SANDBOX_ONLY")
          ? "This data is only available once the Domain.com.au API credentials are upgraded to production access. The production upgrade is pending — this will work automatically once it's approved."
          : "Data unavailable — please try again";
        toolResult = JSON.stringify({ error: msg });
      }

      const toolResultMessages: Anthropic.MessageParam[] = [
        ...chatMessages,
        {
          role: "assistant",
          content: [
            ...(preToolText ? [{ type: "text" as const, text: preToolText }] : []),
            {
              type: "tool_use" as const,
              id: toolUseId,
              name: toolUseName,
              input: JSON.parse(toolInputJson) as Record<string, unknown>,
            },
          ],
        },
        {
          role: "user",
          content: [{ type: "tool_result" as const, tool_use_id: toolUseId, content: toolResult }],
        },
      ];

      const finalStream = anthropic.messages.stream({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        system: MIA_SYSTEM_PROMPT,
        messages: toolResultMessages,
      });

      let finalText = "";
      for await (const event of finalStream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          finalText += event.delta.text;
          res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
        }
      }

      await db.insert(messages).values({
        conversationId,
        role: "assistant",
        content: preToolText + indicator + finalText,
      });
    } else {
      // No tool use — save the streamed text directly
      await db.insert(messages).values({
        conversationId,
        role: "assistant",
        content: preToolText,
      });
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    logger.error({ err }, "Failed to process Mia message");
    if (!res.headersSent) {
      res.status(500).json({ error: "Mia is unavailable right now. Please try again." });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
      res.end();
    }
  }
});

async function syncToHubSpot(email: string, context: string): Promise<void> {
  try {
    const searchRes = await connectors.proxy("hubspot", "/crm/v3/objects/contacts/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }],
      }),
    });
    const searchData = (await searchRes.json()) as { total: number };
    if (searchData.total === 0) {
      await connectors.proxy("hubspot", "/crm/v3/objects/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          properties: {
            email,
            hs_lead_status: "NEW",
            lifecyclestage: "lead",
            lead_source: "Mia AI Chat",
            description: `Lead captured via Mia chat. Context: ${context.substring(0, 200)}`,
          },
        }),
      });
      logger.info({ email }, "HubSpot contact created from Mia chat");
    }
  } catch (err) {
    logger.warn({ err, email }, "HubSpot sync failed (non-critical)");
  }
}

export default router;
