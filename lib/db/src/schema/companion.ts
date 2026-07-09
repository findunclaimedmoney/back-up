import { sql } from "drizzle-orm";
  import { index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

  export const companionSessionsTable = pgTable("companion_sessions", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: varchar("session_id").notNull().unique(),
    userId: varchar("user_id"),
    persona: varchar("persona").notNull().default("mia"),
    messageCount: integer("message_count").default(0),
    summary: text("summary"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  }, (table) => [index("IDX_companion_session_user").on(table.userId), index("IDX_companion_session_sid").on(table.sessionId)]);

  export const companionFactsTable = pgTable("companion_facts", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: varchar("session_id").notNull(),
    factKey: varchar("fact_key").notNull(),
    factValue: text("fact_value").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  }, (table) => [index("IDX_companion_fact_session").on(table.sessionId)]);

  export const companionOutfitsTable = pgTable("companion_outfits", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: varchar("session_id").notNull(),
    outfitId: varchar("outfit_id").notNull(),
    portraitBase64: text("portrait_base64"),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  }, (table) => [index("IDX_companion_outfit_session").on(table.sessionId)]);

  export const companionMessagesTable = pgTable("companion_messages", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: varchar("session_id").notNull(),
    role: varchar("role").notNull(), // 'user' | 'assistant'
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  }, (table) => [index("IDX_companion_msg_session").on(table.sessionId)]);

  export type CompanionSession = typeof companionSessionsTable.$inferSelect;
  export type CompanionFact = typeof companionFactsTable.$inferSelect;
  export type CompanionOutfit = typeof companionOutfitsTable.$inferSelect;
  export type CompanionMessage = typeof companionMessagesTable.$inferSelect;
  