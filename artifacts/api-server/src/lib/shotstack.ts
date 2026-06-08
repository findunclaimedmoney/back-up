import { logger } from "./logger";

// Premium royalty-free tracks — varied genres with distinct energy
const MUSIC_TRACK_URLS: Record<string, string> = {
  uplifting:  "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/music/unminus/lit.mp3",
  cinematic:  "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/music/unminus/berlin.mp3",
  calm:       "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/music/unminus/ambisax.mp3",
  corporate:  "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/music/unminus/ambisax.mp3",
  luxury:     "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/music/unminus/berlin.mp3",
  summer:     "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/music/unminus/lit.mp3",
  country:    "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/music/unminus/ambisax.mp3",
  urban:      "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/music/unminus/lit.mp3",
};

function getShotstackConfig(): { apiKey: string; baseUrl: string } {
  const prodKey = (process.env.SHOTSTACK_PROD_API_KEY ?? process.env.SHOTSTACK_PRODUCTION_API_KEY)?.trim();
  const sandboxKey = (process.env.SHOTSTACK_API_KEY ?? process.env.SHOTSTACK_SANDBOX_API_KEY)?.trim();
  if (prodKey) return { apiKey: prodKey, baseUrl: "https://api.shotstack.io/edit/v1" };
  if (sandboxKey) {
    logger.warn("Using Shotstack sandbox key — set SHOTSTACK_PROD_API_KEY for production renders");
    return { apiKey: sandboxKey, baseUrl: "https://api.shotstack.io/edit/stage" };
  }
  throw new Error("No Shotstack API key set (SHOTSTACK_PROD_API_KEY or SHOTSTACK_API_KEY)");
}

function colourClip(colour: string, start: number, length: number, opacity?: number) {
  return {
    asset: { type: "shape", shape: "rectangle", fill: { color: colour } },
    start,
    length,
    ...(opacity !== undefined ? { opacity } : {}),
  };
}

async function pollUntilDone(
  renderId: string,
  apiKey: string,
  baseUrl: string,
  label: string,
): Promise<string> {
  logger.info({ renderId }, `${label} — waiting 30s before first poll`);
  await new Promise((r) => setTimeout(r, 30_000));

  const POLL_INTERVAL_MS = 10_000;
  const MAX_ATTEMPTS = 60;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const statusRes = await fetch(`${baseUrl}/render/${renderId}`, {
      headers: { "x-api-key": apiKey },
    });
    if (!statusRes.ok) {
      logger.warn({ attempt, httpStatus: statusRes.status }, `${label} poll failed — retrying`);
      continue;
    }
    const statusData = (await statusRes.json()) as {
      success: boolean;
      response?: { status: string; url?: string };
    };
    const status = statusData.response?.status;
    logger.info({ renderId, status, attempt }, `${label} poll`);
    if (status === "done") {
      const videoUrl = statusData.response?.url;
      if (!videoUrl) throw new Error(`${label} done but no url returned`);
      logger.info({ renderId, videoUrl }, `${label} complete`);
      return videoUrl;
    }
    if (status === "failed") throw new Error(`${label} render failed (id=${renderId})`);
  }
  throw new Error(`${label} timed out after ${MAX_ATTEMPTS} polls (render_id=${renderId})`);
}

export interface ShotstackResult {
  videoUrl: string;
  renderId: string;
}

/**
 * premium_luxury_v1 — Structured 5-act cinematic real estate presenter video.
 *
 * Act 1  (0–6s)   Opening title card       — heavy vignette, large property address, gold badge
 * Act 2  (6–15s)  Presenter reveal         — vignette lifts, presenter fades in, name badge slides up
 * Act 3  (15–36s) Three selling points     — dedicated photo per point, elegant upper-left captions
 * Act 4  (36–52s) Photo showcase           — rapid-cut 3.5s photos, cinematic panning, presenter continues
 * Act 5  (52–65s) Closing CTA              — vignette returns, gold CTA, domain, fade to end
 *
 * - True 1080p HD, 30fps
 * - Full-bleed property imagery with Ken Burns + directional effects
 * - Variable vignette intensity per act (heavy open/close, light body)
 * - Premium gold (#C9962A) + white typography
 * - Presenter fully integrated at bottom-center, not pasted on
 * - No blank frames, no tiny unreadable text
 * - Music bed at 0.15 volume — presence without overwhelming voice
 */
