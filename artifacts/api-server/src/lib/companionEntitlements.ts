import { eq, sql } from "drizzle-orm";
import { db, companionSubscribersTable, type CompanionSubscriber } from "@workspace/db";

export type CompanionTier = "free" | "spark" | "flame";

export interface CompanionEntitlements {
  tier: CompanionTier;
  active: boolean;
  /** Max voice replies per billing month, or null when unlimited. */
  voiceLimit: number | null;
  /** Voice replies left this month, or null when unlimited. */
  voiceRemaining: number | null;
  /** How many days of prior-session memory (facts/summary) may be surfaced in chat context. */
  memoryDays: number;
  canCustomPersona: boolean;
  canVideoCall: boolean;
}

const VOICE_LIMITS: Record<CompanionTier, number | null> = {
  free: 0,
  spark: 200,
  flame: null,
};

// Free tier is session-memory-only (no cross-session recall). Flame is effectively unlimited.
const MEMORY_DAYS: Record<CompanionTier, number> = {
  free: 0,
  spark: 30,
  flame: 3650,
};

const MS_PER_DAY = 86_400_000;

function normalizeTier(tier: string): CompanionTier {
  return tier === "spark" || tier === "flame" ? tier : "free";
}

function needsVoiceReset(subscriber: CompanionSubscriber): boolean {
  return !!subscriber.voiceMonthResetAt && Date.now() >= subscriber.voiceMonthResetAt.getTime();
}

/**
 * Looks up a companion subscriber by email. If their monthly voice-usage window has
 * elapsed (safety net in case the Stripe `invoice.paid` webhook hasn't fired yet),
 * resets the counter here too.
 */
export async function getSubscriberByEmail(email: string): Promise<CompanionSubscriber | undefined> {
  const normalized = email.toLowerCase().trim();
  const [row] = await db
    .select()
    .from(companionSubscribersTable)
    .where(eq(companionSubscribersTable.email, normalized))
    .limit(1);

  if (!row) return undefined;
  if (!needsVoiceReset(row)) return row;

  const [updated] = await db
    .update(companionSubscribersTable)
    .set({ voiceMessagesThisMonth: 0, voiceMonthResetAt: new Date(Date.now() + 30 * MS_PER_DAY) })
    .where(eq(companionSubscribersTable.id, row.id))
    .returning();

  return updated ?? row;
}

export function computeEntitlements(subscriber: CompanionSubscriber | undefined): CompanionEntitlements {
  const active = subscriber?.active ?? false;
  const tier = active ? normalizeTier(subscriber!.tier) : "free";
  const voiceLimit = VOICE_LIMITS[tier];
  const voiceRemaining =
    voiceLimit === null ? null : Math.max(0, voiceLimit - (subscriber?.voiceMessagesThisMonth ?? 0));

  return {
    tier,
    active,
    voiceLimit,
    voiceRemaining,
    memoryDays: MEMORY_DAYS[tier],
    canCustomPersona: active,
    canVideoCall: active && tier === "flame",
  };
}

export function canUseVoiceNow(entitlements: CompanionEntitlements): boolean {
  if (!entitlements.active) return false;
  return entitlements.voiceLimit === null || (entitlements.voiceRemaining ?? 0) > 0;
}

export async function incrementVoiceUsage(subscriberId: number): Promise<void> {
  await db
    .update(companionSubscribersTable)
    .set({ voiceMessagesThisMonth: sql`${companionSubscribersTable.voiceMessagesThisMonth} + 1` })
    .where(eq(companionSubscribersTable.id, subscriberId));
}
