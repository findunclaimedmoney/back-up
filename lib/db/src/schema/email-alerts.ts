import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const emailAlertsTable = pgTable("email_alerts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  state: text("state"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEmailAlertSchema = createInsertSchema(emailAlertsTable).omit({
  id: true,
  active: true,
  createdAt: true,
});

export type InsertEmailAlert = z.infer<typeof insertEmailAlertSchema>;
export type EmailAlert = typeof emailAlertsTable.$inferSelect;
