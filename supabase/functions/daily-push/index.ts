// Sends the daily horoscope push notification. Called every hour by pg_cron (see the push migration);
// each subscription gets one message a day, at its chosen local hour.
// Auth: the caller must send the push cron secret (kept in private.settings) in the x-cron-secret header.
import { db, env } from "../_shared/http.ts";
import { dailyMessage, isDue, type PushProfile } from "../_shared/dailyPush.ts";
import { sendPush, type VapidKeys } from "../_shared/webpush.ts";

// Same public key as src/lib/push.ts (public by design); the private half is in private.settings.
const VAPID_PUBLIC_KEY = "BHTrmnHyRGLgtP9Z11sD7YPwrFKeqqwc3_J8R5bQ3oLWMNXnTMFEZayoGcWnhb5dkmwXYiV6wzolyNvazYNj0Oc";

interface Row {
  id: string; endpoint: string; p256dh: string; auth: string; lang: string | null; tz: string | null;
  hour: number; last_sent_on: string | null; failures: number; profiles: PushProfile | null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });
  const sb = db();
  const secret = req.headers.get("x-cron-secret") ?? "";
  // The private key comes back only when the secret matches.
  const { data: privateKey } = secret ? await sb.rpc("push_config", { s: secret }) : { data: null };
  if (typeof privateKey !== "string" || !privateKey) return new Response("forbidden", { status: 403 });
  const vapid: VapidKeys = { publicKey: env("VAPID_PUBLIC_KEY", VAPID_PUBLIC_KEY), privateKey, subject: env("VAPID_SUBJECT", "mailto:no-reply@ulduz.space") };
  const now = new Date();
  const { data, error } = await sb.from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, lang, tz, hour, last_sent_on, failures, profiles(full_name, birth_date, birth_time, lat, lon, tz)")
    .returns<Row[]>();
  if (error) { console.error(error); return new Response("db_error", { status: 500 }); }

  let sent = 0, skipped = 0, removed = 0, failed = 0;
  // Small batches keep memory and open connections modest.
  const rows = data ?? [];
  for (let i = 0; i < rows.length; i += 20) {
    await Promise.all(rows.slice(i, i + 20).map(async (r) => {
      const { due, date } = isDue(r, now);
      const msg = due && r.profiles ? dailyMessage(r.profiles, r.lang, date) : null;
      if (!msg) { skipped++; return; }
      try {
        const res = await sendPush(r, msg, vapid, { topic: "daily" });
        if (res.ok) {
          sent++;
          await sb.from("push_subscriptions").update({ last_sent_on: date, failures: 0 }).eq("id", r.id);
        } else if (res.gone || r.failures >= 5) {
          removed++;
          await sb.from("push_subscriptions").delete().eq("id", r.id);
        } else {
          failed++;
          console.error("push failed", res.status, new URL(r.endpoint).host);
          await sb.from("push_subscriptions").update({ failures: r.failures + 1 }).eq("id", r.id);
        }
      } catch (e) {
        failed++;
        console.error("push error", e);
        await sb.from("push_subscriptions").update({ failures: r.failures + 1 }).eq("id", r.id);
      }
    }));
  }
  return new Response(JSON.stringify({ sent, skipped, removed, failed }), { headers: { "Content-Type": "application/json" } });
});
