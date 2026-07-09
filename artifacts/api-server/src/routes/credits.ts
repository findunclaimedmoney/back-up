import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, creditTransactionsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// GET /api/credits/balance — requires auth
router.get("/credits/balance", async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    const rows = await db
      .select({ creditBalance: usersTable.creditBalance, creditLifetimeSpent: usersTable.creditLifetimeSpent })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    const u = rows[0];
    res.json({
      balance: u?.creditBalance ?? 0,
      lifetimeSpent: u?.creditLifetimeSpent ?? 0,
    });
  } catch (err) {
    logger.error({ err }, "credits/balance error");
    res.status(500).json({ error: "Failed to load credits" });
  }
});

// GET /api/credits/transactions — requires auth
router.get("/credits/transactions", async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    const rows = await db
      .select()
      .from(creditTransactionsTable)
      .where(eq(creditTransactionsTable.userId, user.id))
      .orderBy(desc(creditTransactionsTable.createdAt))
      .limit(50);
    res.json({ transactions: rows });
  } catch (err) {
    logger.error({ err }, "credits/transactions error");
    res.status(500).json({ error: "Failed to load transactions" });
  }
});

// POST /api/credits/deduct — internal; deducts credits when a job is created
router.post("/credits/deduct", async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { amount, description } = req.body as { amount?: number; description?: string };
  if (!amount || amount <= 0) { res.status(400).json({ error: "Invalid amount" }); return; }

  try {
    const rows = await db
      .select({ creditBalance: usersTable.creditBalance })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    const currentBalance = rows[0]?.creditBalance ?? 0;
    if (currentBalance < amount) {
      res.status(402).json({ error: "Insufficient credits", balance: currentBalance });
      return;
    }

    await db.transaction(async (tx) => {
      await tx
        .update(usersTable)
        .set({
          creditBalance: sql`${usersTable.creditBalance} - ${amount}`,
          creditLifetimeSpent: sql`${usersTable.creditLifetimeSpent} + ${amount}`,
        })
        .where(eq(usersTable.id, user.id));

      await tx.insert(creditTransactionsTable).values({
        userId: user.id,
        type: "spend",
        amount: -amount,
        description: description ?? "Job creation",
      });
    });

    res.json({ success: true, deducted: amount });
  } catch (err) {
    logger.error({ err }, "credits/deduct error");
    res.status(500).json({ error: "Failed to deduct credits" });
  }
});

export default router;
