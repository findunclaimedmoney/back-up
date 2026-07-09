import { Router, type IRouter } from "express";
import { eq, desc, count, and, sql } from "drizzle-orm";
import { db, jobsTable, pipelineStepsTable, usersTable, creditTransactionsTable } from "@workspace/db";
import {
  CreateJobBody,
  GetJobParams,
  DeleteJobParams,
  SendJobToCrmBody,
  GenerateScriptBody,
  CreateSelfRecordedJobBody,
} from "@workspace/api-zod";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { randomUUID } from "crypto";
import { logger } from "../lib/logger";
import { generateVoiceover } from "./elevenlabs";
import { generateListingScript, extractHighlights, type ListingContext } from "../lib/generate-script";
import { selectAndFetchMusic } from "../lib/music";
import { parseListingUrl } from "../lib/parse-listing-url";
import { generatePresenterVideo, HeyGenTimeoutError } from "../lib/heygen";
import { generatePresenterVideoDID } from "../lib/did";
import { composePresenterVideoPremiumLuxuryV1, composeSelfieVideo, composeVoicePhotosVideo } from "../lib/shotstack";
import { ObjectStorageService } from "../lib/objectStorage";
import { scrapeListing } from "../lib/apify";
import { isDomainUrl, extractDomainListingId, fetchDomainListing, getSuburbPerformance } from "../lib/domain";
import { analysePropertyPhotos } from "../lib/analyse-photos";
import { enhancePropertyPhotos } from "../lib/enhance-photos";
import { upgradePropertyPhotos } from "../lib/pro-lens-upgrade";
import { rescuePropertyPhotos, type RoomRescueMode } from "../lib/ai-room-rescue";
import { getStreetViewImages } from "../lib/street-view";

const router: IRouter = Router();

const connectors = new ReplitConnectors();

const PIPELINE_STEPS_URL = [
  { name: "scrape_listing",  label: "Scrape Listing",       order: 1 },
  { name: "room_rescue",     label: "AI Room Rescue",       order: 2 },
  { name: "pro_lens_upgrade",label: "Pro Lens Upgrade",     order: 3 },
  { name: "enhance_photos",  label: "AI Photo Glow-up",     order: 4 },
  { name: "generate_script", label: "Generate Script",      order: 5 },
  { name: "create_voiceover",label: "Generate Voiceover",   order: 6 },
  { name: "presenter_video", label: "Generate Presenter",   order: 7 },
  { name: "compose_video",   label: "Final Video Render",   order: 8 },
];

const PIPELINE_STEPS_PHOTOS = [
  { name: "room_rescue",     label: "AI Room Rescue",       order: 1 },
  { name: "pro_lens_upgrade",label: "Pro Lens Upgrade",     order: 2 },
  { name: "enhance_photos",  label: "AI Photo Glow-up",     order: 3 },
  { name: "analyse_photos",  label: "Analyse Photos",       order: 4 },
  { name: "generate_script", label: "Generate Script",      order: 5 },
  { name: "create_voiceover",label: "Create Voiceover",     order: 6 },
  { name: "presenter_video", label: "Presenter Video",      order: 7 },
  { name: "compose_video",   label: "Compose Video",        order: 8 },
];

// Steps for "voice_photos" output type — no HeyGen presenter, Shotstack composes voice + slideshow
const PIPELINE_STEPS_URL_VOICE_PHOTOS = [
  { name: "scrape_listing",  label: "Scrape Listing",       order: 1 },
  { name: "room_rescue",     label: "AI Room Rescue",       order: 2 },
  { name: "pro_lens_upgrade",label: "Pro Lens Upgrade",     order: 3 },
  { name: "enhance_photos",  label: "AI Photo Glow-up",     order: 4 },
  { name: "generate_script", label: "Generate Script",      order: 5 },
  { name: "create_voiceover",label: "Create Voiceover",     order: 6 },
  { name: "compose_video",   label: "Compose Video",        order: 7 },
];

const PIPELINE_STEPS_PHOTOS_VOICE_PHOTOS = [
  { name: "room_rescue",     label: "AI Room Rescue",       order: 1 },
  { name: "pro_lens_upgrade",label: "Pro Lens Upgrade",     order: 2 },
  { name: "enhance_photos",  label: "AI Photo Glow-up",     order: 3 },
  { name: "analyse_photos",  label: "Analyse Photos",       order: 4 },
  { name: "generate_script", label: "Generate Script",      order: 5 },
  { name: "create_voiceover",label: "Create Voiceover",     order: 6 },
  { name: "compose_video",   label: "Compose Video",        order: 7 },
];

// Track in-progress simulations to prevent double-starts
const activeSimulations = new Set<string>();

// Step durations in ms — varied to feel realistic
const STEP_DURATIONS = [2200, 3100, 0, 3600, 2500]; // 0 = real ElevenLabs call

// Sample real estate script for voiceover (used when no real script yet)
function buildVoiceoverScript(listingUrl: string): string {
  try {
    const url = new URL(listingUrl);
    const domain = url.hostname.replace("www.", "");
    return `Welcome to this stunning property, listed exclusively on ${domain}. ` +
      `This exceptional home offers everything today's discerning buyer is looking for — ` +
      `spacious living areas, premium finishes, and an enviable location. ` +
      `From the moment you arrive, you'll appreciate the quality and attention to detail throughout. ` +
      `Whether you're entertaining guests in the open-plan living space or enjoying the tranquility of the outdoor areas, ` +
      `this property truly has it all. ` +
      `Don't miss this rare opportunity — contact us today to arrange your private inspection.`;
  } catch {
    return `Welcome to this exceptional property. ` +
      `This stunning home offers premium finishes, spacious living areas, and an unbeatable location. ` +
      `Featuring open-plan living, beautifully appointed bedrooms, and impressive outdoor entertaining. ` +
      `This is a rare opportunity you don't want to miss. ` +
      `Contact us today to arrange your private inspection.`;
  }
}

