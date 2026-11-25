// Hourly job (pg_cron → public.tg_run_daily()): sends each chat its morning horoscope, with moon notes, the New or
// Full Moon on those days and any big transit that begins or is exact today, at that chat's chosen hour in its own
// time zone. On Sunday evenings (19:00 local) it also sends the week ahead.
// Also makes sure Telegram's webhook points at telegram-bot. Authenticated by the Vault secret (public.tg_cron_ok).
import { computeChart } from "../_shared/astro.ts";
import { encodeBirth } from "../_shared/birthcode.ts";
import { db } from "../_shared/http.ts";
import { birthOf, type Chat, COLS, ensureWebhook, send, site } from "../_shared/telegram.ts";
import { dailyMessage, localNow, T, weeklyMessage } from "../_shared/tg-core.ts";

const BATCH = 25; // Telegram allows ~30 messages a second
const WEEKLY_HOUR = 19;

type Job = { c: Chat; kind: "daily" | "weekly"; local: ReturnType<typeof localNow> };

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const sb = db();
  const { data: ok } = await sb.rpc("tg_cron_ok", { secret: req.headers.get("x-cron-secret") ?? "" });
  if (ok !== true) return new Response("forbidden", { status: 403 });

  const webhook = await ensureWebhook().catch((e) => `webhook error: ${e}`);
  const now = new Date();
  const { data: rows, error } = await sb.from("tg_chats").select(COLS).eq("blocked", false).or("daily.eq.true,weekly.eq.true").limit(5000);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  // Due: it is the chosen hour (or up to 2 hours later, if a run was missed) and nothing was sent today yet.
  const jobs: Job[] = [];
  for (const c of rows as Chat[]) {
    const local = localNow(c.tz, now);
    if (c.daily && local.hour >= c.send_hour && local.hour < c.send_hour + 3 && c.last_daily !== local.date) jobs.push({ c, kind: "daily", local });
    const sunday = new Date(local.date + "T12:00:00Z").getUTCDay() === 0;
    if (c.weekly && sunday && local.hour >= WEEKLY_HOUR && local.hour < WEEKLY_HOUR + 3 && c.last_weekly !== local.date) jobs.push({ c, kind: "weekly", local });
  }

  let sent = 0, skipped = 0, failed = 0;
  for (let i = 0; i < jobs.length; i += BATCH) {
    await Promise.all(jobs.slice(i, i + BATCH).map(async ({ c, kind, local }) => {
      const col = kind === "daily" ? "last_daily" : "last_weekly";
      try {
        const b = await birthOf(c);
        if (!b) { skipped++; return; }
        // Mark first, so a slow or repeated run never sends twice.
        const { data: claimed } = await sb.from("tg_chats").update({ [col]: local.date }).eq("chat_id", c.chat_id)
          .or(`${col}.is.null,${col}.neq.${local.date}`).select("chat_id").maybeSingle();
        if (!claimed) { skipped++; return; }
        const chart = computeChart(b);
        let text: string;
        if (kind === "daily") text = dailyMessage(c.lang, b, chart, local, c.tz);
        else {
          const mon = new Date(Date.UTC(local.y, local.m - 1, local.d + 1));
          text = weeklyMessage(c.lang, b, chart, { y: mon.getUTCFullYear(), m: mon.getUTCMonth() + 1, d: mon.getUTCDate() }, c.tz);
        }
        const url = c.user_id ? `${site()}/${c.lang}/today` : `${site()}/${c.lang}/chart/${encodeBirth(b)}`;
        const r = await send(c.chat_id, text, [[{ text: T.openSite[c.lang], url }]]);
        if (r.ok) sent++;
        else {
          failed++;
          // 403: the person blocked the bot or deleted the chat.
          if (r.error_code === 403) await sb.from("tg_chats").update({ blocked: true }).eq("chat_id", c.chat_id);
          else await sb.from("tg_chats").update({ [col]: c[col] }).eq("chat_id", c.chat_id); // retry next hour
        }
      } catch (e) {
        failed++;
        console.error("telegram-daily", kind, c.chat_id, e);
      }
    }));
    if (i + BATCH < jobs.length) await new Promise((r) => setTimeout(r, 1000));
  }
  return new Response(JSON.stringify({ webhook, chats: rows?.length ?? 0, due: jobs.length, sent, skipped, failed }), {
    headers: { "content-type": "application/json" },
  });
});