export async function composePresenterVideoPremiumLuxuryV1(
  presenterVideoUrl: string,
  propertyTitle?: string | null,
  listingUrl?: string | null,
  propertyImages?: string[] | null,
  musicTrack?: string | null,
  voiceName?: string | null,
  testMode = false,
  highlights?: string[] | null,
  musicUrl?: string | null,
): Promise<ShotstackResult> {
  const { apiKey, baseUrl } = getShotstackConfig();

  const subtitle = propertyTitle ?? "Premium Property Listing";
  const domain = listingUrl
    ? (() => { try { return new URL(listingUrl).hostname.replace("www.", ""); } catch { return "lensflow.com.au"; } })()
    : "lensflow.com.au";

  const presenterLabel = voiceName
    ? voiceName.charAt(0).toUpperCase() + voiceName.slice(1).toLowerCase()
    : "LensFlow AI";

  const images = (propertyImages ?? []).filter(Boolean);
  const hasPhotos = images.length > 0;
  const img = (i: number): string => images[i % images.length] ?? "";

  // ── Timing constants ────────────────────────────────────────────────────────
  const TOTAL = testMode ? 10 : 65;
  const PRESENTER_START = testMode ? 0 : 4;

  // Act boundaries (full mode only — test mode collapses to a 10s preview)
  const A1_END   = 6;   // Opening title card ends
  const A2_END   = 15;  // Presenter reveal ends
  const SP1_S    = 15; const SP1_E = 22; // Selling point 1
  const SP2_S    = 22; const SP2_E = 29; // Selling point 2
  const SP3_S    = 29; const SP3_E = 36; // Selling point 3
  const A4_START = 36; const A4_END = 52; // Photo showcase
  const A5_START = 52; // Closing CTA to end

  logger.info(
    { presenterVideoUrl, subtitle, photoCount: images.length, presenterLabel, testMode, template: "premium_luxury_v1" },
    "Submitting Shotstack render — premium_luxury_v1",
  );

  // ── Photo Track ─────────────────────────────────────────────────────────────
  // Continuous coverage: no gaps, deliberate timing per act, cinematic effects
  const buildPhotoTrack = (): object => {
    if (!hasPhotos) return { clips: [colourClip("#0d1117", 0, TOTAL)] };

    if (testMode) {
      return {
        clips: [{
          asset: { type: "image", src: img(0) },
          start: 0, length: TOTAL, fit: "cover", scale: 1,
          effect: "zoomIn",
          transition: { in: "fade", out: "fade" },
        }],
      };
    }

    const clips: object[] = [];

    // Act 1 + 2: Long cinematic hold on first photo (12s) — establishes mood
    clips.push({
      asset: { type: "image", src: img(0) },
      start: 0, length: 12, fit: "cover", scale: 1,
      effect: "zoomIn",
      transition: { in: "fade", out: "fadeSlow" },
    });

    // Act 3: Selling points — each gets its own dedicated photo (7s, slow motion)
    clips.push({
      asset: { type: "image", src: img(1) },
      start: 12, length: 7, fit: "cover", scale: 1,
      effect: "zoomOut",
      transition: { in: "wipeLeft", out: "fadeSlow" },
    });
    clips.push({
      asset: { type: "image", src: img(2) },
      start: 19, length: 7, fit: "cover", scale: 1,
      effect: "slideLeft",
      transition: { in: "wipeRight", out: "fadeSlow" },
    });
    clips.push({
      asset: { type: "image", src: img(3) },
      start: 26, length: 7, fit: "cover", scale: 1,
      effect: "zoomIn",
      transition: { in: "wipeLeft", out: "fadeSlow" },
    });

    // Act 4: Photo showcase — rapid cuts 3.5s each, high-energy selection
    const showcaseEffects = ["zoomIn", "zoomOut", "slideLeft", "slideRight", "zoomIn", "slideLeft"];
    const showcaseTrans   = ["wipeLeft", "wipeRight", "fade", "wipeLeft", "wipeRight", "fade"];
    let t = A4_START;
    let si = 0;
    while (t < A4_END - 0.1) {
      const dur = Math.min(3.5, A4_END - t);
      clips.push({
        asset: { type: "image", src: img(si) },
        start: t, length: dur, fit: "cover", scale: 1,
        effect: showcaseEffects[si % showcaseEffects.length],
        transition: { in: showcaseTrans[si % showcaseTrans.length], out: "fadeSlow" },
      });
      t = Math.round((t + dur) * 10) / 10;
      si++;
    }

    // Act 5: Closing — slow, moody, one of the hero shots
    clips.push({
      asset: { type: "image", src: img(1) },
      start: A5_START, length: TOTAL - A5_START, fit: "cover", scale: 1,
      effect: "zoomOut",
      transition: { in: "fade", out: "fade" },
    });

    return { clips };
  };

  // ── Vignette Track ──────────────────────────────────────────────────────────
  // Three non-overlapping strips: heavy open, light body, heavy close
  const buildVignetteTrack = (): object | null => {
    if (!hasPhotos) return null;
    if (testMode) return { clips: [colourClip("#080500", 0, TOTAL, 0.30)] };
    return {
      clips: [
        // Act 1: Heavy cinematic dark — title text pops
        colourClip("#080500", 0, A1_END, 0.62),
        // Acts 2–4: Light touch — photos breathe, presenter integrates naturally
        colourClip("#080500", A1_END, A5_START - A1_END, 0.20),
        // Act 5: Heavy close — CTA text dominant, moody finish
        colourClip("#080500", A5_START, TOTAL - A5_START, 0.60),
      ],
    };
  };

  // ── Presenter Track ─────────────────────────────────────────────────────────
  // Large scale, bottom-center, fades in after opening — feels integrated not pasted
  const presenterClip = {
    asset: { type: "video", src: presenterVideoUrl, volume: 0 },
    start: PRESENTER_START,
    length: TOTAL - PRESENTER_START,
    fit: "contain",
    scale: hasPhotos ? 0.86 : 1.0,
    position: hasPhotos ? "bottom" : "center",
    ...(hasPhotos ? { offset: { x: 0, y: 0.09 } } : {}),
    transition: { in: "fade" },
  };

  // ── Opening Title (Act 1) ────────────────────────────────────────────────────
  // Property address — large, white, centered, dominant first impression
  const openingTitle = {
    asset: {
      type: "title",
      text: subtitle,
      style: "future",
      color: "#FFFFFF",
      size: "large",
    },
    start: 0.6,
    length: 4.8,
    position: "center",
    offset: { x: 0, y: 0.16 },
    transition: { in: "fade", out: "fade" },
  };

  // Gold "EXCLUSIVE LISTING" label — appears slightly after title
  const exclusiveBadge = {
    asset: {
      type: "title",
      text: "EXCLUSIVE LISTING",
      style: "minimal",
      color: "#C9962A",
      size: "x-small",
    },
    start: 1.2,
    length: 4.0,
    position: "center",
    offset: { x: 0, y: 0.31 },
    transition: { in: "fade", out: "fade" },
  };

  // ── Persistent Watermark ─────────────────────────────────────────────────────
  const watermarkClip = {
    asset: {
      type: "title",
      text: `lensflow.com.au  ·  ${domain}`,
      style: "minimal",
      color: "#F5E6C8",
      size: "x-small",
    },
    start: 0,
    length: TOTAL,
    position: "topRight",
    offset: { x: -0.02, y: -0.04 },
    transition: { in: "fade" },
  };

  // ── Presenter Name Badge (Act 2+) ─────────────────────────────────────────────
  // Slides up from bottom at 8s — professional lower-third treatment
  const presenterBadge = TOTAL > 9 ? {
    asset: {
      type: "title",
      text: `PRESENTED BY  ${presenterLabel.toUpperCase()}`,
      style: "minimal",
      color: "#C9962A",
      size: "x-small",
    },
    start: 8,
    length: TOTAL - 8,
    position: "bottom",
    offset: { x: 0, y: -0.02 },
    transition: { in: "slideUp" },
  } : null;

  // ── Selling Point Captions (Act 3) ────────────────────────────────────────────
  // Upper-left area — avoids presenter, reads clearly against hero photos
  const sellingPointClips: object[] = [];
  if (!testMode && highlights && highlights.length > 0) {
    const spSlots = [
      { start: SP1_S + 1.0, length: SP1_E - SP1_S - 2.0 },
      { start: SP2_S + 1.0, length: SP2_E - SP2_S - 2.0 },
      { start: SP3_S + 1.0, length: SP3_E - SP3_S - 2.0 },
    ];
    highlights.slice(0, 3).forEach((phrase, i) => {
      const slot = spSlots[i];
      if (!slot) return;
      sellingPointClips.push({
        asset: {
          type: "title",
          text: phrase,
          style: "minimal",
          color: "#FFFFFF",
          size: "small",
        },
        start: slot.start,
        length: slot.length,
        position: "topLeft",
        offset: { x: 0.04, y: -0.10 },
        transition: { in: "fade", out: "fade" },
      });
    });
  }

  // ── Closing CTA (Act 5) ───────────────────────────────────────────────────────
  // Gold, large, centered high — dominant over the heavy vignette
  const closingCta = TOTAL > 55 ? {
    asset: {
      type: "title",
      text: "Book Your Inspection Today",
      style: "future",
      color: "#C9962A",
      size: "large",
    },
    start: A5_START + 1.5,
    length: TOTAL - A5_START - 2.5,
    position: "center",
    offset: { x: 0, y: 0.24 },
    transition: { in: "fade", out: "fade" },
  } : null;

  // Domain/contact under CTA — small, warm white
  const closingDomain = TOTAL > 55 ? {
    asset: {
      type: "title",
      text: `lensflow.com.au  ·  ${domain}`,
      style: "minimal",
      color: "#F5E6C8",
      size: "x-small",
    },
    start: A5_START + 2.5,
    length: TOTAL - A5_START - 4.0,
    position: "center",
    offset: { x: 0, y: 0.12 },
    transition: { in: "fade", out: "fade" },
  } : null;

  // ── Assemble Tracks (bottom → top render order) ──────────────────────────────
  const vignetteTrack = buildVignetteTrack();
  const tracks = [
    buildPhotoTrack(),
    ...(vignetteTrack ? [vignetteTrack] : []),
    { clips: [presenterClip] },
    { clips: [openingTitle] },
    { clips: [exclusiveBadge] },
    ...(presenterBadge ? [{ clips: [presenterBadge] }] : []),
    { clips: [watermarkClip] },
    ...sellingPointClips.map((c) => ({ clips: [c] })),
    ...(closingCta ? [{ clips: [closingCta] }] : []),
    ...(closingDomain ? [{ clips: [closingDomain] }] : []),
  ];
  
  // Music URL: prefer caller-supplied URL (HeyGen auto-music) over static map key
  const MUSIC_VOLUME = 0.15; // voice sits cleanly on top
  const resolvedMusicUrl = musicUrl
    ?? (musicTrack && MUSIC_TRACK_URLS[musicTrack] ? MUSIC_TRACK_URLS[musicTrack] : null)
    ?? MUSIC_TRACK_URLS["luxury"]!;
  logger.info({ resolvedMusicUrl, volume: MUSIC_VOLUME }, "Shotstack soundtrack");
  const soundtrack = { src: resolvedMusicUrl, effect: "fadeInFadeOut", volume: MUSIC_VOLUME };

  const renderRes = await fetch(`${baseUrl}/render`, {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      timeline: { background: "#0d1117", soundtrack, tracks },
      output: { format: "mp4", resolution: testMode ? "sd" : "1080", fps: 30 },
    }),
  });

  if (!renderRes.ok) {
    const text = await renderRes.text();
    throw new Error(`Shotstack render submit failed (${renderRes.status}): ${text}`);
  }

  const renderData = (await renderRes.json()) as {
    success: boolean;
    response?: { id: string };
    message?: string;
  };

  if (!renderData.success || !renderData.response?.id) {
    throw new Error(`Shotstack did not return a render id: ${JSON.stringify(renderData)}`);
  }

  const renderId = renderData.response.id;
  const videoUrl = await pollUntilDone(renderId, apiKey, baseUrl, "Shotstack premium_luxury_v1");
  return { videoUrl, renderId };
}