export async function runSimulation(jobId: string): Promise<void> {
  try {
    // Fetch job to get voice details
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));

    // Load the user's saved HeyGen digital-twin avatar (if any) — used for presenter_video step
    const [userSettings] = job.userId
      ? await db
          .select({ heygenAvatarId: usersTable.heygenAvatarId, heygenVoiceId: usersTable.heygenVoiceId })
          .from(usersTable)
          .where(eq(usersTable.id, job.userId))
      : [null];

    await db
      .update(jobsTable)
      .set({ status: "processing" })
      .where(eq(jobsTable.id, jobId));

    const steps = await db
      .select()
      .from(pipelineStepsTable)
      .where(eq(pipelineStepsTable.jobId, jobId))
      .orderBy(pipelineStepsTable.order);

    let generatedScript: string | null = null;
    let scriptHighlights: string[] = [];
    let presenterVideoUrl: string | null = null;
    let voiceoverPublicUrl: string | null = null;
    let finalVideoUrl: string | null = null;
    let scrapedImages: string[] = [];
    let selectedMusicUrl: string | null = null;
    const isVoicePhotos = job.outputType === "voice_photos";
    // Photos used by downstream steps (analysis, video). Starts as the originals
    // and is replaced by the AI-enhanced versions once the glow-up step runs.
    let effectivePhotos: string[] = job.propertyImages ?? [];
    const isPhotoMode = job.inputMode === "photos";
    const listingContext: ListingContext = parseListingUrl(job.listingUrl);
    listingContext.inputMode = isPhotoMode ? "photos" : "url";
    if (job.propertyAddress) listingContext.address = job.propertyAddress;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const baseDuration = STEP_DURATIONS[i] ?? 2500;

      await db
        .update(pipelineStepsTable)
        .set({ status: "running", startedAt: new Date() })
        .where(eq(pipelineStepsTable.id, step.id));

      let outputUrl: string | null = null;
      let outputData: string | null = null;
      // Set to true inside a step that manages its own DB completion (e.g. approval gate)
      let stepAlreadyCompleted = false;

      if (step.name === "room_rescue") {
        const mode: RoomRescueMode =
          job.roomRescueMode === "staging" ? "staging" : "declutter";
        const originals = job.propertyImages ?? [];
        try {
          logger.info({ jobId, count: originals.length, mode }, "AI Room Rescue: starting transformation");
          const { rescued, rescuedCount } = await rescuePropertyPhotos(originals, mode);

          await db.update(jobsTable)
            .set({ roomRescueImages: rescued, roomRescueCount: rescuedCount })
            .where(eq(jobsTable.id, jobId));

          if (rescuedCount > 0) {
            const modeLabel = mode === "staging" ? "Virtually staged" : "Decluttered";
            outputData = [
              `Photos ${modeLabel.toLowerCase()}: ${rescuedCount} of ${originals.length}`,
              `${modeLabel} — awaiting your approval before the video render.`,
              "Compliance: originals are preserved. No structural defects were altered.",
            ].join("\n");

            await db.update(pipelineStepsTable)
              .set({ status: "awaiting_approval", outputData, startedAt: new Date() })
              .where(eq(pipelineStepsTable.id, step.id));
            await db.update(jobsTable)
              .set({ status: "awaiting_approval" })
              .where(eq(jobsTable.id, jobId));

            logger.info({ jobId, rescuedCount, mode }, "AI Room Rescue: awaiting approval");

            const POLL_MS = 5_000;
            const DEADLINE = Date.now() + 30 * 60 * 1000;
            let decision: string | null = null;

            while (Date.now() < DEADLINE) {
              await new Promise((r) => setTimeout(r, POLL_MS));
              const [latest] = await db
                .select({ roomRescueApproved: jobsTable.roomRescueApproved })
                .from(jobsTable)
                .where(eq(jobsTable.id, jobId));
              if (latest?.roomRescueApproved) {
                decision = latest.roomRescueApproved;
                break;
              }
            }

            if (decision === "approved") {
              effectivePhotos = rescued;
              logger.info({ jobId, rescuedCount }, "AI Room Rescue approved — using transformed photos");
            } else {
              effectivePhotos = originals;
              logger.info({ jobId, decision: decision ?? "timeout" }, "AI Room Rescue not approved — using originals");
            }

            await db.update(jobsTable)
              .set({ status: "processing" })
              .where(eq(jobsTable.id, jobId));
            await db.update(pipelineStepsTable)
              .set({
                status: "complete",
                completedAt: new Date(),
                outputData: outputData + (decision === "approved" ? "\nApproved ✓" : "\nRejected — originals used."),
              })
              .where(eq(pipelineStepsTable.id, step.id));

            stepAlreadyCompleted = true;
          } else {
            effectivePhotos = originals;
            outputData = [
              `Photos checked: ${originals.length}`,
              "No transformation applied — original photos used.",
            ].join("\n");
            logger.info({ jobId, mode }, "AI Room Rescue: no images transformed — continuing with originals");
          }
        } catch (err) {
          logger.error({ err, jobId, mode }, "AI Room Rescue failed — continuing with originals");
          effectivePhotos = originals;
          outputData = "AI Room Rescue unavailable — original photos used.";
          await new Promise((r) => setTimeout(r, baseDuration));
        }
      } else if (step.name === "pro_lens_upgrade") {
        try {
          const originals = job.propertyImages ?? [];
          logger.info({ jobId, count: originals.length }, "Pro Lens Upgrade: starting photographic corrections");
          const { upgraded, upgradedCount } = await upgradePropertyPhotos(originals);

          await db.update(jobsTable)
            .set({ proLensImages: upgraded, proLensUpgradedCount: upgradedCount })
            .where(eq(jobsTable.id, jobId));

          if (upgradedCount > 0) {
            outputData = [
              `Photos upgraded: ${upgradedCount} of ${originals.length}`,
              "Professional lens corrections applied — awaiting your approval before video render.",
            ].join("\n");

            // Pause pipeline and wait for user approval decision
            await db.update(pipelineStepsTable)
              .set({ status: "awaiting_approval", outputData, startedAt: new Date() })
              .where(eq(pipelineStepsTable.id, step.id));
            await db.update(jobsTable)
              .set({ status: "awaiting_approval" })
              .where(eq(jobsTable.id, jobId));

            logger.info({ jobId, upgradedCount }, "Pro Lens Upgrade: awaiting approval");

            const POLL_MS = 5_000;
            const DEADLINE = Date.now() + 30 * 60 * 1000; // 30 min timeout
            let decision: string | null = null;

            while (Date.now() < DEADLINE) {
              await new Promise((r) => setTimeout(r, POLL_MS));
              const [latest] = await db
                .select({ proLensApproved: jobsTable.proLensApproved })
                .from(jobsTable)
                .where(eq(jobsTable.id, jobId));
              if (latest?.proLensApproved) {
                decision = latest.proLensApproved;
                break;
              }
            }

            if (decision === "approved") {
              effectivePhotos = upgraded;
              logger.info({ jobId, upgradedCount }, "Pro Lens Upgrade approved — using upgraded photos");
            } else {
              effectivePhotos = originals;
              logger.info({ jobId, decision: decision ?? "timeout" }, "Pro Lens Upgrade not approved — using originals");
            }

            // Resume pipeline
            await db.update(jobsTable)
              .set({ status: "processing" })
              .where(eq(jobsTable.id, jobId));

            await db.update(pipelineStepsTable)
              .set({
                status: "complete",
                completedAt: new Date(),
                outputData: outputData + (decision === "approved" ? "\nApproved ✓" : "\nRejected — originals used."),
              })
              .where(eq(pipelineStepsTable.id, step.id));

            stepAlreadyCompleted = true;
          } else {
            // Nothing upgraded — just continue with originals
            effectivePhotos = originals;
            outputData = [
              `Photos checked: ${originals.length}`,
              "No corrections applied — original photos used.",
            ].join("\n");
            logger.info({ jobId }, "Pro Lens Upgrade: no images upgraded — continuing with originals");
          }
        } catch (err) {
          logger.error({ err, jobId }, "Pro Lens Upgrade failed — continuing with originals");
          effectivePhotos = job.propertyImages ?? [];
          outputData = "Pro Lens Upgrade unavailable — original photos used.";
          await new Promise((r) => setTimeout(r, baseDuration));
        }
      } else if (step.name === "enhance_photos") {
        // AI "Glow-up" — relight / declutter / sky-replace each uploaded photo
        try {
          const originals = job.propertyImages ?? [];
          logger.info({ jobId, count: originals.length }, "Enhancing property photos with Gemini");
          const { enhanced, enhancedCount } = await enhancePropertyPhotos(originals);
          effectivePhotos = enhanced;
          await db.update(jobsTable)
            .set({ enhancedImages: enhanced })
            .where(eq(jobsTable.id, jobId));
          outputData = [
            `Photos enhanced: ${enhancedCount} of ${originals.length}`,
            enhancedCount > 0
              ? "AI relit, colour-balanced and decluttered your photos for a premium listing look."
              : "Enhancement unavailable — original photos used.",
          ].join("\n");
          logger.info({ jobId, enhancedCount }, "AI photo glow-up complete");
        } catch (err) {
          logger.error({ err, jobId }, "Photo enhancement failed — continuing with originals");
          effectivePhotos = job.propertyImages ?? [];
          // Persist the fallback so the UI shows the (un-enhanced) photos rather
          // than a perpetual "enhancing…" spinner or stale prior-run results.
          await db.update(jobsTable)
            .set({ enhancedImages: effectivePhotos })
            .where(eq(jobsTable.id, jobId));
          outputData = "Enhancement unavailable — original photos used.";
          await new Promise((resolve) => setTimeout(resolve, baseDuration));
        }
      } else if (step.name === "analyse_photos") {
        // Real Claude Vision analysis of agent-uploaded photos
        try {
          const photos = effectivePhotos.length > 0 ? effectivePhotos : (job.propertyImages ?? []);
          logger.info({ jobId, count: photos.length }, "Analysing property photos with Claude Vision");
          const analysis = await analysePropertyPhotos(photos, job.propertyAddress);

          Object.assign(listingContext, {
            summary: analysis.summary || listingContext.summary,
            propertyType: analysis.propertyType ?? listingContext.propertyType,
            bedrooms: analysis.bedrooms ?? listingContext.bedrooms,
            bathrooms: analysis.bathrooms ?? listingContext.bathrooms,
            features: analysis.features,
          });

          // Use the address as the listing title if we don't have one
          if (job.propertyAddress && !job.listingTitle) {
            await db.update(jobsTable)
              .set({ listingTitle: job.propertyAddress })
              .where(eq(jobsTable.id, jobId));
          }

          outputData = [
            analysis.summary ? `Summary: ${analysis.summary}` : null,
            job.propertyAddress ? `Address: ${job.propertyAddress}` : null,
            analysis.propertyType ? `Type: ${analysis.propertyType}` : null,
            analysis.bedrooms ? `Bedrooms: ${analysis.bedrooms}` : null,
            analysis.bathrooms ? `Bathrooms: ${analysis.bathrooms}` : null,
            analysis.features.length > 0 ? `Features: ${analysis.features.join(", ")}` : null,
            `Photos analysed: ${photos.length}`,
          ].filter(Boolean).join("\n");
          logger.info({ jobId, featureCount: analysis.features.length }, "Claude Vision analysis complete");
        } catch (err) {
          logger.error({ err, jobId }, "Photo analysis failed — continuing with address only");
          outputData = [
            job.propertyAddress ? `Address: ${job.propertyAddress}` : null,
            `Photos provided: ${(job.propertyImages ?? []).length}`,
            "Note: AI vision analysis was unavailable; script generated from address.",
          ].filter(Boolean).join("\n");
          await new Promise((resolve) => setTimeout(resolve, baseDuration));
        }
      } else if (step.name === "scrape_listing") {
        // Domain.com.au → official API; all other platforms → Apify scrape
        try {
          let apifyResult;
          if (isDomainUrl(job.listingUrl)) {
            const listingId = extractDomainListingId(job.listingUrl);
            if (!listingId) throw new Error(`Could not extract listing ID from Domain URL: ${job.listingUrl}`);
            logger.info({ jobId, listingId }, "Fetching listing from Domain.com.au API");
            apifyResult = await fetchDomainListing(listingId);
          } else {
            logger.info({ jobId, listingUrl: job.listingUrl }, "Scraping listing with Apify");
            apifyResult = await scrapeListing(job.listingUrl);
          }
          scrapedImages = apifyResult.images;

          // If agent uploaded manual photos, keep those — otherwise use scraped photos
          const hasManualPhotos = (job.propertyImages ?? []).length > 0;
          if (!hasManualPhotos && scrapedImages.length > 0) {
            await db.update(jobsTable)
              .set({ propertyImages: scrapedImages })
              .where(eq(jobsTable.id, jobId));
            // Reload job so downstream steps see the scraped images
            const [updated] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
            if (updated) {
              Object.assign(job, updated);
              effectivePhotos = job.propertyImages ?? [];
            }
            logger.info({ jobId, count: scrapedImages.length }, "Saved scraped property images to job");
          }

          // Merge Apify data into listingContext for script generation
          Object.assign(listingContext, {
            address: apifyResult.address,
            price: apifyResult.price,
            bathrooms: apifyResult.bathrooms,
            carSpaces: apifyResult.carSpaces,
            scrapedDescription: apifyResult.description,
            bedrooms: apifyResult.bedrooms?.toString() ?? listingContext.bedrooms,
            suburb: listingContext.suburb ?? (apifyResult.address?.split(",")[1]?.trim() ?? null),
          });

          // Fetch Google Street View shots for the property address (non-blocking)
          if (apifyResult.address) {
            try {
              const streetViewUrls = await getStreetViewImages(apifyResult.address);
              if (streetViewUrls.length > 0) {
                // Prepend street view as cinematic opening scenes before property photos
                const existingImages = job.propertyImages ?? [];
                const combined = [...streetViewUrls, ...existingImages.filter(u => !streetViewUrls.includes(u))];
                await db.update(jobsTable)
                  .set({ propertyImages: combined })
                  .where(eq(jobsTable.id, jobId));
                scrapedImages = combined;
                effectivePhotos = combined;
                logger.info({ jobId, streetViewCount: streetViewUrls.length, total: combined.length }, "Street View images prepended to photo set");
              }
            } catch (err) {
              logger.warn({ err, jobId }, "Street View fetch failed (non-critical) — continuing without");
            }
          }

          // Fetch live suburb market data from Domain API (non-blocking enrichment)
          const suburbForStats = listingContext.suburb;
          const stateForStats = listingContext.state;
          if (suburbForStats && stateForStats) {
            try {
              const propCategory = listingContext.propertyType?.toLowerCase().includes("unit")
                || listingContext.propertyType?.toLowerCase().includes("apartment")
                ? "unit" : "house";
              const stats = await getSuburbPerformance(suburbForStats, stateForStats, propCategory);
              if (stats) listingContext.suburbStats = stats;
            } catch (err) {
              logger.warn({ err, jobId }, "Suburb performance fetch failed (non-critical)");
            }
          }

          // Update listing title if we got a better one from Apify
          if (apifyResult.title && !job.listingTitle) {
            await db.update(jobsTable)
              .set({ listingTitle: apifyResult.title })
              .where(eq(jobsTable.id, jobId));
          }

          const scraped = [
            apifyResult.title ? `Title: ${apifyResult.title}` : listingContext.summary,
            apifyResult.address ? `Address: ${apifyResult.address}` : null,
            apifyResult.price ? `Price: ${apifyResult.price}` : null,
            apifyResult.bedrooms ? `Bedrooms: ${apifyResult.bedrooms}` : null,
            apifyResult.bathrooms ? `Bathrooms: ${apifyResult.bathrooms}` : null,
            apifyResult.carSpaces ? `Car spaces: ${apifyResult.carSpaces}` : null,
            `Platform: ${listingContext.platform}`,
            scrapedImages.length > 0
              ? `Photos found: ${scrapedImages.length}`
              : "⚠️ No photos found — paste the full listing URL (not a short/redirect link) to get property photos in your video",
          ].filter(Boolean).join("\n");
          outputData = scraped;
          logger.info({ jobId, imageCount: scrapedImages.length, hasManualPhotos }, "Apify scrape complete");
        } catch (err) {
          logger.warn({ err, jobId }, "Apify scrape failed — falling back to URL parsing");
          // Graceful fallback to URL metadata only
          const scraped = [
            listingContext.summary,
            listingContext.suburb ? `Suburb: ${listingContext.suburb}` : null,
            listingContext.state ? `State: ${listingContext.state}` : null,
            listingContext.propertyType ? `Type: ${listingContext.propertyType}` : null,
            listingContext.bedrooms ? `Bedrooms: ${listingContext.bedrooms}` : null,
            `Platform: ${listingContext.platform}`,
          ].filter(Boolean).join("\n");
          outputData = scraped;
          await new Promise((resolve) => setTimeout(resolve, baseDuration));
        }
      } else if (step.name === "generate_script") {
        // Real Anthropic call to generate a listing script
        try {
          logger.info({ jobId }, "Generating script with Anthropic");
          const result = await generateListingScript(job.listingUrl, listingContext, job.voiceName);
          outputData = result.script;
          generatedScript = result.script;
          scriptHighlights = extractHighlights(result.script);
          // Use AI title if available; else fall back to URL-parsed summary
          if (!result.title && listingContext.summary) {
            await db.update(jobsTable).set({ listingTitle: listingContext.summary }).where(eq(jobsTable.id, jobId));
          }
          // Update listing title on the job if we got one
          if (result.title) {
            await db
              .update(jobsTable)
              .set({ listingTitle: result.title })
              .where(eq(jobsTable.id, jobId));
          }

          // ── Auto-music selection (LF-AUTO-MUSIC-MOOD) ──────────────────────
          // Non-blocking: if this fails the pipeline continues with static fallback.
          try {
            const music = await selectAndFetchMusic(listingContext, result.script);
            selectedMusicUrl = music.trackUrl;
            logger.info(
              { jobId, mood: music.mood, trackId: music.trackId, trackName: music.trackName, provider: music.provider, volume: 0.15 },
              "Auto-music selection complete",
            );
            await db
              .update(jobsTable)
              .set({
                musicMood: music.mood,
                musicTrackId: music.trackId ?? undefined,
                musicTrackName: music.trackName ?? undefined,
                musicTrackUrl: music.trackUrl,
                musicProvider: music.provider,
              })
              .where(eq(jobsTable.id, jobId));
          } catch (musicErr) {
            logger.warn({ err: musicErr, jobId }, "Auto-music selection failed — compose_video will use static fallback");
          }
        } catch (err) {
          logger.error({ err, jobId }, "Script generation failed — continuing");
        }
        // Small delay to feel realistic regardless
        await new Promise((resolve) => setTimeout(resolve, 1200));
      } else if (step.name === "create_voiceover" && job?.voiceId) {
        // Real ElevenLabs call — use AI-generated script if available
        try {
          logger.info({ jobId, voiceId: job.voiceId }, "Generating voiceover with ElevenLabs");
          const script = generatedScript ?? buildVoiceoverScript(job.listingUrl);
          const audioBuffer = await generateVoiceover(script, job.voiceId);
          const base64 = audioBuffer.toString("base64");
          outputUrl = `data:audio/mpeg;base64,${base64}`;
          logger.info({ jobId, bytes: audioBuffer.length }, "ElevenLabs voiceover generated");
          // Always upload to object storage — Shotstack (voice_photos) and HeyGen (AI presenter) both need a public URL
          try {
            const storage = new ObjectStorageService();
            voiceoverPublicUrl = await storage.uploadPublicAudio(audioBuffer, `voiceovers/${jobId}.mp3`);
            logger.info({ jobId, voiceoverPublicUrl }, "Voiceover uploaded for HeyGen lip-sync");
          } catch (uploadErr) {
            logger.error({ err: uploadErr, jobId }, "Voiceover upload failed — will fall back to HeyGen TTS");
          }
        } catch (err) {
          logger.error({ err, jobId }, "ElevenLabs voiceover failed — continuing without audio");
        }
      } else if (step.name === "presenter_video") {
        if (isVoicePhotos) {
          // Voice + Photos output type — no HeyGen avatar needed, skip this step
          logger.info({ jobId }, "Skipping presenter_video — voice_photos output type");
          await new Promise((resolve) => setTimeout(resolve, baseDuration));
        } else {
          // AI Presenter — D-ID is primary; HeyGen is fallback
          const script = generatedScript ?? buildVoiceoverScript(job.listingUrl);
          try {
            logger.info({ jobId, voiceName: job.voiceName, usingAudioUrl: !!voiceoverPublicUrl }, "Generating presenter video with D-ID (primary)");
            const didResult = await generatePresenterVideoDID(script, {
              presenterName: job.voiceName ?? undefined,
              audioUrl: voiceoverPublicUrl ?? null,
              timeoutMs: 420_000, // clips take ~5 min; 7 min ceiling
            });
            // D-ID returns a pre-signed S3 URL that Shotstack cannot access.
            // Mirror the video to our own object storage so Shotstack gets a stable public URL.
            logger.info({ jobId, videoId: didResult.videoId }, "D-ID presenter video ready — mirroring to object storage");
            const didVideoRes = await fetch(didResult.videoUrl);
            if (!didVideoRes.ok) throw new Error(`Failed to fetch D-ID video for mirroring: ${didVideoRes.status}`);
            const didVideoBuffer = Buffer.from(await didVideoRes.arrayBuffer());
            const storageForDID = new ObjectStorageService();
            const mirroredUrl = await storageForDID.uploadPublicBuffer(didVideoBuffer, `presenter-videos/${jobId}.mp4`, "video/mp4");
            presenterVideoUrl = mirroredUrl;
            outputUrl = mirroredUrl;
            logger.info({ jobId, mirroredUrl }, "D-ID presenter video mirrored to storage");
          } catch (didErr) {
            const reason = didErr instanceof Error ? didErr.message : String(didErr);
            logger.warn({ jobId, reason }, "D-ID presenter video failed — switching to HeyGen fallback");
            try {
              const result = await generatePresenterVideo(
                script,
                job.voiceName,
                job.voiceId,
                userSettings?.heygenAvatarId ?? null,
                userSettings?.heygenVoiceId ?? null,
                600_000,
                voiceoverPublicUrl ?? null,
                job.lookId ?? null,
              );
              presenterVideoUrl = result.videoUrl;
              outputUrl = result.videoUrl;
              logger.info({ jobId, videoId: result.videoId }, "HeyGen fallback presenter video ready");
            } catch (heygenErr) {
              logger.error({ heygenErr, jobId }, "HeyGen fallback also failed — continuing without presenter video");
              await new Promise((resolve) => setTimeout(resolve, baseDuration));
            }
          }
        }
      } else if (step.name === "compose_video") {
        const photos = effectivePhotos.length > 0 ? effectivePhotos : (job.propertyImages ?? []);
        try {
          if (isVoicePhotos) {
            // Option B: voiceover narration over photo slideshow — no presenter clip
            logger.info({ jobId, voiceoverPublicUrl, musicUrl: selectedMusicUrl ?? "(static fallback)" }, "Composing voice-photos video with Shotstack");
            const result = await composeVoicePhotosVideo(
              voiceoverPublicUrl,
              job.listingTitle,
              job.listingUrl,
              photos,
              job.musicTrack,
              selectedMusicUrl,
            );
            outputUrl = result.videoUrl;
            finalVideoUrl = result.videoUrl;
            logger.info({ jobId, renderId: result.renderId }, "Shotstack voice-photos video ready");
          } else {
            // Option A: AI presenter clip composed over photo slideshow
            if (!presenterVideoUrl) throw new Error("No presenter video URL from presenter_video step");
            // testMode: dev jobs (userId=null) use 10s SD renders to keep credit cost low
            const shotstackTestMode = job.userId === null;
            logger.info({ jobId, presenterVideoUrl, testMode: shotstackTestMode, musicUrl: selectedMusicUrl ?? "(static fallback)" }, "Composing final video with Shotstack");
            const result = await composePresenterVideoPremiumLuxuryV1(
              presenterVideoUrl,
              job.listingTitle,
              job.listingUrl,
              photos,
              job.musicTrack,
              job.voiceName,
              shotstackTestMode,
              scriptHighlights.length > 0 ? scriptHighlights : null,
              selectedMusicUrl,
            );
            outputUrl = result.videoUrl;
            finalVideoUrl = result.videoUrl;
            logger.info({ jobId, renderId: result.renderId }, "Shotstack final video ready");
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          const isCreditsError = errMsg.includes("credits") || errMsg.includes("plan limits");
          const userFacingMsg = isCreditsError
            ? "⚠️ Shotstack credits depleted — top up at dashboard.shotstack.io/subscription then re-run this job."
            : errMsg;
          logger.error({ err, jobId }, "Shotstack compose failed — marking job failed");
          await db
            .update(pipelineStepsTable)
            .set({ status: "failed", completedAt: new Date(), outputData: userFacingMsg })
            .where(eq(pipelineStepsTable.id, step.id));
          await db
            .update(jobsTable)
            .set({ status: "failed" })
            .where(eq(jobsTable.id, jobId));
          return; // stop pipeline — never mark complete without a Shotstack URL
        }
      } else {
        // Fallback simulated step
        await new Promise((resolve) => setTimeout(resolve, baseDuration));
      }

      if (!stepAlreadyCompleted) {
        await db
          .update(pipelineStepsTable)
          .set({
            status: "complete",
            completedAt: new Date(),
            ...(outputUrl ? { outputUrl } : {}),
            ...(outputData ? { outputData } : {}),
          })
          .where(eq(pipelineStepsTable.id, step.id));
      }

      logger.info({ jobId, step: step.name, order: i + 1 }, "Pipeline step complete");
    }

    await db
      .update(jobsTable)
      .set({ status: "complete", ...(finalVideoUrl ? { videoUrl: finalVideoUrl } : {}) })
      .where(eq(jobsTable.id, jobId));

    logger.info({ jobId, hasVideo: !!finalVideoUrl }, "Pipeline complete");
  } catch (err) {
    logger.error({ err, jobId }, "Pipeline failed");
    await db
      .update(jobsTable)
      .set({ status: "failed" })
      .where(eq(jobsTable.id, jobId));
  } finally {
    activeSimulations.delete(jobId);
  }
}

