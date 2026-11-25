// Hourly job (pg_cron → public.tg_run_daily()): sends each chat its morning horoscope, with moon notes and any big
// transit that begins or is exact today, when it is that chat's chosen hour in its own time zone.
// Also makes sure Telegram's webhook points at telegram-bot. Authenticated by the Vault secret (public.tg_cron_ok).
import { computeChart } from "../_shared/astro.ts";
import { encodeBirth } from "../_shared/birthcode.ts";
import { db } from "../_shared/http.ts";
import { birthOf, type Chat, ensureWebhook, send, site } from "../_shared/telegram.ts";
import { dailyMessage, localNow, T } from "../_shared/tg-core.ts";

const COLS = "chat_id, user_id, lang, step, data, birth, daily, send_hour, tz, last_daily, blocked";
const BATCH = 25; // Telegram allows ~30 messages a second

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const sb = db();
  const { data: ok } = await sb.rpc("tg_cron_ok", { secret: req.headers.get("x-cron-secret") ?? "" });
  if (ok !== true) return new Response("forbidden", { status: 403 });

  const webhook = await ensureWebhook().catch((e) => `webhook error: ${e}`);
  const now = new Date();
  const { data: rows, error } = await sb.from("tg_chats").select(COLS).eq("daily", true).eq("blocked", false).limit(5000);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  // Due: it is the chosen hour (or later the same morning, if a run was missed) and nothing was sent today yet.
  const due = (rows as Chat[]).map((c) => ({ c, local: localNow(c.tz, now) }))
    .filter(({ c, local }) => local.hour >= c.send_hour && local.hour < c.send_hour + 3 && c.last_daily !== local.date);

  let sent = 0, skipped = 0, failed = 0;
  for (let i = 0; i < due.length; i += BATCH) {
    await Promise.all(due.slice(i, i + BATCH).map(async ({ c, local }) => {
      try {
        const b = await birthOf(c);
        if (!b) { skipped++; return; }
        // Mark first, so a slow or repeated run never sends twice.
        const { data: claimed } = await sb.from("tg_chats").update({ last_daily: local.date }).eq("chat_id", c.chat_id)
          .or(`last_daily.is.null,last_daily.neq.${local.date}`).select("chat_id").maybeSingle();
        if (!claimed) { skipped++; return; }
        const url = c.user_id ? `${site()}/${c.lang}/today` : `${site()}/${c.lang}/chart/${encodeBirth(b)}`;
        const r = await send(c.chat_id, dailyMessage(c.lang, b, computeChart(b), local), [[{ text: T.openSite[c.lang], url }]]);
        if (r.ok) sent++;
        else {
          failed++;
          // 403: the person blocked the bot or deleted the chat.
          if (r.error_code === 403) await sb.from("tg_chats").update({ blocked: true }).eq("chat_id", c.chat_id);
          else await sb.from("tg_chats").update({ last_daily: c.last_daily }).eq("chat_id", c.chat_id); // retry next hour
        }
      } catch (e) {
        failed++;
        console.error("telegram-daily", c.chat_id, e);
      }
    }));
    if (i + BATCH < due.length) await new Promise((r) => setTimeout(r, 1000));
  }
  return new Response(JSON.stringify({ webhook, chats: rows?.length ?? 0, due: due.length, sent, skipped, failed }), {
    headers: { "content-type": "application/json" },
  });
});
