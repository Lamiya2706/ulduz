// Creates a chart + pending order and starts an Epoint hosted checkout (or, in PAYMENT_MODE=test, marks it paid).
import { computeChart } from "../_shared/astro.ts";
import { encodeBirth, validateBirth } from "../_shared/birthcode.ts";
import { createPayment } from "../_shared/epoint.ts";
import { clientIp, cors, db, env, fail, json, randomToken, sha256 } from "../_shared/http.ts";
import { numerology } from "../_shared/numerology.ts";

const DESC = { az: "Ulduz — şəxsi oxunuş", en: "Ulduz — personal reading", ru: "Ulduz — личный разбор" } as const;
const DESC_COUPLE = { az: "Ulduz — cütlük oxunuşu", en: "Ulduz — couple reading", ru: "Ulduz — разбор для пары" } as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  try {
    const body = await req.json().catch(() => null);
    const input = validateBirth(body?.input);
    const lang = body?.lang;
    if (!input || !["az", "en", "ru"].includes(lang)) return fail(req, "invalid_input");
    const partner = body?.partner == null ? null : validateBirth(body.partner);
    if (body?.partner != null && !partner) return fail(req, "invalid_input");
    const email = typeof body?.email === "string" && /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(body.email.trim()) ? body.email.trim() : null;

    const sb = db();
    const ip = clientIp(req);
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await sb.from("orders").select("id", { count: "exact", head: true }).eq("ip", ip).gte("created_at", since);
    if ((count ?? 0) >= Number(Deno.env.get("MAX_ORDERS_PER_IP_HOUR") ?? 10)) return fail(req, "rate_limited", 429);

    const saveChart = async (p: NonNullable<typeof input>) => {
      const { data, error } = await sb.from("charts").insert({
        full_name: p.fullName, birth_date: p.date, birth_time: p.time, lat: p.lat, lon: p.lon, tz: p.tz,
        place: p.place, code: encodeBirth(p), chart: computeChart(p), numerology: numerology(p.fullName, p.date),
      }).select("id").single();
      if (error) throw error;
      return data.id as string;
    };
    const chartId = await saveChart(input);
    const partnerId = partner ? await saveChart(partner) : null;

    const token = randomToken();
    const amount = Deno.env.get("PRICE_AZN") ?? "1.00";
    const { data: order, error: oe } = await sb.from("orders").insert({
      chart_id: chartId, partner_chart_id: partnerId, kind: partner ? "couple" : "natal", token_hash: await sha256(token), amount, lang, email, ip,
      provider: Deno.env.get("PAYMENT_MODE") === "test" ? "test" : "epoint",
    }).select("id").single();
    if (oe) throw oe;

    const site = env("SITE_URL").replace(/\/$/, "");
    // The private token is NOT put in the payment URLs; the browser keeps it locally.
    const successUrl = `${site}/${lang}/payment/success?order=${order.id}`;
    const errorUrl = `${site}/${lang}/payment/failed?order=${order.id}`;

    if (Deno.env.get("PAYMENT_MODE") === "test") {
      await sb.from("orders").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", order.id);
      return json(req, { redirectUrl: successUrl, orderId: order.id, token });
    }
    const pay = await createPayment({ orderId: order.id, amount, language: lang, description: (partner ? DESC_COUPLE : DESC)[lang as keyof typeof DESC], successUrl, errorUrl });
    await sb.from("orders").update({ provider_transaction: pay.transaction }).eq("id", order.id);
    return json(req, { redirectUrl: pay.redirectUrl, orderId: order.id, token });
  } catch (e) {
    console.error("create-payment", e);
    return fail(req, "server_error", 500);
  }
});