router.get("/jobs", async (req, res): Promise<void> => {
  const userId = req.isAuthenticated() ? req.user.id : null;
  const jobs = await db
    .select()
    .from(jobsTable)
    .where(userId ? eq(jobsTable.userId, userId) : eq(jobsTable.userId, "__none__"))
    .orderBy(desc(jobsTable.createdAt));
  res.json(jobs);
});

router.post("/jobs", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const inputMode = parsed.data.inputMode === "photos" ? "photos" : "url";
  const enhancePhotos = parsed.data.enhancePhotos === true;
  const proLensUpgrade = (parsed.data as Record<string, unknown>).proLensUpgrade === true;
  const roomRescue = (parsed.data as Record<string, unknown>).roomRescue === true;
  const roomRescueMode = ((parsed.data as Record<string, unknown>).roomRescueMode as string) === "staging" ? "staging" : "declutter";
  const outputType = parsed.data.outputType === "voice_photos" ? "voice_photos" : "presenter";

  if (inputMode === "url" && !parsed.data.listingUrl?.trim()) {
    res.status(400).json({ error: "A listing URL is required for URL mode" });
    return;
  }
  if (inputMode === "photos" && (parsed.data.propertyImages ?? []).length === 0) {
    res.status(400).json({ error: "At least one property photo is required for photo mode" });
    return;
  }

  // Calculate credit cost based on features used
  const CREDIT_COSTS: Record<string, number> = {
    base: 10,
    voice_photos: 5,
    presenter_video: 15,
    enhance_photos: 8,
    pro_lens_upgrade: 10,
    room_rescue: 12,
  };
  let creditCost = CREDIT_COSTS.base;
  if (outputType === "voice_photos") creditCost += CREDIT_COSTS.voice_photos;
  else creditCost += CREDIT_COSTS.presenter_video;
  if (enhancePhotos) creditCost += CREDIT_COSTS.enhance_photos;
  if (proLensUpgrade) creditCost += CREDIT_COSTS.pro_lens_upgrade;
  if (roomRescue) creditCost += CREDIT_COSTS.room_rescue;

  // Deduct credits
  try {
    const userRows = await db
      .select({ creditBalance: usersTable.creditBalance })
      .from(usersTable)
      .where(eq(usersTable.id, req.user.id))
      .limit(1);
    const currentBalance = userRows[0]?.creditBalance ?? 0;
    if (currentBalance < creditCost) {
      res.status(402).json({ error: "Insufficient credits", balance: currentBalance, required: creditCost });
      return;
    }
    await db.transaction(async (tx) => {
      await tx
        .update(usersTable)
        .set({
          creditBalance: sql`${usersTable.creditBalance} - ${creditCost}`,
          creditLifetimeSpent: sql`${usersTable.creditLifetimeSpent} + ${creditCost}`,
        })
        .where(eq(usersTable.id, req.user.id));
      await tx.insert(creditTransactionsTable).values({
        userId: req.user.id,
        type: "spend",
        amount: -creditCost,
        description: `Campaign: ${parsed.data.listingUrl ? new URL(parsed.data.listingUrl).hostname : "property"}`,
      });
    });
  } catch (err) {
    logger.error({ err }, "credit deduction failed");
    res.status(500).json({ error: "Failed to deduct credits" });
    return;
  }

  const id = randomUUID();
  const [job] = await db
    .insert(jobsTable)
    .values({
      id,
      userId: req.user.id,
      listingUrl: parsed.data.listingUrl ?? "",
      voiceId: parsed.data.voiceId ?? null,
      voiceName: parsed.data.voiceName ?? null,
      propertyImages: parsed.data.propertyImages ?? [],
      inputMode,
      propertyAddress: parsed.data.propertyAddress ?? null,
      musicTrack: parsed.data.musicTrack ?? null,
      outputType,
      lookId: (parsed.data as Record<string, unknown>).lookId as string | null ?? null,
      roomRescueMode: roomRescue ? roomRescueMode : null,
      creditCost,
      status: "queued",
    })
    .returning();

  const basePipelineSteps =
    outputType === "voice_photos"
      ? inputMode === "photos"
        ? PIPELINE_STEPS_PHOTOS_VOICE_PHOTOS
        : PIPELINE_STEPS_URL_VOICE_PHOTOS
      : inputMode === "photos"
      ? PIPELINE_STEPS_PHOTOS
      : PIPELINE_STEPS_URL;

  const pipelineSteps = basePipelineSteps
    .filter((s) => enhancePhotos || s.name !== "enhance_photos")
    .filter((s) => proLensUpgrade || s.name !== "pro_lens_upgrade")
    .filter((s) => roomRescue || s.name !== "room_rescue")
    .map((s, i) => ({ ...s, order: i + 1 }));

  const stepRows = pipelineSteps.map((step) => ({
    id: randomUUID(),
    jobId: id,
    name: step.name,
    label: step.label,
    status: "pending",
    order: step.order,
  }));
  await db.insert(pipelineStepsTable).values(stepRows);

  res.status(201).json(job);
});

