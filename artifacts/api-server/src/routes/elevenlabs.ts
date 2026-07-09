import { Router, type IRouter, raw } from "express";
import { ElevenLabsClient } from "elevenlabs";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const MORGAN_VOICE_ID = "g5fH9S068t9I3i8Y9u4"; // Mia — user-provided ElevenLabs voice

function getClient(): ElevenLabsClient {
  return new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
}

// POST /api/elevenlabs/stt — transcribe a recorded audio blob (cross-browser
// voice input fallback for browsers without the Web Speech API)
router.post(
  "/elevenlabs/stt",
  raw({ type: ["audio/*", "application/octet-stream"], limit: "25mb" }),
  async (req, res) => {
    const audio = req.body as Buffer;
    if (!Buffer.isBuffer(audio) || audio.length === 0) {
      res.status(400).json({ error: "audio body is required" });
      return;
    }
    try {
      const client = getClient();
      const contentType = req.headers["content-type"] || "audio/webm";
      const ext = contentType.includes("mp4") ? "mp4" : contentType.includes("mpeg") ? "mp3" : "webm";
      const file = new File([new Uint8Array(audio)], `speech.${ext}`, { type: contentType });
      const result = await client.speechToText.convert({
        file,
        model_id: "scribe_v1",
      });
      res.json({ text: (result as { text?: string }).text ?? "" });
    } catch (err) {
      logger.error({ err }, "Mia STT failed");
      res.status(500).json({ error: "Speech recognition unavailable" });
    }
  },
);

// POST /api/elevenlabs/tts — Mia voice synthesis
router.post("/elevenlabs/tts", async (req, res) => {
  const { text } = req.body as { text?: string };
  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "text is required" });
    return;
  }
  try {
    const audio = await generateVoiceover(text.slice(0, 1500), MORGAN_VOICE_ID);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audio.length.toString());
    res.send(audio);
  } catch (err) {
    logger.error({ err }, "Mia TTS failed");
    res.status(500).json({ error: "TTS unavailable" });
  }
});

// GET /api/elevenlabs/voices — list all voices in the user's account
router.get("/elevenlabs/voices", async (_req, res) => {
  try {
    const client = getClient();
    const response = await client.voices.getAll();
    const voices = (response.voices ?? []).map((v) => ({
      voice_id: v.voice_id,
      name: v.name ?? "Unnamed Voice",
      category: v.category ?? "generated",
      description: v.description ?? null,
      preview_url: v.preview_url ?? null,
      labels: v.labels ?? {},
    }));
    res.json(voices);
  } catch (err) {
    logger.error({ err }, "Failed to fetch ElevenLabs voices");
    res.status(500).json({ error: "Failed to fetch voices from ElevenLabs. Check your API key." });
  }
});

export default router;

// Re-export a helper for use in the jobs pipeline
export async function generateVoiceover(
  text: string,
  voiceId: string
): Promise<Buffer> {
  const client = getClient();
  const audioStream = await client.generate({
    voice: voiceId,
    model_id: "eleven_multilingual_v2",
    text,
  });

  const chunks: Buffer[] = [];
  for await (const chunk of audioStream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as ArrayBuffer));
  }
  return Buffer.concat(chunks);
}
