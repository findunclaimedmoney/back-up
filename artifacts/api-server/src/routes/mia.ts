import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { MiaChatBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { MIA_SYSTEM_PROMPT } from "../lib/mia-knowledge";

const router: IRouter = Router();

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;
const hits = new Map<string, number[]>();

function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip ?? "unknown";
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    req.log.warn({ ip: key }, "Mia chat rate limit exceeded");
    res.setHeader("Retry-After", "60");
    res.status(429).json({ error: "Too many requests. Please slow down and try again shortly." });
    return;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) hits.delete(k);
    }
  }
  next();
}

router.post("/mia/chat", rateLimit, async (req, res): Promise<void> => {
  const parsed = MiaChatBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid Mia chat body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const controller = new AbortController();
  let clientGone = false;
  res.on("close", () => {
    if (!res.writableEnded) {
      clientGone = true;
      controller.abort();
    }
  });

  try {
    const stream = await openai.chat.completions.create(
      {
        model: "gpt-5.4",
        max_completion_tokens: 8192,
        messages: [
          { role: "system", content: MIA_SYSTEM_PROMPT },
          ...parsed.data.messages,
        ],
        stream: true,
      },
      { signal: controller.signal },
    );

    for await (const chunk of stream) {
      if (clientGone) break;
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    if (!clientGone) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  } catch (err) {
    if (clientGone) return;
    req.log.error({ err }, "Mia chat stream failed");
    if (!res.headersSent) {
      res.status(500).json({ error: "Mia is unavailable right now." });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Mia is unavailable right now." })}\n\n`);
      res.end();
    }
  }
});

export default router;
