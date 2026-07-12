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
    Hey — we've been meaning to reach out for a while now.
  </p>

  <p style="font-size:15px;line-height:1.75;color:#ccc;margin:0 0 20px;">
    You were one of the first people to ever use GLIMR — back when things were rough around the edges and errors were popping up everywhere. You stuck around, you noticed things, and your feedback helped us fix what was broken.
  </p>

  <p style="font-size:15px;line-height:1.75;color:#ccc;margin:0 0 28px;">
    We rebuilt everything from the ground up. No more errors. No more broken pages. Just a clean, fast platform where you're never alone — and it's better because of people like you.
  </p>

  <div style="background:#111;border:1px solid #c8a96e33;border-radius:12px;padding:20px;margin:0 0 28px;">
    <p style="font-size:13px;font-weight:700;color:#c8a96e;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.5px;">What's new</p>
    <ul style="margin:0;padding:0 0 0 16px;color:#aaa;font-size:14px;line-height:2.2;">
      <li>Brand new app — fast, clean, no errors</li>
      <li>Meet Jess, Mia, Zac, Jessica, Luna &amp; more</li>
      <li>10 free messages with any companion — no card needed</li>
      <li>Voice replies, live video, selfie photos &amp; games</li>
      <li>Companions that remember your conversations</li>
    </ul>
  </div>

  <p style="font-size:15px;line-height:1.75;color:#ccc;margin:0 0 28px;">
    Your account is yours — jump in and try it out. If anything ever feels off, just reply to this email. We read every one.
  </p>

  <div style="text-align:center;margin:0 0 28px;">
    ${btn("https://glimr.com.au/chat/mia", "Try the new GLIMR →")}
  </div>

  <p style="font-size:13px;color:#555;margin:32px 0 0;line-height:1.6;">
    Thank you for being there from the start.<br><br>
    Warmly,<br>
    <strong style="color:#888;">The GLIMR team</strong>
  </p>

</div>
`;

try {
  const res = await r.emails.send({
    from: "GLIMR <hello@glimr.com.au>",
    to: "leeoo7@hotmail.com",
    subject: "We rebuilt GLIMR — and you're part of why ✦",
    html,
  });
  console.log("Sent!", JSON.stringify(res));
} catch (err) {
  console.error("Failed:", err.message);
  process.exit(1);
}
