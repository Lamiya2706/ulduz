// Creates charts + an order and starts the payment. Shared by the website (create-payment) and the Telegram bot.
import { computeChart } from "./astro.ts";
import { type BirthParams, encodeBirth } from "./birthcode.ts";
import { createPayment } from "./epoint.ts";
import { db, env, randomToken, sha256 } from "./http.ts";
import { numerology } from "./numerology.ts";
import type { Lang } from "./prompt.ts";

const DESC = { az: "Ulduz — şəxsi oxunuş", en: "Ulduz — personal reading", ru: "Ulduz — личный разбор" } as const;
const DESC_COUPLE = { az: "Ulduz — cütlük oxunuşu", en: "Ulduz — couple reading", ru: "Ulduz — разбор для пары" } as const;

export const isTestPayment = () => Deno.env.get("PAYMENT_MODE") === "test";

export interface NewOrder {
  input: BirthParams;
  partner?: BirthParams | null;
  lang: Lang;
  email?: string | null;
  ip?: string | null;
  tgChatId?: number | null;
}
export interface CreatedOrder {
  orderId: string;
  token: string;
  /** Where to send the buyer: the Epoint checkout, or straight to the success page in test mode. */
  redirectUrl: string;
  paid: boolean;
}

export const readingUrl = (lang: Lang, orderId: string, token: string) =>
  `${env("SITE_URL").replace(/\/$/, "")}/${lang}/reading/${orderId}?t=${encodeURIComponent(token)}`;

export async function createOrder(o: NewOrder): Promise<CreatedOrder> {
  const sb = db();
  const saveChart = async (p: BirthParams) => {
    const { data, error } = await sb.from("charts").insert({
      full_name: p.fullName, birth_date: p.date, birth_time: p.time, lat: p.lat, lon: p.lon, tz: p.tz,
      place: p.place, code: encodeBirth(p), chart: computeChart(p), numerology: numerology(p.fullName, p.date),
    }).select("id").single();
    if (error) throw error;
    return data.id as string;
  };
  const chartId = await saveChart(o.input);
  const partnerId = o.partner ? await saveChart(o.partner) : null;

  const token = randomToken();
  const amount = Deno.env.get("PRICE_AZN") ?? "2.00";
  const { data: order, error: oe } = await sb.from("orders").insert({
    chart_id: chartId, partner_chart_id: partnerId, kind: o.partner ? "couple" : "natal", token_hash: await sha256(token),
    amount, lang: o.lang, email: o.email ?? null, ip: o.ip ?? null, tg_chat_id: o.tgChatId ?? null,
    provider: isTestPayment() ? "test" : "epoint",
  }).select("id").single();
  if (oe) throw oe;

  const site = env("SITE_URL").replace(/\/$/, "");
  // The private token is NOT put in the payment URLs.
  const successUrl = `${site}/${o.lang}/payment/success?order=${order.id}`;
  const errorUrl = `${site}/${o.lang}/payment/failed?order=${order.id}`;

  if (isTestPayment()) {
    await sb.from("orders").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", order.id);
    return { orderId: order.id, token, redirectUrl: successUrl, paid: true };
  }
  const pay = await createPayment({
    orderId: order.id, amount, language: o.lang, description: (o.partner ? DESC_COUPLE : DESC)[o.lang], successUrl, errorUrl,
  });
  await sb.from("orders").update({ provider_transaction: pay.transaction }).eq("id", order.id);
  return { orderId: order.id, token, redirectUrl: pay.redirectUrl, paid: false };
}
