---
name: D-ID talking-avatar generation
description: Non-obvious gotchas when generating a lip-synced talking-head video via D-ID + ElevenLabs in this repo.
---

# D-ID talking-avatar generation

Pipeline: ElevenLabs TTS → D-ID `/images` + `/audios` upload → `/talks` (config.stitch) → poll → download MP4.

## Gotchas

- **Transparent-background PNG renders as a coloured box in D-ID** (black or blue, depending on the plan/codec). Always flatten onto a solid colour first with `magick <in.png> -background '#0A1128' -alpha remove -alpha off <out.png>` — use `#0A1128` (the scene's `--color-bg-dark`). The flattened file is saved as `public/mia-avatar-flat.png`; pass its D-ID S3 URL as `source_url`.
- **D-ID free/trial plan stamps a "D-iD" watermark bottom-left.** Since the background is a flat color, cover it after download with ffmpeg `drawbox=...:color=<bg>@1.0:t=fill` and re-encode (`libx264 -pix_fmt yuv420p -c:a aac -movflags +faststart`). Re-encoding also shrinks the file a lot.
- **The render continues server-side after the local process dies.** Background `nohup node ...` jobs get SIGKILLed when the bash tool session ends, so a long poll loop rarely survives. But the `/talks` job keeps rendering on D-ID. Recovery: re-poll the existing `talk id` and download `result_url` — no need to regenerate (saves credits).
- **D-ID auth header here is `Authorization: Basic <DID_API_KEY>`** (the key is already base64 `user:pass`; do NOT re-encode).
- Secrets (`DID_API_KEY`, `ELEVENLABS_API_KEY`) are in the shell/server env only — the code_execution sandbox cannot read them. Run generator scripts via bash, not the sandbox.

**Why:** burned multiple attempts on a black render (transparent PNG), a watermarked clip, and dead background pollers before landing the clean MP4.
