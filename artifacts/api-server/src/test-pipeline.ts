import { db, jobsTable, pipelineStepsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { runSimulation } from "./routes/jobs";

const TEST_USER_ID = "test-runner-02";

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

async function seedTestUser() {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, TEST_USER_ID)).limit(1);
  if (existing) {
    await db.update(usersTable).set({ creditBalance: 1000 }).where(eq(usersTable.id, TEST_USER_ID));
    return;
  }
  await db.insert(usersTable).values({
    id: TEST_USER_ID, email: "test2@lensflow.local", displayName: "Tester",
    replitId: "test-runner", creditBalance: 1000, creditLifetimeSpent: 0,
    createdAt: new Date(), updatedAt: new Date(),
  });
}

async function createTestJob() {
  const jobId = crypto.randomUUID();
  // userId = null triggers testMode=true in Shotstack (SD render, cheaper)
  const [job] = await db.insert(jobsTable).values({
    id: jobId,
    userId: null,
    listingUrl: "https://www.realestate.com.au/property-house-nsw-sydney-123456",
    listingTitle: "Stunning 4-Bedroom Family Home — Sydney",
    status: "queued",
    voiceId: "x3PfG9wL6FOEApZ1VJ9H",
    voiceName: "Mia",
    inputMode: "url",
    outputType: "presenter",
    creditCost: 33,
  }).returning();

  await db.insert(pipelineStepsTable).values(
    PIPELINE_STEPS_URL.map((s) => ({
      id: crypto.randomUUID(), jobId, name: s.name, label: s.label, order: s.order, status: "pending" as const,
    }))
  );
  return job;
}

async function main() {
  await seedTestUser();
  const job = await createTestJob();
  console.log(`Job: ${job.id} (userId=null → testMode=true)`);
  console.log("Running pipeline...\n");
  await runSimulation(job.id);

  const [finished] = await db.select().from(jobsTable).where(eq(jobsTable.id, job.id)).limit(1);
  console.log(`\nStatus: ${finished.status}`);
  console.log(`Video:  ${finished.videoUrl ?? "(none)"}`);

  const steps = await db.select().from(pipelineStepsTable).where(eq(pipelineStepsTable.jobId, job.id)).orderBy(pipelineStepsTable.order);
  for (const s of steps) {
    const mark = s.status === "complete" ? "✅" : s.status === "failed" ? "❌" : "⏳";
    console.log(`${mark} ${s.label} — ${s.status}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