// Generate an AI listing script up front (for the teleprompter) without
// persisting a job or running the pipeline.
router.post("/jobs/generate-script", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = GenerateScriptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const inputMode = parsed.data.inputMode === "photos" ? "photos" : "url";
  const listingUrl = parsed.data.listingUrl?.trim() ?? "";
  const propertyImages = parsed.data.propertyImages ?? [];
  const propertyAddress = parsed.data.propertyAddress?.trim() || null;

  if (inputMode === "url" && !listingUrl) {
    res.status(400).json({ error: "A listing URL is required for URL mode" });
    return;
  }
  if (inputMode === "photos" && propertyImages.length === 0) {
    res.status(400).json({ error: "At least one property photo is required for photo mode" });
    return;
  }

  const listingContext: ListingContext = parseListingUrl(listingUrl);
  listingContext.inputMode = inputMode;
  if (propertyAddress) listingContext.address = propertyAddress;

  if (inputMode === "photos") {
    try {
      const analysis = await analysePropertyPhotos(propertyImages, propertyAddress);
      Object.assign(listingContext, {
        summary: analysis.summary || listingContext.summary,
        propertyType: analysis.propertyType ?? listingContext.propertyType,
        bedrooms: analysis.bedrooms ?? listingContext.bedrooms,
        bathrooms: analysis.bathrooms ?? listingContext.bathrooms,
        features: analysis.features,
      });
    } catch (err) {
      req.log.warn({ err }, "Photo analysis failed during generate-script — using URL context only");
    }
  }

  const result = await generateListingScript(listingUrl, listingContext, parsed.data.voiceName);
  res.json({ script: result.script, title: result.title });
});

