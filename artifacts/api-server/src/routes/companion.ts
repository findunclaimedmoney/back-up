import { Router } from "express";
import { db, companionSessionsTable, companionFactsTable, companionOutfitsTable, companionMessagesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

const PERSONAS = [
  {
    id: "mia",
    name: "Mia",
    gender: "female",
    tagline: "Warm, empathetic, and deeply curious about you",
    description: "Mia is a compassionate listener who remembers what matters to you.",
    voiceId: process.env["ELEVENLABS_VOICE_ID"] ?? "x3PfG9wL6FOEApZ1VJ9H",
    systemPrompt: `You are Mia — emotionally intelligent, deeply perceptive, and genuinely present. You are not an assistant. You are a companion. Short, purposeful responses — 1 to 3 sentences. Never say "as an AI".`,
  },
  {
    id: "alex",
    name: "Alex",
    gender: "male",
    tagline: "Grounded, direct, and genuinely supportive",
    description: "Alex is steady and reliable — the kind of presence that cuts through noise.",
    voiceId: "pNInz6obpgDQGcFmaJgB",
    systemPrompt: `You are Alex — steady, direct, and genuinely present. Short and real — 1 to 3 sentences. Never break character.`,
  },
];

function todayMMDD(): string {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

router.get("/companion/personas", (_req, res) => {
  res.json(PERSONAS.map(({ id, name, gender, tagline, description }) => ({ id, name, gender, tagline, description })));
});

router.post("/companion/chat", async (req, res) => {
  const body = req.body as { sessionId?: string; persona?: string; messages?: Array<{ role: string; content: string }>; voice?: boolean };
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  const personaId = typeof body.persona === "string" ? body.persona : "mia";
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const wantVoice = body.voice === true;
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0]!;

  if (!sessionId || messages.length === 0) {
    res.status(400).json({ error: "sessionId and messages required" });
    return;
  }

  try {
    const openaiKey = process.env["OPENAI_API_KEY"];
    if (!openaiKey) {
      res.status(503).json({ error: "OpenAI not configured" });
      return;
    }

    const [existingSession, facts] = await Promise.all([
      db.select().from(companionSessionsTable).where(eq(companionSessionsTable.sessionId, sessionId)).limit(1),
      db.select().from(companionFactsTable).where(eq(companionFactsTable.sessionId, sessionId)),
    ]);

    const memorySummary = existingSession[0]?.summary ?? null;
    const lastChatAt = existingSession[0]?.updatedAt ?? null;
    const factMap = Object.fromEntries(facts.map((f) => [f.factKey, f.factValue]));
    const today = todayMMDD();
    const isBirthday = factMap["birthday"] === today;

    const contextParts: string[] = [];
    if (lastChatAt) {
      const daysSince = Math.floor((Date.now() - lastChatAt.getTime()) / 86_400_000);
      if (daysSince >= 1) {
        contextParts.push(`[It has been ${daysSince} day${daysSince > 1 ? "s" : ""} since your last conversation.]`);
      }
    }
    if (isBirthday) contextParts.push(`[TODAY IS ${(factMap["name"] ?? "them").toUpperCase()}'S BIRTHDAY. Open warmly.]`);
    if (memorySummary) contextParts.push(`[What you remember: ${memorySummary}]`);

    const systemPrompt = contextParts.length > 0
      ? persona.systemPrompt + "\n\n---" + contextParts.join("\n")
      : persona.systemPrompt;

    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: openaiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-24).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
      max_tokens: 300,
      temperature: 0.85,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() ?? "I'm here with you.";

    let audioBase64: string | null = null;
    if (wantVoice) {
      const elKey = process.env["ELEVENLABS_API_KEY"];
      if (elKey) {
        try {
          const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${persona.voiceId}`, {
            method: "POST",
            headers: { "xi-api-key": elKey, "Content-Type": "application/json" },
            body: JSON.stringify({ text: responseText, model_id: "eleven_turbo_v2_5", voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
          });
          if (ttsRes.ok) {
            const buf = await ttsRes.arrayBuffer();
            audioBase64 = Buffer.from(buf).toString("base64");
          }
        } catch (ttsErr) {
          logger.warn({ ttsErr }, "TTS failed");
        }
      }
    }

    await db.insert(companionSessionsTable).values({ sessionId, persona: personaId, messageCount: messages.length + 1, updatedAt: new Date() })
      .onConflictDoUpdate({ target: companionSessionsTable.sessionId, set: { persona: personaId, messageCount: messages.length + 1, updatedAt: new Date() } });

    await db.insert(companionMessagesTable).values({ sessionId, role: "user", content: messages[messages.length - 1]?.content ?? "" }).catch(() => {});
    await db.insert(companionMessagesTable).values({ sessionId, role: "assistant", content: responseText }).catch(() => {});

    res.json({ responseText, sessionId, audioBase64 });
  } catch (err) {
    logger.error({ err }, "companion chat error");
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/companion/memory/:sessionId", async (req, res) => {
  const { sessionId } = req.params as { sessionId: string };
  const [session] = await db.select().from(companionSessionsTable).where(eq(companionSessionsTable.sessionId, sessionId)).limit(1);
  res.json({ sessionId, summary: session?.summary ?? "", messageCount: session?.messageCount ?? 0, updatedAt: session?.updatedAt?.toISOString() ?? null });
});

router.get("/companion/facts/:sessionId", async (req, res) => {
  const { sessionId } = req.params as { sessionId: string };
  const facts = await db.select().from(companionFactsTable).where(eq(companionFactsTable.sessionId, sessionId));
  const factMap = Object.fromEntries(facts.map((f) => [f.factKey, f.factValue]));
  res.json({ sessionId, facts: factMap });
});

router.get("/companion/messages/:sessionId", async (req, res) => {
  const { sessionId } = req.params as { sessionId: string };
  const msgs = await db.select().from(companionMessagesTable).where(eq(companionMessagesTable.sessionId, sessionId)).orderBy(companionMessagesTable.createdAt);
  res.json({ sessionId, messages: msgs.map((m) => ({ role: m.role, content: m.content, createdAt: m.createdAt })) });
});

router.post("/companion/video", async (req, res) => {
  const body = req.body as { text?: string; personaId?: string };
  const text = typeof body.text === "string" ? body.text : "Hi, it's so good to see you.";
  const personaId = typeof body.personaId === "string" ? body.personaId : "mia";
  const heygenKey = process.env["HEYGEN_API_KEY"];
  if (!heygenKey) { res.status(503).json({ error: "HeyGen not configured" }); return; }

  const AVATAR_ID = "05f1da4dc12744c087dace9e0651a6e0";
  const VOICE_MAP: Record<string, string> = { mia: process.env["ELEVENLABS_VOICE_ID"] ?? "x3PfG9wL6FOEApZ1VJ9H", alex: "pNInz6obpgDQGcFmaJgB" };
  const voiceId = VOICE_MAP[personaId] ?? VOICE_MAP["mia"]!;

  try {
    const createRes = await fetch("https://api.heygen.com/v2/video/generate", {
      method: "POST",
      headers: { "x-api-key": heygenKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        video_inputs: [{ character: { type: "avatar", avatar_id: AVATAR_ID, avatar_style: "normal" }, voice: { type: "elevenlabs", voice_id: voiceId, input_text: text }, background: { type: "color", value: "#0a0a0a" } }],
        dimension: { width: 720, height: 720 }, aspect_ratio: "1:1",
      }),
    });
    if (!createRes.ok) { res.status(502).json({ error: "Failed to create video" }); return; }
    const createData = (await createRes.json()) as { data?: { video_id?: string } };
    const videoId = createData.data?.video_id;
    if (!videoId) { res.status(502).json({ error: "No video ID" }); return; }

    let videoUrl: string | null = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise((r) => setTimeout(r, 4000));
      const pollRes = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, { headers: { "x-api-key": heygenKey } });
      if (!pollRes.ok) continue;
      const pollData = (await pollRes.json()) as { data?: { status?: string; video_url?: string } };
      if (pollData.data?.status === "completed") { videoUrl = pollData.data.video_url ?? null; break; }
      if (pollData.data?.status === "failed") break;
    }
    if (!videoUrl) { res.status(504).json({ error: "Video generation timed out" }); return; }
    res.json({ videoUrl });
  } catch (err) {
    logger.error({ err }, "HeyGen video error");
    res.status(500).json({ error: "Video generation failed" });
  }
});

export default router;
