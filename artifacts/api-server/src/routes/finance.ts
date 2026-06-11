import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import nodemailer from "nodemailer";

const router: IRouter = Router();

const FinanceEnquiryBody = z.object({
  loanType:         z.enum(["car", "boat", "home", "personal"]),
  loanAmount:       z.number().positive(),
  preferredTerm:    z.number().positive(),
  estimatedMonthly: z.number().positive().optional(),
  firstName:        z.string().min(1),
  lastName:         z.string().min(1),
  email:            z.email(),
  phone:            z.string().min(6),
  postcode:         z.string().min(4).max(4),
  message:          z.string().optional(),
});

const LOAN_LABELS: Record<string, string> = {
  car: "Car Loan",
  boat: "Boat Loan",
  home: "Home Loan",
  personal: "Personal Loan",
};

const LEAD_EMAIL = "integrations@stratton.com.au";

function fmtAUD(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-AU");
}

function buildEmailHtml(d: z.infer<typeof FinanceEnquiryBody>): string {
  const loanLabel = LOAN_LABELS[d.loanType] ?? d.loanType;
  const rows = [
    ["Name",               `${d.firstName} ${d.lastName}`],
    ["Email",              `<a href="mailto:${d.email}">${d.email}</a>`],
    ["Phone",              `<a href="tel:${d.phone}">${d.phone}</a>`],
    ["Postcode",           d.postcode],
    ["Loan Type",          loanLabel],
    ["Loan Amount",        fmtAUD(d.loanAmount)],
    ["Preferred Term",     `${d.preferredTerm} year${d.preferredTerm !== 1 ? "s" : ""}`],
    ...(d.estimatedMonthly
      ? [["Est. Monthly Repayment", `${fmtAUD(d.estimatedMonthly)}/mo (indicative)`]]
      : []),
    ...(d.message ? [["Message", d.message]] : []),
  ] as [string, string][];

  const tableRows = rows
    .map(
      ([k, v], i) =>
        `<tr style="background:${i % 2 === 0 ? "#f9f9f9" : "#ffffff"}">
          <td style="padding:10px 14px;font-weight:600;color:#444;width:220px;border-bottom:1px solid #eee">${k}</td>
          <td style="padding:10px 14px;color:#111;border-bottom:1px solid #eee">${v}</td>
        </tr>`,
    )
    .join("");

  return `
    <div style="font-family:'Segoe UI',sans-serif;max-width:620px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
      <div style="background:#060E1C;padding:28px 32px;display:flex;align-items:center;gap:16px">
        <div style="background:#F5B942;width:4px;height:40px;border-radius:2px;flex-shrink:0"></div>
        <div>
          <p style="color:#F5B942;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 4px">MissingCash Finance Lead</p>
          <p style="color:#ffffff;font-size:20px;font-weight:700;margin:0">${loanLabel} — ${fmtAUD(d.loanAmount)}</p>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse">
        ${tableRows}
      </table>
      <div style="padding:20px 32px;background:#f5f5f5;border-top:1px solid #eee">
        <p style="color:#888;font-size:12px;margin:0">
          Submitted via <a href="https://missingcash.com.au/finance" style="color:#060E1C">missingcash.com.au/finance</a>.
          Reply directly to this email to reach the enquirer.
        </p>
      </div>
    </div>
  `;
}

function getTransporter(): nodemailer.Transporter | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT ?? 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

router.post("/finance/enquiry", async (req, res): Promise<void> => {
  const parsed = FinanceEnquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Invalid request body." });
    return;
  }

  const d = parsed.data;
  const loanLabel = LOAN_LABELS[d.loanType] ?? d.loanType;
  const subject = `Finance Lead — ${loanLabel} ${fmtAUD(d.loanAmount)} — ${d.firstName} ${d.lastName}`;

  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"MissingCash Leads" <${process.env.FROM_EMAIL ?? process.env.SMTP_USER}>`,
        to: LEAD_EMAIL,
        replyTo: d.email,
        subject,
        html: buildEmailHtml(d),
      });
      req.log.info({ loanType: d.loanType, amount: d.loanAmount, email: d.email }, "Finance lead emailed to Erin");
    } catch (err) {
      req.log.error({ err }, "Failed to send finance lead email");
      res.status(500).json({ success: false, message: "Failed to send enquiry. Please call (08) 9446 9893 directly." });
      return;
    }
  } else {
    req.log.info(
      { lead: { name: `${d.firstName} ${d.lastName}`, email: d.email, loanType: d.loanType, amount: d.loanAmount } },
      "Finance lead received — SMTP not configured, lead logged only",
    );
  }

  res.json({ success: true, message: "Enquiry received. Erin from Stratton Finance will be in touch within one business day." });
});

export default router;