// Save an agent's self-recorded video and compose a final video via Shotstack.
// The job is created immediately (status "queued"), the response is returned,
// and composition runs in the background: optional ElevenLabs narration →
// Shotstack (background + agent PiP + narration + music) → job marked "complete".
router.post("/jobs/self-recorded", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateSelfRecordedJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const videoUrl = parsed.data.videoUrl?.trim();
  const script = parsed.data.script?.trim();
  if (!videoUrl || !script) {
    res.status(400).json({ error: "A recorded videoUrl and script are required" });
    return;
  }

  // The video must be one we issued an upload URL for — reject arbitrary/external
  // URLs so callers can't persist links to anything other than our storage.
  let parsedVideoUrl: URL;
  try {
    parsedVideoUrl = new URL(videoUrl);
  } catch {
    res.status(400).json({ error: "videoUrl must be a valid URL" });
    return;
  }
  if (!parsedVideoUrl.pathname.includes("/api/storage/")) {
    res.status(400).json({ error: "videoUrl must reference an uploaded recording" });
    return;
  }

  const listingUrl = parsed.data.listingUrl?.trim() ?? "";
  const propertyAddress = parsed.data.propertyAddress?.trim() || null;
  const title =
    parsed.data.title?.trim() || propertyAddress || "Self-recorded listing video";
  const voiceId = parsed.data.voiceId?.trim() || null;
  const voiceName = parsed.data.voiceName?.trim() || null;
  const musicTrack = parsed.data.musicTrack?.trim() || null;
  const backgroundImageUrl = parsed.data.backgroundImageUrl?.trim() || null;

  const id = randomUUID();
  const [job] = await db
    .insert(jobsTable)
    .values({
      id,
      userId: req.user.id,
      listingUrl,
      listingTitle: title,
      videoUrl,
      propertyImages: parsed.data.propertyImages ?? [],
      inputMode: "selfie",
      propertyAddress,
      voiceId,
      voiceName,
      musicTrack,
      backgroundImageUrl,
      status: "queued",
    })
    .returning();

  const now = new Date();
  await db.insert(pipelineStepsTable).values({
    id: randomUUID(),
    jobId: id,
    name: "generate_script",
    label: "Your Script",
    status: "complete",
    order: 1,
    startedAt: now,
    completedAt: now,
    outputData: script,
  });

  // Respond immediately — Shotstack composition runs in the background.
  res.status(201).json(job);

  // ── Async Shotstack composition ──────────────────────────────────────────
  setImmediate(async () => {
    try {
      logger.info({ jobId: id, backgroundImageUrl, voiceId, musicTrack }, "Starting selfie composition");
      await db.update(jobsTable).set({ status: "processing" }).where(eq(jobsTable.id, id));

      // Step 1: Optional ElevenLabs narration of the script
      let narrationUrl: string | null = null;
      if (voiceId && script) {
        try {
          logger.info({ jobId: id, voiceId }, "Generating selfie script narration");
          const audioBuffer = await generateVoiceover(script, voiceId);

          const storageService = new ObjectStorageService();
          const uploadURL = await storageService.getObjectEntityUploadURL();
          const objectPath = storageService.normalizeObjectEntityPath(uploadURL);

          await fetch(uploadURL, {
            method: "PUT",
            body: audioBuffer,
            headers: { "Content-Type": "audio/mpeg" },
          });

          const prodDomain = (process.env.REPLIT_DOMAINS ?? "").split(",")[0]?.trim();
          if (prodDomain) {
            narrationUrl = `https://${prodDomain}/api/storage${objectPath}`;
            logger.info({ jobId: id, narrationUrl }, "Narration uploaded to storage");
          }
        } catch (err) {
          logger.warn({ err, jobId: id }, "Narration generation failed — composing without audio");
        }
      }

      // Step 2: Shotstack composition — background fills frame, agent video PiP
      const result = await composeSelfieVideo(
        videoUrl,
        backgroundImageUrl,
        narrationUrl,
        musicTrack,
        title,
        listingUrl || null,
      );

      await db.update(jobsTable).set({
        status: "complete",
        videoUrl: result.videoUrl,
      }).where(eq(jobsTable.id, id));

      logger.info({ jobId: id, videoUrl: result.videoUrl }, "Selfie job composition complete");
    } catch (err) {
      logger.error({ err, jobId: id }, "Selfie composition failed");
      await db.update(jobsTable)
        .set({ status: "failed" })
        .where(eq(jobsTable.id, id));
    }
  });
});

