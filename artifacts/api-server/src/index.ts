import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // ── Background scheduler — runs every hour ─────────────────────────────────
  // Sends 24h follow-up emails to free users who haven't upgraded yet.
  // Fires once immediately on startup (catches any missed window), then hourly.
  import("./lib/mailer").then(({ runFollowupScheduler }) => {
    runFollowupScheduler().catch(() => {});
    setInterval(() => runFollowupScheduler().catch(() => {}), 60 * 60 * 1000);
  }).catch(() => {});
});