/**
 * Compose a selfie (self-recorded) job video — 1080p 30fps.
 */
export async function composeSelfieVideo(
  agentVideoUrl: string,
  backgroundUrl?: string | null,
  narrationUrl?: string | null,
  musicTrack?: string | null,
  propertyTitle?: string | null,
  listingUrl?: string | null,
): Promise<ShotstackResult> {
  const { apiKey, baseUrl } = getShotstackConfig();

  const TOTAL_DURATION = 90;
  const subtitle = propertyTitle ?? "Property Listing";
  const domain = listingUrl
    ? (() => { try { return new URL(listingUrl).hostname.replace("www.", ""); } catch { return "lensflow.com.au"; } })()
    : "lensflow.com.au";

  const isVideoBackground = !!backgroundUrl && backgroundUrl.toLowerCase().includes(".mp4");

  logger.info(
    { agentVideoUrl, backgroundUrl: backgroundUrl ?? "(none)", narration: !!narrationUrl, musicTrack },
    "Composing selfie video via Shotstack",
  );

  const backgroundTrack = backgroundUrl
    ? { clips: [{ asset: isVideoBackground ? { type: "video", src: backgroundUrl, volume: 0 } : { type: "image", src: backgroundUrl }, start: 0, length: TOTAL_DURATION, fit: "cover", position: "center" }] }
    : { clips: [colourClip("#0d1117", 0, TOTAL_DURATION)] };

  const overlayTrack = { clips: [colourClip("#000000", 0, TOTAL_DURATION, 0.30)] };

  const agentTrack = { clips: [{ asset: { type: "video", src: agentVideoUrl, volume: 1 }, start: 0, length: TOTAL_DURATION, fit: "contain", scale: 0.75, position: "center", transition: { in: "fade", out: "fade" } }] };

  const narrationTrack = narrationUrl
    ? { clips: [{ asset: { type: "audio", src: narrationUrl, volume: 0.85 }, start: 0, length: TOTAL_DURATION }] }
    : null;

  const titleClip = { asset: { type: "title", text: subtitle, style: "future", color: "#F5E6C8", size: "medium" }, start: 1, length: 5, position: "bottomLeft", offset: { x: 0.04, y: 0.12 }, transition: { in: "slideRight", out: "fade" } };
  const watermarkClip = { asset: { type: "title", text: `lensflow.com.au  ·  ${domain}`, style: "minimal", color: "#C9962A", size: "x-small" }, start: 0, length: TOTAL_DURATION, position: "topRight", offset: { x: -0.02, y: -0.04 } };

  const musicUrl = musicTrack ? MUSIC_TRACK_URLS[musicTrack] : MUSIC_TRACK_URLS["uplifting"];
  const soundtrack = { src: musicUrl, effect: "fadeInFadeOut", volume: narrationUrl ? 0.12 : 0.35 };

  const tracks = [backgroundTrack, overlayTrack, agentTrack, ...(narrationTrack ? [narrationTrack] : []), { clips: [titleClip] }, { clips: [watermarkClip] }];

  const renderRes = await fetch(`${baseUrl}/render`, {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ timeline: { background: "#0d1117", soundtrack, tracks }, output: { format: "mp4", resolution: "1080", fps: 30 } }),
  });

  if (!renderRes.ok) throw new Error(`Shotstack selfie render submit failed (${renderRes.status}): ${await renderRes.text()}`);

  const renderData = (await renderRes.json()) as { success: boolean; response?: { id: string }; message?: string };
  if (!renderData.success || !renderData.response?.id) throw new Error(`Shotstack selfie did not return render id: ${JSON.stringify(renderData)}`);

  const renderId = renderData.response.id;
  const videoUrl = await pollUntilDone(renderId, apiKey, baseUrl, "Shotstack selfie");
  return { videoUrl, renderId };
}