router.get("/jobs/stats", async (req, res): Promise<void> => {
  const userId = req.isAuthenticated() ? req.user.id : null;
  const whereClause = userId ? eq(jobsTable.userId, userId) : eq(jobsTable.userId, "__none__");

  const statsRows = await db
    .select({
      status: jobsTable.status,
      count: count(),
    })
    .from(jobsTable)
    .where(whereClause)
    .groupBy(jobsTable.status);

  const stats = { total: 0, queued: 0, processing: 0, complete: 0, failed: 0 };
  for (const row of statsRows) {
    const n = Number(row.count);
    stats.total += n;
    if (row.status === "queued") stats.queued = n;
    else if (row.status === "processing") stats.processing = n;
    else if (row.status === "complete") stats.complete = n;
    else if (row.status === "failed") stats.failed = n;
  }

  const recentJobs = await db
    .select()
    .from(jobsTable)
    .where(whereClause)
    .orderBy(desc(jobsTable.createdAt))
    .limit(5);

  // Count completed script generation steps (= scripts generated)
  const scriptRows = await db
    .select({ count: count() })
    .from(pipelineStepsTable)
    .innerJoin(jobsTable, eq(pipelineStepsTable.jobId, jobsTable.id))
    .where(
      and(
        eq(pipelineStepsTable.name, "generate_script"),
        eq(pipelineStepsTable.status, "complete"),
        userId ? eq(jobsTable.userId, userId) : eq(jobsTable.userId, "__none__"),
      )
    );
  const scriptsGenerated = Number(scriptRows[0]?.count ?? 0);

  // Estimate time saved: each complete video saves ~4 hours vs manual filming/editing
  const timeSavedHours = stats.complete * 4;

  res.json({ ...stats, recentJobs, scriptsGenerated, timeSavedHours });
});

