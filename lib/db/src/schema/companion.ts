import { boolean, integer, pgTable, primaryKey, serial, text, timestamp } from "drizzle-orm/pg-core";

export const companionSubscribersTable = pgTable("companion_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  tier: text("tier").notNull().default("spark"),
  active: boolean("active").notNull().default(true),
  voiceMessagesThisMonth: integer("voice_messages_this_month").notNull().default(0),
  voiceMonthResetAt: timestamp("voice_month_reset_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const companionSessionsTable = pgTable("companion_sessions", {
  sessionId: text("session_id").primaryKey(),
  persona: text("persona").notNull().default("mia"),
  messageCount: integer("message_count").notNull().default(0),
  summary: text("summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const companionOutfitsTable = pgTable(
  "companion_outfits",
  {
    sessionId: text("session_id").notNull(),
    outfitId: text("outfit_id").notNull(),
    portraitBase64: text("portrait_base64").notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.sessionId, table.outfitId] })],
);

export const companionFactsTable = pgTable(
  "companion_facts",
  {
    sessionId: text("session_id").notNull(),
    factKey: text("fact_key").notNull(),
    factValue: text("fact_value").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.sessionId, table.factKey] })],
);

export type CompanionSubscriber = typeof companionSubscribersTable.$inferSelect;
export type CompanionSession = typeof companionSessionsTable.$inferSelect;
export type CompanionOutfit = typeof companionOutfitsTable.$inferSelect;
export type CompanionFact = typeof companionFactsTable.$inferSelect;
