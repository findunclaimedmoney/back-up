import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// All mobile routes require authentication
router.use(requireAuth);

/**
 * POST /api/mobile/chat
 * Streaming chat endpoint for the GLIMR mobile app.
 * Body: { messages: [{role, content}], systemPrompt: string, companionId?: string }
 * Response: Server-Sent Events stream
 */
router.post("/chat", async (req, res): Promise<void> => {
  const { messages, systemPrompt, companionId } = req.body || {};

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "messages array required" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  // Graceful stub when AI is not configured
  if (!apiKey) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    const stub = "I'm not fully set up yet — please configure the AI service to chat with me.";
    for (const char of stub) {
      res.write(`data: ${JSON.stringify({ content: char })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  // Set SSE headers for true streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const systemMessages = systemPrompt
    ? [{ role: "system", content: String(systemPrompt) }]
    : [];

  const chatMessages = [
    ...systemMessages,
    ...messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  try {
    const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: chatMessages,
        stream: true,
        max_tokens: 600,
        temperature: 0.85,
      }),
    });

    if (!openAiRes.ok) {
      const errBody = await openAiRes.text();
      req.log.error({ status: openAiRes.status, body: errBody, companionId }, "OpenAI error");
      res.write(`data: ${JSON.stringify({ content: "Something went wrong. Please try again." })}\n\n`);
    } else if (!openAiRes.body) {
      req.log.error({ companionId }, "No response body from OpenAI");
      res.write(`data: ${JSON.stringify({ content: "No response received. Please try again." })}\n\n`);
    } else {
      const reader = openAiRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch {
            // Ignore malformed chunks
          }
        }
      }
    }
  } catch (err: unknown) {
    req.log.error({ err, companionId }, "mobile/chat error");
    res.write(`data: ${JSON.stringify({ content: "I lost my train of thought. Please try again." })}\n\n`);
  }

  res.write("data: [DONE]\n\n");
  res.end();
});

export default router;
