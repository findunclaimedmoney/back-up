import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobsTable = pgTable("jobs", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  listingUrl: text("listing_url").notNull().default(""),
  listingTitle: text("listing_title"),
  status: text("status").notNull().default("queued"),
  videoUrl: text("video_url"),
  voiceId: text("voice_id"),
  voiceName: text("voice_name"),
  propertyImages: jsonb("property_images").$type<string[]>().default([]),
  enhancedImages: jsonb("enhanced_images").$type<string[]>().default([]),
  inputMode: text("input_mode").default("url"),
  propertyAddress: text("property_address"),
  musicTrack: text("music_track"),
  backgroundImageUrl: text("background_image_url"),
  // "presenter" = AI avatar video; "voice_photos" = voiceover + photo slideshow only
  outputType: text("output_type").default("presenter"),
  // Optional HeyGen look ID — overrides the presenter default avatar with a specific outfit/look
  lookId: text("look_id"),
  // Matterport Lite: agent pastes share URL → embedded 3D tour on campaign reveal page
  matterportUrl: text("matterport_url"),
  // Auto-music metadata — set by LF-AUTO-MUSIC-MOOD during pipeline
  musicMood: text("music_mood"),
  musicTrackId: text("music_track_id"),
  musicTrackName: text("music_track_name"),
  musicTrackUrl: text("music_track_url"),
  musicProvider: text("music_provider"),
  // Pro Lens Upgrade — photographic corrections (LF-PRO-LENS-UPGRADE)
  proLensImages: jsonb("pro_lens_images").$type<string[]>().default([]),
  proLensUpgradedCount: integer("pro_lens_upgraded_count").default(0),
  // null = awaiting decision, "approved" = use upgraded, "rejected" = use originals
  proLensApproved: text("pro_lens_approved"),
  // AI Room Rescue — compliance-safe declutter / virtual staging (LF-AI-ROOM-RESCUE)
  roomRescueImages: jsonb("room_rescue_images").$type<string[]>().default([]),
  // "declutter" | "staging"
  roomRescueMode: text("room_rescue_mode"),
  roomRescueCount: integer("room_rescue_count").default(0),
  // null = awaiting decision, "approved" = use rescued, "rejected" = use originals
  roomRescueApproved: text("room_rescue_approved"),
  // Credit cost — how many credits were deducted for this job
  creditCost: integer("credit_cost").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({ createdAt: true, updatedAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;

export const pipelineStepsTable = pgTable("pipeline_steps", {
  id: text("id").primaryKey(),
  jobId: text("job_id").notNull().references(() => jobsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  label: text("label").notNull(),
  status: text("status").notNull().default("pending"),
  order: integer("order").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  outputUrl: text("output_url"),
  outputData: text("output_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPipelineStepSchema = createInsertSchema(pipelineStepsTable).omit({ createdAt: true });
export type InsertPipelineStep = z.infer<typeof insertPipelineStepSchema>;
export type PipelineStep = typeof pipelineStepsTable.$inferSelect;
