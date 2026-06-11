// One-off generator: builds Mia's talking welcome video.
// ElevenLabs (voice) -> D-ID (lip-synced video from her photo) -> public/mia-welcome.mp4
// Run: node scripts/gen-mia-video.mjs
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const DID_KEY = process.env.DID_API_KEY;
const XI_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.MIA_VOICE_ID || "x3PfG9wL6FOEApZ1VJ9H"; // "Mia" voice
const IMAGE_PATH = "artifacts/missingcash/public/mia-avatar.png";
const OUT_PATH = "artifacts/missingcash/public/mia-welcome.mp4";

const SCRIPT_TEXT =
  "Hi, I'm Mia, your MissingCash assistant. Did you know there's over 2.6 billion dollars in unclaimed money sitting with the government and banks across Australia? Some of it could be yours — lost super, forgotten shares, or old dormant accounts. Searching is one hundred percent free. Just tell me your name, and I'll help you find what's rightfully yours.";

if (!DID_KEY) throw new Error("DID_API_KEY missing");
if (!XI_KEY) throw new Error("ELEVENLABS_API_KEY missing");
if (!existsSync(IMAGE_PATH)) throw new Error(`Source image missing: ${IMAGE_PATH}`);

const DID = "https://api.d-id.com";
const didHeaders = { Authorization: "Basic " + DID_KEY };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ttsElevenLabs() {
  console.log("[1/5] ElevenLabs TTS…");
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: { "xi-api-key": XI_KEY, "content-type": "application/json" },
    body: JSON.stringify({
      text: SCRIPT_TEXT,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true },
    }),
  });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${await r.text()}`);
  const buf = Buffer.from(await r.arrayBuffer());
  console.log(`      audio bytes: ${buf.length}`);
  return buf;
}

async function uploadImage() {
  console.log("[2/5] Upload source image to D-ID…");
  const bytes = await readFile(IMAGE_PATH);
  const fd = new FormData();
  fd.append("image", new Blob([bytes], { type: "image/png" }), "mia-avatar.png");
  const r = await fetch(`${DID}/images`, { method: "POST", headers: didHeaders, body: fd });
  if (!r.ok) throw new Error(`D-ID /images ${r.status}: ${await r.text()}`);
  const j = await r.json();
  console.log(`      image url: ${j.url}`);
  return j.url;
}

async function uploadAudio(buf) {
  console.log("[3/5] Upload audio to D-ID…");
  const fd = new FormData();
  fd.append("audio", new Blob([buf], { type: "audio/mpeg" }), "mia-welcome.mp3");
  const r = await fetch(`${DID}/audios`, { method: "POST", headers: didHeaders, body: fd });
  if (!r.ok) throw new Error(`D-ID /audios ${r.status}: ${await r.text()}`);
  const j = await r.json();
  console.log(`      audio url: ${j.url}`);
  return j.url;
}

async function createTalk(source_url, audio_url) {
  console.log("[4/5] Create talk…");
  const r = await fetch(`${DID}/talks`, {
    method: "POST",
    headers: { ...didHeaders, "content-type": "application/json" },
    body: JSON.stringify({
      source_url,
      script: { type: "audio", audio_url },
      config: { stitch: true },
    }),
  });
  if (!r.ok) throw new Error(`D-ID /talks ${r.status}: ${await r.text()}`);
  const j = await r.json();
  console.log(`      talk id: ${j.id}`);
  return j.id;
}

async function pollTalk(id) {
  console.log("[5/5] Polling for render…");
  for (let i = 0; i < 60; i++) {
    const r = await fetch(`${DID}/talks/${id}`, { headers: didHeaders });
    const j = await r.json();
    if (j.status === "done") {
      console.log(`      done: ${j.result_url}`);
      return j.result_url;
    }
    if (j.status === "error") throw new Error(`D-ID render error: ${JSON.stringify(j.error || j)}`);
    process.stdout.write(`      status=${j.status} (${i})\r`);
    await sleep(3000);
  }
  throw new Error("Timed out waiting for D-ID render");
}

async function download(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  await writeFile(OUT_PATH, buf);
  console.log(`Saved ${OUT_PATH} (${buf.length} bytes)`);
}

const audio = await ttsElevenLabs();
const [imgUrl, audUrl] = [await uploadImage(), await uploadAudio(audio)];
const talkId = await createTalk(imgUrl, audUrl);
const resultUrl = await pollTalk(talkId);
await download(resultUrl);
console.log("DONE ✅");