/**
 * Compose a voice + photos video (no AI presenter) — 1080p 30fps.
 */
export async function composeVoicePhotosVideo(
  voiceoverUrl: string | null | undefined,
  propertyTitle?: string | null,
  listingUrl?: string | null,
  propertyImages?: string[] | null,
  musicTrack?: string | null,
  musicUrl?: string | null,
): Promise<ShotstackResult> {
  const { apiKey, baseUrl } = getShotstackConfig();

  const subtitle = propertyTitle ?? "Premium Property Listing";
  const domain = listingUrl
    ? (() => { try { return new URL(listingUrl).hostname.replace("www.", ""); } catch { return "lensflow.com.au"; } })()
    : "lensflow.com.au";

  const images = (propertyImages ?? []).filter(Boolean);
  const hasPhotos = images.length > 0;
  const PHOTO_DURATION = 6;
  const TOTAL_DURATION = 90;

  logger.info({ voiceoverUrl, subtitle, photoCount: images.length }, "Composing voice-photos video via Shotstack");

  const buildPhotoTrack = () => {
    if (!hasPhotos) return { clips: [colourClip("#0d1117", 0, TOTAL_DURATION)] };
    const effects = ["zoomIn", "zoomOut", "slideLeft", "slideRight"];
    const clips: object[] = [];
    let t = 0; let idx = 0;
    while (t < TOTAL_DURATION) {
      const src = images[idx % images.length];
      const dur = Math.min(PHOTO_DURATION, TOTAL_DURATION - t);
      clips.push({ asset: { type: "image", src }, start: t, length: dur, fit: "cover", scale: 1, effect: effects[idx % effects.length], transition: { in: idx === 0 ? "fade" : "wipeLeft", out: "fadeSlow" } });
      t += dur; idx++;
    }
    return { clips };
  };

  const vignetteTrack = hasPhotos ? { clips: [colourClip("#0d0a05", 0, TOTAL_DURATION, 0.28)] } : null;
  const voiceoverTrack = voiceoverUrl ? { clips: [{ asset: { type: "audio", src: voiceoverUrl, volume: 1 }, start: 0, length: TOTAL_DURATION }] } : null;

  const titleClip = { asset: { type: "title", text: subtitle, style: "future", color: "#FFFFFF", size: "large" }, start: 1, length: 6, position: "center", offset: { x: 0, y: 0.1 }, transition: { in: "fade", out: "fade" } };
  const ctaClip = { asset: { type: "title", text: "Book Your Inspection Today", style: "future", color: "#C9962A", size: "medium" }, start: TOTAL_DURATION - 8, length: 7, position: "center", offset: { x: 0, y: 0.1 }, transition: { in: "fade", out: "fade" } };
  const watermarkClip = { asset: { type: "title", text: `lensflow.com.au  ·  ${domain}`, style: "minimal", color: "#C9962A", size: "x-small" }, start: 0, length: TOTAL_DURATION, position: "topRight", offset: { x: -0.02, y: -0.04 } };

  const VOICE_PHOTOS_VOLUME = voiceoverUrl ? 0.15 : 0.45;
  const resolvedVPMusicUrl = musicUrl
    ?? (musicTrack && MUSIC_TRACK_URLS[musicTrack] ? MUSIC_TRACK_URLS[musicTrack] : null)
    ?? MUSIC_TRACK_URLS["uplifting"]!;
  logger.info({ resolvedVPMusicUrl, volume: VOICE_PHOTOS_VOLUME }, "Shotstack voice-photos soundtrack");
  const soundtrack = { src: resolvedVPMusicUrl, effect: "fadeInFadeOut", volume: VOICE_PHOTOS_VOLUME };

  const tracks = [buildPhotoTrack(), ...(vignetteTrack ? [vignetteTrack] : []), ...(voiceoverTrack ? [voiceoverTrack] : []), { clips: [titleClip] }, { clips: [ctaClip] }, { clips: [watermarkClip] }];

  const renderRes = await fetch(`${baseUrl}/render`, {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ timeline: { background: "#0d1117", soundtrack, tracks }, output: { format: "mp4", resolution: "1080", fps: 30 } }),
  });

  if (!renderRes.ok) throw new Error(`Shotstack voice-photos render submit failed (${renderRes.status}): ${await renderRes.text()}`);

  const renderData = (await renderRes.json()) as { success: boolean; response?: { id: string }; message?: string };
  if (!renderData.success || !renderData.response?.id) throw new Error(`Shotstack voice-photos did not return render id: ${JSON.stringify(renderData)}`);

  const renderId = renderData.response.id;
  const videoUrl = await pollUntilDone(renderId, apiKey, baseUrl, "Shotstack voice-photos");
  return { videoUrl, renderId };
}
