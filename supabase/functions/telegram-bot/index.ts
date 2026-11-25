// Telegram bot webhook: builds a natal chart in a short chat, opens the full chart on the website as a
// Mini App, and sells the personal reading through the same orders + Epoint flow as the website.
// Set the webhook with a secret token (see README) — every request is checked against TELEGRAM_WEBHOOK_SECRET.
import { computeChart } from "../_shared/astro.ts";
import { type BirthParams, encodeBirth, validateBirth } from "../_shared/birthcode.ts";
import { db, env } from "../_shared/http.ts";
import { numerology } from "../_shared/numerology.ts";
import { createOrder } from "../_shared/orders.ts";
import { firstName, type Lang } from "../_shared/prompt.ts";
import {
  type City, chartSummary, countryName, esc, type Keyboard, loadCities, notifyOrderPaid, parseDate, parseName, parseTime,
  searchCities, send, T, tg,
} from "../_shared/telegram.ts";

type Step = "lang" | "name" | "date" | "time" | "city" | "done";
interface Data { fullName?: string; date?: string; time?: string | null; cands?: City[]; birth?: BirthParams }
interface Session { chat_id: number; lang: Lang; step: Step; data: Data }

const LANGS: Lang[] = ["az", "en", "ru"];
const MAX_ORDERS_PER_CHAT_HOUR = 5;
/** Paid readings stay "coming soon" (like on the website) until READINGS_ENABLED=true. */
const readingsEnabled = () => Deno.env.get("READINGS_ENABLED") === "true";

async function load(chatId: number): Promise<Session> {
  const { data } = await db().from("tg_sessions").select("chat_id, lang, step, data").eq("chat_id", chatId).maybeSingle();
  return (data as Session | null) ?? { chat_id: chatId, lang: "az", step: "lang", data: {} };
}
async function save(s: Session) {
  await db().from("tg_sessions").upsert({ ...s, updated_at: new Date().toISOString() });
}

const site = () => env("SITE_URL").replace(/\/$/, "");
const langKeyboard: Keyboard = [[
  { text: "🇦🇿 Azərbaycan", callback_data: "lang:az" },
  { text: "🇬🇧 English", callback_data: "lang:en" },
  { text: "🇷🇺 Русский", callback_data: "lang:ru" },
]];

async function askLang(s: Session) {
  s.step = "lang"; s.data = {};
  await save(s);
  await send(s.chat_id, T.chooseLang, langKeyboard);
}
async function askName(s: Session) {
  s.step = "name"; s.data = {};
  await save(s);
  await send(s.chat_id, T.askName[s.lang]);
}

async function showChart(s: Session, birth: BirthParams) {
  const L = s.lang;
  await send(s.chat_id, T.computing[L]);
  const chart = computeChart(birth);
  const nm = numerology(birth.fullName, birth.date);
  s.step = "done"; s.data = { birth };
  await save(s);
  await send(s.chat_id, chartSummary(L, firstName(birth.fullName), chart, nm.lifePath), [
    [{ text: T.fullChart[L], web_app: { url: `${site()}/${L}/chart/${encodeBirth(birth)}` } }],
    [readingsEnabled() ? { text: T.buy[L], callback_data: "buy" } : { text: T.soon[L], callback_data: "soon" }],
    [{ text: T.again[L], callback_data: "new" }],
  ]);
}

async function buy(s: Session) {
  const L = s.lang;
  const birth = s.data.birth && validateBirth(s.data.birth);
  if (!birth) return send(s.chat_id, T.noChart[L]);

  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db().from("orders").select("id", { count: "exact", head: true }).eq("tg_chat_id", s.chat_id).gte("created_at", since);
  if ((count ?? 0) >= MAX_ORDERS_PER_CHAT_HOUR) return send(s.chat_id, T.tooMany[L]);

  const order = await createOrder({ input: birth, lang: L, tgChatId: s.chat_id });
  await db().from("tg_order_tokens").insert({ order_id: order.orderId, chat_id: s.chat_id, token: order.token });
  if (order.paid) return notifyOrderPaid(order.orderId, L); // PAYMENT_MODE=test
  await send(s.chat_id, `${T.buyIntro[L]}\n\n<i>${T.payNote[L]}</i>`, [[{ text: T.pay[L], url: order.redirectUrl }]]);
}