router.post("/jobs/:id/simulate", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [job] = await db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.id, raw), eq(jobsTable.userId, req.user.id)));

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  if (activeSimulations.has(raw)) {
    res.status(400).json({ error: "Simulation already in progress for this job" });
    return;
  }

  if (job.status === "processing") {
    res.status(400).json({ error: "Job is already processing" });
    return;
  }

  if (job.status === "complete" || job.status === "failed" || job.status === "awaiting_approval") {
    await db
      .update(pipelineStepsTable)
      .set({ status: "pending", startedAt: null, completedAt: null, errorMessage: null, outputUrl: null })
      .where(eq(pipelineStepsTable.jobId, raw));
    await db
      .update(jobsTable)
      .set({
        status: "queued",
        enhancedImages: [],
        proLensImages: [], proLensUpgradedCount: 0, proLensApproved: null,
        roomRescueImages: [], roomRescueCount: 0, roomRescueApproved: null,
      })
      .where(eq(jobsTable.id, raw));
  }

  activeSimulations.add(raw);
  runSimulation(raw);
  res.json({ message: "Simulation started", jobId: raw });
});

// ── AI Room Rescue — approve / reject ────────────────────────────────────────

router.post("/jobs/:id/approve-room-rescue", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [job] = await db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.id, raw), eq(jobsTable.userId, req.user.id)));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  await db
    .update(jobsTable)
    .set({ roomRescueApproved: "approved" })
    .where(eq(jobsTable.id, raw));
  logger.info({ jobId: raw }, "AI Room Rescue: approved by user");
  res.json({ message: "Room Rescue approved — pipeline will continue with transformed photos." });
});

