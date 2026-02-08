/**
 * Telegram Bot Polling Script
 * Run alongside `npm run dev`: node scripts/telegram-poll.mjs
 *
 * Polls Telegram for updates and forwards them to the local webhook route.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read token from .env.local
function loadToken() {
  try {
    const envPath = resolve(__dirname, "..", ".env.local");
    const content = readFileSync(envPath, "utf-8");
    const match = content.match(/TELEGRAM_BOT_TOKEN=(.+)/);
    return match?.[1]?.trim();
  } catch {
    return process.env.TELEGRAM_BOT_TOKEN;
  }
}

const TOKEN = loadToken();
if (!TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN not found in .env.local");
  process.exit(1);
}

const TG = `https://api.telegram.org/bot${TOKEN}`;
const WEBHOOK_URL = "http://localhost:3000/api/telegram/webhook";
let offset = 0;

console.log("TREND PRISM Telegram Bot — polling mode");
console.log("Bot: https://t.me/trendprismbot");
console.log("Forwarding updates to:", WEBHOOK_URL);
console.log("Press Ctrl+C to stop\n");

// Clear any existing webhook so polling works
try {
  await fetch(`${TG}/deleteWebhook`);
  console.log("Webhook cleared — polling active\n");
} catch (err) {
  console.warn("Could not clear webhook (network issue?):", err.message);
  console.log("Retrying in 5 seconds...\n");
  await sleep(5000);
}

async function poll() {
  while (true) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);

      const res = await fetch(
        `${TG}/getUpdates?offset=${offset}&timeout=30&allowed_updates=["message","callback_query"]`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      const data = await res.json();

      if (!data.ok) {
        console.error("Telegram API error:", data.description);
        await sleep(5000);
        continue;
      }

      for (const update of data.result || []) {
        offset = update.update_id + 1;

        const preview = update.message?.text || update.callback_query?.data || "?";
        const from = update.message?.from?.first_name || update.callback_query?.from?.first_name || "?";
        console.log(`[${new Date().toLocaleTimeString()}] ${from}: ${preview}`);

        // Forward to webhook route
        try {
          await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(update),
          });
        } catch (err) {
          console.error("Failed to forward to webhook:", err.message);
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Poll timeout — retrying...");
      } else {
        console.error("Poll error:", err.message, "— retrying in 5s");
      }
      await sleep(5000);
    }
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

poll();