async function onText(s: Session, text: string) {
  const L = s.lang;
  const cmd = text.split(/[\s@]/)[0].toLowerCase();
  if (cmd === "/start" || cmd === "/lang") return askLang(s);
  if (cmd === "/new") return s.step === "lang" ? askLang(s) : askName(s);

  switch (s.step) {
    case "lang":
      return send(s.chat_id, T.chooseLang, langKeyboard);
    case "name": {
      const name = parseName(text);
      if (!name) return send(s.chat_id, T.badName[L]);
      s.data = { fullName: name }; s.step = "date";
      await save(s);
      return send(s.chat_id, T.askDate[L]);
    }
    case "date": {
      const date = parseDate(text);
      if (!date) return send(s.chat_id, T.badDate[L]);
      s.data.date = date; s.step = "time";
      await save(s);
      return send(s.chat_id, T.askTime[L], [[{ text: T.noTime[L], callback_data: "time:none" }]]);
    }
    case "time": {
      const time = parseTime(text);
      if (!time) return send(s.chat_id, T.badTime[L], [[{ text: T.noTime[L], callback_data: "time:none" }]]);
      s.data.time = time; s.step = "city";
      await save(s);
      return send(s.chat_id, T.askCity[L]);
    }
    case "city": {
      const found = searchCities(await loadCities(), text);
      if (!found.length) return send(s.chat_id, T.noCity[L]);
      s.data.cands = found;
      await save(s);
      return send(s.chat_id, T.pickCity[L], found.map((c, i) => [{ text: `${c[0]}, ${countryName(c[1], L)}`, callback_data: `city:${i}` }]));
    }
    case "done":
      return send(s.chat_id, T.done[L]);
  }
}

async function onCallback(s: Session, data: string) {
  if (data.startsWith("lang:")) {
    const l = data.slice(5) as Lang;
    if (LANGS.includes(l)) s.lang = l;
    return askName(s);
  }
  if (data === "new") return askName(s);
  if (data === "buy") return readingsEnabled() ? buy(s) : send(s.chat_id, T.soonNote[s.lang]);
  if (data === "soon") return send(s.chat_id, T.soonNote[s.lang]);
  if (data === "time:none" && s.step === "time") {
    s.data.time = null; s.step = "city";
    await save(s);
    return send(s.chat_id, T.askCity[s.lang]);
  }
  if (data.startsWith("city:") && s.step === "city") {
    const c = s.data.cands?.[Number(data.slice(5))];
    const birth = c && validateBirth({
      fullName: s.data.fullName, date: s.data.date, time: s.data.time ?? null,
      lat: c[2], lon: c[3], tz: c[4], place: `${c[0]}, ${countryName(c[1], s.lang)}`,
    });
    if (!birth) return askName(s);
    return showChart(s, birth);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  if (req.headers.get("x-telegram-bot-api-secret-token") !== env("TELEGRAM_WEBHOOK_SECRET")) {
    return new Response("forbidden", { status: 403 });
  }
  const update = await req.json().catch(() => null);
  const msg = update?.message;
  const cb = update?.callback_query;
  const chat = msg?.chat ?? cb?.message?.chat;
  // Private chats only; always answer 200 so Telegram doesn't retry the same update forever.
  if (!chat || chat.type !== "private") return new Response("ok");

  const s = await load(chat.id);
  try {
    if (cb) {
      await tg("answerCallbackQuery", { callback_query_id: cb.id });
      await onCallback(s, String(cb.data ?? ""));
    } else if (typeof msg?.text === "string") {
      await onText(s, msg.text);
    }
  } catch (e) {
    console.error("telegram-bot", e);
    await send(chat.id, esc(T.error[s.lang])).catch(() => {});
  }
  return new Response("ok");
});
