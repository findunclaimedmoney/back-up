import { Router, type IRouter } from "express";
import { db, supportTickets } from "@workspace/db";
import { CreateSupportTicketBody } from "@workspace/api-zod";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const connectors = new ReplitConnectors();

// POST /api/support/tickets — capture a support message / ticket from Mia
router.post("/support/tickets", async (req, res) => {
  const parsed = CreateSupportTicketBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { email, message, name, subject, conversationId } = parsed.data;

  try {
    const [row] = await db
      .insert(supportTickets)
      .values({
        email,
        message,
        name: name ?? null,
        subject: subject ?? null,
        conversationId: conversationId ?? null,
      })
      .returning();

    logger.info({ ticketId: row.id, email }, "Support ticket created");

    // Best-effort CRM sync — never blocks the customer's submission
    void syncTicketToHubSpot({
      email,
      name: name ?? null,
      subject: subject ?? null,
      message,
    });

    res.status(201).json({
      success: true,
      ticketId: row.id,
      message: "Thanks! Our team has your message and will email you back shortly.",
    });
  } catch (err) {
    logger.error({ err, email }, "Failed to create support ticket");
    res.status(500).json({ error: "Could not submit your message. Please try again." });
  }
});

interface TicketSync {
  email: string;
  name: string | null;
  subject: string | null;
  message: string;
}

async function syncTicketToHubSpot(t: TicketSync): Promise<void> {
  try {
    // Ensure the contact exists so the ticket is attributable to a person
    let contactId: string | null = null;
    const searchRes = await connectors.proxy("hubspot", "/crm/v3/objects/contacts/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: t.email }] }],
      }),
    });
    const searchData = (await searchRes.json()) as { total: number; results?: Array<{ id: string }> };
    if (searchData.total > 0 && searchData.results?.[0]) {
      contactId = searchData.results[0].id;
    } else {
      const [firstName, ...rest] = (t.name ?? "").trim().split(/\s+/);
      const createRes = await connectors.proxy("hubspot", "/crm/v3/objects/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          properties: {
            email: t.email,
            firstname: firstName ?? "",
            lastname: rest.join(" "),
            hs_lead_status: "NEW",
            lifecyclestage: "lead",
            lead_source: "Mia AI Support",
          },
        }),
      });
      const created = (await createRes.json()) as { id?: string };
      contactId = created.id ?? null;
    }

    // Create the ticket in the default support pipeline (id "0", stage "1")
    const ticketBody: Record<string, unknown> = {
      properties: {
        subject: t.subject || `Support request from ${t.name || t.email}`,
        content: t.message,
        hs_pipeline: "0",
        hs_pipeline_stage: "1",
        hs_ticket_priority: "MEDIUM",
      },
    };
    if (contactId) {
      ticketBody.associations = [
        {
          to: { id: contactId },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 16 }],
        },
      ];
    }

    await connectors.proxy("hubspot", "/crm/v3/objects/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ticketBody),
    });
    logger.info({ email: t.email }, "HubSpot ticket created from Mia support");
  } catch (err) {
    logger.warn({ err, email: t.email }, "HubSpot ticket sync failed (non-critical)");
  }
}

export default router;
