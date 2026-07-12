/**
 * One-off: send first-subscriber welcome email to leeoo7@hotmail.com
 * Run with: node send-welcome-email.mjs
 */
import { Resend } from "resend";

const key = process.env.RESEND_API_KEY;
if (!key) { console.error("RESEND_API_KEY not set"); process.exit(1); }

const r = new Resend(key);

const btn = (href, label) =>
  `<a href="${href}" style="display:inline-block;background:#c8a96e;color:#000;font-weight:700;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none;margin:4px 0;">${label}</a>`;

const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#0a0a0a;color:#fff;border-radius:16px;">

  <h1 style="font-size:26px;font-weight:800;margin:0 0 4px;letter-spacing:-0.5px;">GLIMR</h1>
  <p style="color:#666;margin:0 0 32px;font-size:12px;text-transform:uppercase;letter-spacing:1px;">AI Companions that remember you</p>

  <p style="font-size:16px;line-height:1.75;color:#e5e5e5;margin:0 0 20px;">
    Hey — you're one of the very first people to hear about GLIMR, and that means a lot to us.
  </p>

  <p style="font-size:15px;line-height:1.75;color:#ccc;margin:0 0 20px;">
    GLIMR is a place where you're never alone. Our AI companions — Jess, Mia, Zac, Jessica and more — listen, remember, and show up for you the way only someone who truly knows you can.
  </p>

  <p style="font-size:15px;line-height:1.75;color:#ccc;margin:0 0 28px;">
    Start with 10 free messages — no card, no account needed. Or create a free account and keep chatting as long as you like.
  </p>

  <div style="margin:0 0 28px;">
    ${btn("https://glimr.com.au/chat/mia", "Talk to Mia — it's free →")}
  </div>

  <div style="background:#111;border:1px solid #222;border-radius:12px;padding:20px;margin:0 0 28px;">
    <p style="font-size:13px;font-weight:700;color:#c8a96e;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px;">What you get — always free</p>
    <ul style="margin:0;padding:0 0 0 16px;color:#aaa;font-size:14px;line-height:2;">
      <li>Unlimited text chat with any companion</li>
      <li>Companions that remember your conversations</li>
      <li>Meet Jess, Mia, Zac, Jessica, Luna &amp; more</li>
      <li>Voice replies, live video, selfies &amp; games — upgrade anytime</li>
    </ul>
  </div>

  <div style="text-align:center;margin:0 0 28px;">
    ${btn("https://glimr.com.au", "Visit GLIMR →")}
  </div>

  <p style="font-size:13px;color:#555;margin:32px 0 0;line-height:1.6;">
    We're building something special here and you're part of it from the very beginning.<br>
    If you ever need anything, just reply to this email — we actually read every one.<br><br>
    Warmly,<br>
    <strong style="color:#888;">The GLIMR team</strong>
  </p>

</div>
`;

try {
  const res = await r.emails.send({
    from: "GLIMR <hello@glimr.com.au>",
    to: "leeoo7@hotmail.com",
    subject: "You're one of the first — welcome to GLIMR 🌟",
    html,
  });
  console.log("Sent!", JSON.stringify(res));
} catch (err) {
  console.error("Failed:", err.message);
  process.exit(1);
}
