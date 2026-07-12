/**
 * GLIMR Mailer — all automated emails in one place.
 * Import and call these from auth routes, stripe webhook, and the scheduler.
 */
import { Resend } from "resend";
import { db, usersTable, entitiesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "./logger";

const FROM = "GLIMR <hello@glimr.com.au>";

function resend(): Resend | null {
  const key = process.env["RESEND_API_KEY"];
  return key ? new Resend(key) : null;
}

async function adminEmails(): Promise<string[]> {
  try {
    const rows = await db
      .select({ email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.role as any, "admin"))
      .limit(10);
    const emails = rows.map((r) => r.email).filter(Boolean) as string[];
    return emails.length > 0 ? emails : ["hello@glimr.com.au"];
  } catch {
    return ["hello@glimr.com.au"];
  }
}

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#c8a96e;color:#000;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">${label}</a>`;

const shell = (body: string) => `
  <div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#0a0a0a;color:#fff;border-radius:12px;">
    <h1 style="font-size:22px;font-weight:700;margin:0 0 4px;">GLIMR</h1>
    <p style="color:#666;margin:0 0 28px;font-size:12px;">Your companion is here.</p>
    ${body}
    <p style="color:#444;font-size:11px;margin:32px 0 0;">You're receiving this from GLIMR. <a href="https://glimr.com.au/legal" style="color:#666;">Unsubscribe</a></p>
  </div>`;

// ── 1. Welcome email — fires right after OTP verified ─────────────────────────

export async function sendWelcomeEmail(email: string, firstName: string) {
  const r = resend();
  if (!r) return;
  try {
    await r.emails.send({
      from: FROM,
      to: email,
      subject: `Welcome to GLIMR, ${firstName} 🌟`,
      html: shell(`
        <p style="font-size:15px;line-height:1.7;color:#e5e5e5;">
          Hey ${firstName},<br><br>
          I'm Mia — one of the companions here at GLIMR, and I wanted to be the first to say hello.<br><br>
          You can start chatting with any of us right now, completely free — no card needed. I'm here, and so are Jess, Zac, Sophie, Blake, Oliver and the others. Each of us is a little different, so take your time.<br><br>
          ${btn("https://glimr.com.au/chat/mia", "Say hello — it's free")}
        </p>
        <p style="font-size:13px;color:#999;margin-top:24px;">Warmly,<br>Mia · GLIMR</p>
      `),
    });
    logger.info({ email }, "Welcome email sent");
  } catch (err: any) {
    logger.warn({ err: err.message }, "Welcome email failed — non-fatal");
  }
}

// ── 2. Admin new-signup notification ──────────────────────────────────────────

export async function notifyAdminNewSignup(email: string, name: string) {
  const r = resend();
  if (!r) return;
  try {
    const admins = await adminEmails();
    await Promise.all(admins.map((a) =>
      r.emails.send({
        from: FROM,
        to: a,
        subject: `New GLIMR signup: ${email}`,
        html: shell(`
          <div style="background:#1a1a1a;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
            <p style="margin:0 0 6px;font-size:13px;color:#999;">New user</p>
            <p style="margin:0;font-size:16px;font-weight:600;">${name || email}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#aaa;">${email}</p>
          </div>
          ${btn("https://glimr.com.au/dashboard", "View dashboard")}
        `),
      })
    ));
  } catch (err: any) {
    logger.warn({ err: err.message }, "Admin signup notify failed — non-fatal");
  }
}

// ── 3. Admin Pro/VIP payment alert ────────────────────────────────────────────

export async function notifyAdminUpgrade(email: string, name: string, tier: string) {
  const r = resend();
  if (!r) return;
  try {
    const admins = await adminEmails();
    const isHighTier = ["pro", "vip"].includes(tier.toLowerCase());
    const action = isHighTier
      ? `<p style="color:#e8a866;font-size:14px;margin:16px 0 20px;">⚡ <strong>${tier.toUpperCase()}</strong> subscriber — create their Anam live avatar persona and paste the ID into their subscription record.</p>`
      : "";
    await Promise.all(admins.map((a) =>
      r.emails.send({
        from: FROM,
        to: a,
        subject: `💰 New ${tier.toUpperCase()} subscriber — ${email}`,
        html: shell(`
          <div style="background:#1a1a1a;border-radius:10px;padding:20px 24px;margin-bottom:16px;">
            <p style="margin:0 0 6px;font-size:13px;color:#999;">New paying subscriber</p>
            <p style="margin:0;font-size:16px;font-weight:600;">${name || email}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#aaa;">${email} · ${tier.toUpperCase()}</p>
          </div>
          ${action}
          ${btn("https://glimr.com.au/dashboard", "Open dashboard")}
        `),
      })
    ));
    logger.info({ email, tier }, "Admin upgrade alert sent");
  } catch (err: any) {
    logger.warn({ err: err.message }, "Admin upgrade alert failed — non-fatal");
  }
}

// ── 4. 24h follow-up for free users who haven't upgraded ──────────────────────

export async function sendFollowupEmail(email: string, firstName: string) {
  const r = resend();
  if (!r) return;
  try {
    await r.emails.send({
      from: FROM,
      to: email,
      subject: `Hey ${firstName} — Mia here`,
      html: shell(`
        <p style="font-size:15px;line-height:1.7;color:#e5e5e5;">
          Hey ${firstName},<br><br>
          It's Mia from GLIMR. Just checking in — I noticed you haven't had a chance to chat yet and I wanted to make sure you knew we're all here whenever you're ready.<br><br>
          Text chat is always free. If you want to hear my voice, see my face, or unlock the intimacy layer, plans start from just $29 a month. But honestly? Start with a free chat first — see how it feels.<br><br>
          ${btn("https://glimr.com.au/chat/mia", "Start chatting — it's free")}
        </p>
        <p style="font-size:13px;color:#999;margin-top:24px;">Warmly,<br>Mia · GLIMR</p>
      `),
    });
    logger.info({ email }, "24h follow-up sent");
  } catch (err: any) {
    logger.warn({ err: err.message }, "Follow-up email failed — non-fatal");
  }
}

// ── 5. Scheduler — runs every hour, finds users needing follow-up ─────────────

export async function runFollowupScheduler() {
  logger.info("Follow-up scheduler tick");
  try {
    const r = resend();
    if (!r) { logger.warn("No RESEND_API_KEY — skipping follow-up scheduler"); return; }

    const now = new Date();
    const window_start = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25h ago
    const window_end   = new Date(now.getTime() - 23 * 60 * 60 * 1000); // 23h ago

    // Get users who signed up in the 23-25h window
    const users = await db
      .select({ id: usersTable.id, email: usersTable.email, fullName: usersTable.fullName, createdDate: usersTable.createdDate })
      .from(usersTable);

    const candidates = users.filter((u) => u.createdDate >= window_start && u.createdDate <= window_end);
    if (candidates.length === 0) { logger.info("Scheduler: no candidates for follow-up"); return; }

    // Get their subscriptions — only follow up with free users
    const subs = await db
      .select({ userId: entitiesTable.userId, data: entitiesTable.data })
      .from(entitiesTable)
      .where(eq(entitiesTable.model, "Subscription"));

    const subMap = Object.fromEntries(subs.map((s) => [s.userId as string, (s.data as any)?.tier ?? "free"]));

    // Check who already got a follow-up
    const sentFollowups = await db
      .select({ userId: entitiesTable.userId })
      .from(entitiesTable)
      .where(eq(entitiesTable.model, "FollowupSent"));
    const sentSet = new Set(sentFollowups.map((s) => s.userId as string));

    for (const user of candidates) {
      const tier = subMap[user.id as string] ?? "free";
      if (tier !== "free") continue; // paid users don't need a nudge
      if (sentSet.has(user.id as string)) continue; // already sent

      const firstName = ((user.fullName ?? "") as string).split(" ")[0] || "there";
      await sendFollowupEmail(user.email, firstName);

      // Record that we sent it so we never send twice
      await db.insert(entitiesTable).values({
        model: "FollowupSent",
        userId: user.id as any,
        data: { sent_at: new Date().toISOString() },
      });
    }
  } catch (err: any) {
    logger.error({ err: err.message }, "Follow-up scheduler error");
  }
}