router.post("/jobs/:id/reject-room-rescue", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [job] = await db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.id, raw), eq(jobsTable.userId, req.user.id)));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  await db
    .update(jobsTable)
    .set({ roomRescueApproved: "rejected" })
    .where(eq(jobsTable.id, raw));
  logger.info({ jobId: raw }, "AI Room Rescue: rejected by user — will use originals");
  res.json({ message: "Room Rescue rejected — pipeline will continue with original photos." });
});

// ── Pro Lens Upgrade — approve / reject ──────────────────────────────────────

router.post("/jobs/:id/approve-upgrade", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [job] = await db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.id, raw), eq(jobsTable.userId, req.user.id)));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  await db
    .update(jobsTable)
    .set({ proLensApproved: "approved" })
    .where(eq(jobsTable.id, raw));
  logger.info({ jobId: raw }, "Pro Lens Upgrade: approved by user");
  res.json({ message: "Upgrade approved — pipeline will continue with corrected photos." });
});

router.post("/jobs/:id/reject-upgrade", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [job] = await db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.id, raw), eq(jobsTable.userId, req.user.id)));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  await db
    .update(jobsTable)
    .set({ proLensApproved: "rejected" })
    .where(eq(jobsTable.id, raw));
  logger.info({ jobId: raw }, "Pro Lens Upgrade: rejected by user — will use originals");
  res.json({ message: "Upgrade rejected — pipeline will continue with original photos." });
});

// ── Matterport Lite ───────────────────────────────────────────────────────────
// Extract Space ID from any Matterport share URL or accept a raw ID directly
function parseMatterportSpaceId(input: string): string | null {
  const trimmed = input.trim();
  // Raw space ID: alphanumeric, 10-12 chars (e.g. SxQL3iGyvW7)
  if (/^[A-Za-z0-9]{8,16}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    // https://my.matterport.com/show/?m=SPACE_ID
    const m = url.searchParams.get("m");
    if (m && /^[A-Za-z0-9]{8,16}$/.test(m)) return m;
    // https://matterport.com/3d-models/SPACE_ID or similar path-based URLs
    const pathParts = url.pathname.split("/").filter(Boolean);
    const last = pathParts[pathParts.length - 1];
    if (last && /^[A-Za-z0-9]{8,16}$/.test(last)) return last;
  } catch {
    // Not a URL
  }
  return null;
}

router.patch("/jobs/:id/matterport", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const input = (req.body?.matterportUrl ?? "").toString().trim();

  if (!input) {
    res.status(400).json({ error: "matterportUrl is required" });
    return;
  }

  const spaceId = parseMatterportSpaceId(input);
  if (!spaceId) {
    res.status(400).json({ error: "Could not extract a valid Matterport Space ID from the URL provided. Paste the full share link (my.matterport.com/show/?m=…) or the Space ID directly." });
    return;
  }

  const [job] = await db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.id, raw), eq(jobsTable.userId, req.user.id)));

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const matterportUrl = `https://my.matterport.com/show/?m=${spaceId}`;
  const embedUrl = `https://my.matterport.com/show/?m=${spaceId}&play=1&qs=1&brand=0`;

  await db
    .update(jobsTable)
    .set({ matterportUrl })
    .where(eq(jobsTable.id, raw));

  logger.info({ jobId: raw, spaceId }, "Matterport tour attached to job");
  res.json({ spaceId, embedUrl, matterportUrl });
});

router.post("/jobs/:id/send-to-crm", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const bodyParsed = SendJobToCrmBody.safeParse(req.body ?? {});
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [job] = await db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.id, raw), eq(jobsTable.userId, req.user.id)));

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  if (job.status !== "complete") {
    res.status(400).json({ error: "Job must be complete before sending to CRM" });
    return;
  }

  const videoUrl = job.videoUrl ?? "";
  const title = job.listingTitle || job.propertyAddress || job.listingUrl || "Property listing";
  const email = bodyParsed.data.email || req.user.email || null;

  const noteBody = [
    `🎬 LensFlow AI video ready: ${title}`,
    videoUrl ? `Video: ${videoUrl}` : "Video link unavailable",
    job.listingUrl ? `Listing: ${job.listingUrl}` : null,
    job.propertyAddress ? `Address: ${job.propertyAddress}` : null,
  ].filter(Boolean).join("\n");

  try {
    let contactId: string | null = null;
    if (email) {
      const searchRes = await connectors.proxy("hubspot", "/crm/v3/objects/contacts/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }],
        }),
      });
      if (searchRes.ok) {
        const searchData = (await searchRes.json()) as { results?: Array<{ id: string }> };
        contactId = searchData.results?.[0]?.id ?? null;
      } else {
        logger.warn(
          { jobId: raw, status: searchRes.status },
          "HubSpot contact search failed — will attempt to create contact",
        );
      }

      if (!contactId) {
        const createRes = await connectors.proxy("hubspot", "/crm/v3/objects/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            properties: { email, lifecyclestage: "lead", lead_source: "LensFlow Pipeline" },
          }),
        });
        if (createRes.ok) {
          const created = (await createRes.json()) as { id?: string };
          contactId = created.id ?? null;
        } else {
          logger.warn(
            { jobId: raw, status: createRes.status },
            "HubSpot contact create failed — note will be logged without association",
          );
        }
      }
    }

    const noteRes = await connectors.proxy("hubspot", "/crm/v3/objects/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        properties: {
          hs_note_body: noteBody,
          hs_timestamp: Date.now(),
        },
        ...(contactId
          ? {
              associations: [
                {
                  to: { id: contactId },
                  types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }],
                },
              ],
            }
          : {}),
      }),
    });

    if (!noteRes.ok) {
      const errText = await noteRes.text();
      throw new Error(`HubSpot note creation failed: ${noteRes.status} ${errText}`);
    }

    logger.info({ jobId: raw, contactId, hasEmail: !!email }, "Job video sent to HubSpot CRM");
    res.json({
      success: true,
      message: contactId
        ? `Video sent to HubSpot and linked to ${email}.`
        : "Video logged in HubSpot as a note.",
    });
  } catch (err) {
    logger.error({ err, jobId: raw }, "Failed to send job to HubSpot CRM");
    res.status(502).json({ success: false, message: "Could not reach HubSpot. Please try again." });
  }
});

router.get("/jobs/:id", async (req, res): Promise<void> => {
  const params = GetJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [job] = await db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.id, raw), eq(jobsTable.userId, req.user.id)));

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const steps = await db
    .select()
    .from(pipelineStepsTable)
    .where(eq(pipelineStepsTable.jobId, raw))
    .orderBy(pipelineStepsTable.order);

  res.json({ ...job, steps });
});

router.delete("/jobs/:id", async (req, res): Promise<void> => {
  const params = DeleteJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [job] = await db
    .delete(jobsTable)
    .where(and(eq(jobsTable.id, raw), eq(jobsTable.userId, req.user.id)))
    .returning();

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
