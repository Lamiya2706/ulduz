// Daily job (pg_cron, 05:00 UTC): sends each opted-in person one email with what is due today.
// Called only by the database's cron job, which proves itself with a secret kept inside the database.
import { computeChart } from "../_shared/astro.ts";
import { db, env } from "../_shared/http.ts";
import { firstName } from "../_shared/prompt.ts";
import { dueReminders, reminderKey, renderEmail, type Lang } from "../_shared/reminders.ts";

const SITE = Deno.env.get("SITE_URL") ?? "https://ulduz.space";
const FROM = Deno.env.get("REMINDERS_FROM") ?? "Ulduz <no-reply@ulduz.space>";

interface Recipient {
  id: string; email: string; full_name: string | null; birth_date: string; birth_time: string | null;
  lat: number | null; lon: number | null; tz: string | null; lang: string | null; unsubscribe_token: string;
}

Deno.serve(async (req) => {
  const sb = db();
  const secret = req.headers.get("x-cron-secret") ?? "";
  const { data: ok } = await sb.rpc("check_reminders_secret", { s: secret });
  if (!secret || ok !== true) return new Response("forbidden", { status: 403 });

  const { data: people, error } = await sb.rpc("reminder_recipients");
  if (error) return new Response(`recipients: ${error.message}`, { status: 500 });

  const now = new Date();
  const fnBase = `${env("SUPABASE_URL")}/functions/v1/unsubscribe`;
  let sent = 0, failed = 0;
  for (const p of (people ?? []) as Recipient[]) {
    try {
      const hasPlace = p.lat != null && p.lon != null;
      const tz = (hasPlace && p.tz) || "Asia/Baku";
      const chart = computeChart({ fullName: p.full_name ?? "", date: p.birth_date, time: hasPlace ? p.birth_time : null, lat: hasPlace ? p.lat : null, lon: hasPlace ? p.lon : null, tz: hasPlace ? tz : "UTC" });
      const due = dueReminders(chart, p.birth_date, now, tz);
      if (!due.length) continue;

      // Claim the reminders first, so a second run on the same day can't send them again.
      const { data: claimed } = await sb.from("reminder_log")
        .upsert(due.map((r) => ({ user_id: p.id, key: reminderKey(r) })), { onConflict: "user_id,key", ignoreDuplicates: true })
        .select("key");
      const keys = new Set((claimed ?? []).map((r: { key: string }) => r.key));
      const fresh = due.filter((r) => keys.has(reminderKey(r)));
      if (!fresh.length) continue;

      const lang = (["az", "en", "ru"].includes(p.lang ?? "") ? p.lang : "az") as Lang;
      const pageUnsub = `${SITE}/${lang}/unsubscribe?t=${p.unsubscribe_token}`;
      const mail = renderEmail({ lang, name: firstName(p.full_name ?? ""), reminders: fresh, site: SITE, unsubscribeUrl: pageUnsub, birthDate: p.birth_date, tz });
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM, to: [p.email], subject: mail.subject, html: mail.html, text: mail.text,
          headers: { "List-Unsubscribe": `<${fnBase}?t=${p.unsubscribe_token}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
        }),
      });
      if (!res.ok) {
        // Give the reminders back so tomorrow's run can try again.
        await sb.from("reminder_log").delete().eq("user_id", p.id).in("key", [...keys]);
        console.error("resend", res.status, await res.text());
        failed++;
      } else sent++;
    } catch (e) {
      console.error("reminder", p.id, e);
      failed++;
    }
  }
  return Response.json({ people: people?.length ?? 0, sent, failed });
});
