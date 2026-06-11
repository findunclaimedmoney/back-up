import { pgTable, serial, text, date, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "searching",
  "found",
  "not_found",
  "paid",
  "completed",
]);

export const searchSubmissionsTable = pgTable("search_submissions", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  dob: date("dob").notNull(),
  addressLine: text("address_line").notNull(),
  suburb: text("suburb").notNull(),
  state: text("state").notNull(),
  postcode: text("postcode").notNull(),
  status: submissionStatusEnum("status").notNull().default("pending"),
  foundAmount: numeric("found_amount", { precision: 12, scale: 2 }),
  feeCharged: numeric("fee_charged", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSearchSubmissionSchema = createInsertSchema(searchSubmissionsTable).omit({
  id: true,
  status: true,
  foundAmount: true,
  feeCharged: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSearchSubmission = z.infer<typeof insertSearchSubmissionSchema>;
export type SearchSubmission = typeof searchSubmissionsTable.$inferSelect;
