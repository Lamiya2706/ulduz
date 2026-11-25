// Telegram bot webhook. Links a chat to an Ulduz account (deep link from the account page), or collects birth details
// in a short chat; answers /today, /chart and /transits, and keeps the settings for the morning message
// (which telegram-daily sends). Every request must carry the webhook secret that ensureWebhook() registered.
import { computeChart } from "../_shared/astro.ts";
import { encodeBirth, validateBirth, type BirthParams } from "../_shared/birthcode.ts";
import { db, sha256 } from "../_shared/http.ts";
import type { Lang } from "../_shared/prompt.ts";
import {
  birthOf, botUsername, type Chat, type Keyboard, loadChat, loadCities, loadProfile, newChat, saveChat, send, site, tg, webhookSecret,
} from "../_shared/telegram.ts";
import {
  chartSummary, countryName, dailyMessage, esc, fill, firstName, isTimeZone, LANGS, localNow, matchMessage, parseDate, parseName, parseTime,
  searchCities, shareDay, startCode, T, transitsMessage,
} from "../_shared/tg-core.ts";

const HOURS = [6, 7, 8, 9, 10];
const langKeyboard: Keyboard = [[
  { text: "🇦🇿 Azərbaycan", callback_data: "lang:az" },
  { text: "🇬🇧 English", callback_data: "lang:en" },
  { text: "🇷🇺 Русский", callback_data: "lang:ru" },
]];
const mainKeyboard = (L: Lang): Keyboard => [
  [{ text: T.btnToday[L], callback_data: "today" }, { text: T.btnChart[L], callback_data: "chart" }],
  [{ text: T.btnTransits[L], callback_data: "transits" }, { text: T.btnMatch[L], callback_data: "match" }],
];
const chartUrl = (L: Lang, b: BirthParams) => `${site()}/${L}/chart/${encodeBirth(b)}`;

async function welcome(c: Chat) {
  const L = c.lang;
  c.step = "done"; c.data = {};
  await saveChat(c);
  await send(c.chat_id, T.welcome[L], [
    [{ text: T.connectAccount[L], url: `${site()}/${L}/account?telegram=1` }],
    [{ text: T.typeHere[L], callback_data: "type" }],
  ]);
}
async function askName(c: Chat) {
  c.step = "name"; c.data = {};
  await saveChat(c);
  await send(c.chat_id, T.askName[c.lang]);
}
async function needBirth(c: Chat) {
  await send(c.chat_id, T.noBirth[c.lang]);
  return welcome(c);
}

async function showChart(c: Chat) {
  const b = await birthOf(c);
  if (!b) return needBirth(c);
  await send(c.chat_id, chartSummary(c.lang, b, computeChart(b)), [
    [{ text: T.fullChart[c.lang], url: chartUrl(c.lang, b) }],
    [{ text: T.btnToday[c.lang], callback_data: "today" }, { text: T.btnTransits[c.lang], callback_data: "transits" }],
  ]);
}
async function showToday(c: Chat) {
  const b = await birthOf(c);
  if (!b) return needBirth(c);
  const now = localNow(c.tz);
  const url = c.user_id ? `${site()}/${c.lang}/today` : chartUrl(c.lang, b);
  await send(c.chat_id, dailyMessage(c.lang, b, computeChart(b), now, c.tz), [[{ text: T.openSite[c.lang], url }]]);
}
async function showTransits(c: Chat) {
  const b = await birthOf(c);
  if (!b) return needBirth(c);
  const url = c.user_id ? `${site()}/${c.lang}/today#transits` : chartUrl(c.lang, b);
  await send(c.chat_id, transitsMessage(c.lang, computeChart(b)), [[{ text: T.openSite[c.lang], url }]]);
}

async function showSettings(c: Chat) {
  const L = c.lang;
  const text = `${fill(T.settings[L], { state: c.daily ? T.on[L] : T.off[L], hour: String(c.send_hour).padStart(2, "0"), tz: esc(c.tz) })}\n${fill(T.weekly[L], { state: c.weekly ? T.on[L] : T.off[L] })}`;
  const kb: Keyboard = [
    HOURS.map((h) => ({ text: `${h === c.send_hour ? "✓ " : ""}${String(h).padStart(2, "0")}:00`, callback_data: `hour:${h}` })),
    [c.daily ? { text: T.turnOff[L], callback_data: "daily:off" } : { text: T.turnOn[L], callback_data: "daily:on" }, { text: T.pickTz[L], callback_data: "tz" }],
    [c.weekly ? { text: T.weeklyOff[L], callback_data: "weekly:off" } : { text: T.weeklyOn[L], callback_data: "weekly:on" }],
  ];
  if (c.user_id) kb.push([{ text: T.unlink[L], callback_data: "unlink" }]);
  await send(c.chat_id, text, kb);
}

/** /match: asks for the other person's birth details, then compares the two charts. */
async function askMatch(c: Chat) {
  if (!(await birthOf(c))) return needBirth(c);
  c.step = "m_name"; c.data = { partner: {} };
  await saveChat(c);
  await send(c.chat_id, T.matchAskName[c.lang]);
}
async function showMatch(c: Chat, partner: BirthParams) {
  const me = await birthOf(c);
  c.step = "done"; c.data = {};
  await saveChat(c);
  if (!me) return needBirth(c);
  await send(c.chat_id, matchMessage(c.lang, me, partner), [
    [{ text: T.matchOpen[c.lang], url: `${site()}/${c.lang}/couple/${encodeBirth(me)}/${encodeBirth(partner)}` }],
    [{ text: T.matchAgain[c.lang], callback_data: "match" }],
  ]);
}
const pname = (c: Chat) => esc(firstName(c.data.partner?.fullName ?? ""));

/** "/start <code>" from the website's "Connect Telegram" link. */
async function link(c: Chat, code: string, isNew: boolean) {
  const sb = db();
  const { data: row } = await sb.from("tg_link_codes").delete().eq("code_hash", await sha256(code)).gt("expires_at", new Date().toISOString())
    .select("user_id").maybeSingle();
  if (!row) { await send(c.chat_id, T.badLink[c.lang]); return c.user_id || c.birth ? undefined : welcome(c); }
  // One chat per account: a newer chat takes over.
  await sb.from("tg_chats").update({ user_id: null }).eq("user_id", row.user_id).neq("chat_id", c.chat_id);
  const profile = await loadProfile(row.user_id);
  if (isNew && profile?.lang && (LANGS as string[]).includes(profile.lang)) c.lang = profile.lang as Lang;
  if (profile?.tz && profile.lat != null && isTimeZone(profile.tz) && c.tz === "Asia/Baku" && !c.birth) c.tz = profile.tz;
  c.user_id = row.user_id; c.step = "done"; c.data = {};
  await saveChat(c);
  const name = profile?.full_name ? firstName(profile.full_name) : "✨";
  const b = await birthOf(c, profile);
  if (!b) return send(c.chat_id, `${esc(fill(T.linked[c.lang], { name }))}\n\n${T.linkedNoBirth[c.lang]}`);
  await send(c.chat_id, `${esc(fill(T.linked[c.lang], { name }))}\n\n${fill(T.saved[c.lang], { hour: String(c.send_hour).padStart(2, "0"), tz: esc(c.tz) })}`);
  await showToday(c);
}

/** The birth details are complete: keep them, and copy them to the account if it has none. */
async function birthDone(c: Chat, birth: BirthParams) {
  c.birth = birth; c.step = "done"; c.data = {};
  if (birth.lat != null && !c.user_id && c.last_daily === null) c.tz = birth.tz; // first time: assume they live where they were born
  await saveChat(c);
  if (c.user_id) {
    const p = await loadProfile(c.user_id);
    if (p && !p.birth_date) {
      const hasPlace = birth.lat != null;
      await db().from("profiles").update({
        full_name: p.full_name ?? birth.fullName, birth_date: birth.date, birth_time: birth.time,
        birth_place: hasPlace ? birth.place : null, lat: birth.lat, lon: birth.lon, tz: hasPlace ? birth.tz : null,
      }).eq("id", c.user_id);
    }
  }
  await send(c.chat_id, fill(T.saved[c.lang], { hour: String(c.send_hour).padStart(2, "0"), tz: esc(c.tz) }));
  await showChart(c);
}

async function onText(c: Chat, text: string, isNew: boolean) {
  const L = c.lang;
  const cmd = text.split(/[\s@]/)[0].toLowerCase();
  if (cmd === "/start") {
    const code = startCode(text);
    if (code) return link(c, code, isNew);
    if (isNew) { await saveChat(c); return send(c.chat_id, T.chooseLang, langKeyboard); }
    return (await birthOf(c)) ? send(c.chat_id, T.menu[L], mainKeyboard(L)) : welcome(c);
  }
  if (cmd === "/lang") return send(c.chat_id, T.chooseLang, langKeyboard);
  if (cmd === "/new") return askName(c);
  if (cmd === "/today") return showToday(c);
  if (cmd === "/chart") return showChart(c);
  if (cmd === "/transits") return showTransits(c);
  if (cmd === "/match") return askMatch(c);
  if (cmd === "/settings") return showSettings(c);
  if (cmd === "/stop") { c.daily = false; await saveChat(c); return send(c.chat_id, T.stopped[L]); }
  if (cmd === "/help" || cmd.startsWith("/")) return send(c.chat_id, T.menu[L], mainKeyboard(L));

  switch (c.step) {
    case "lang":
      return send(c.chat_id, T.chooseLang, langKeyboard);
    case "name": {
      const name = parseName(text);
      if (!name) return send(c.chat_id, T.badName[L]);
      c.data = { fullName: name }; c.step = "date";
      await saveChat(c);
      return send(c.chat_id, T.askDate[L]);
    }
    case "date": {
      const date = parseDate(text);
      if (!date) return send(c.chat_id, T.badDate[L]);
      c.data.date = date; c.step = "time";
      await saveChat(c);
      return send(c.chat_id, T.askTime[L], [[{ text: T.noTime[L], callback_data: "time:none" }]]);
    }
    case "time": {
      const time = parseTime(text);
      if (!time) return send(c.chat_id, T.badTime[L], [[{ text: T.noTime[L], callback_data: "time:none" }]]);
      c.data.time = time; c.step = "city";
      await saveChat(c);
      return send(c.chat_id, T.askCity[L]);
    }
    case "m_name": {
      const name = parseName(text);
      if (!name) return send(c.chat_id, T.badName[L]);
      c.data.partner = { fullName: name }; c.step = "m_date";
      await saveChat(c);
      return send(c.chat_id, fill(T.matchAskDate[L], { name: pname(c) }));
    }
    case "m_date": {
      const date = parseDate(text);
      if (!date) return send(c.chat_id, T.badDate[L]);
      c.data.partner = { ...c.data.partner, date }; c.step = "m_time";
      await saveChat(c);
      return send(c.chat_id, fill(T.matchAskTime[L], { name: pname(c) }), [[{ text: T.noTime[L], callback_data: "mtime:none" }]]);
    }
    case "m_time": {
      const time = parseTime(text);
      if (!time) return send(c.chat_id, T.badTime[L], [[{ text: T.noTime[L], callback_data: "mtime:none" }]]);
      c.data.partner = { ...c.data.partner, time }; c.step = "m_city";
      await saveChat(c);
      return send(c.chat_id, fill(T.matchAskCity[L], { name: pname(c) }));
    }
    case "city":
    case "tzcity":
    case "m_city": {
      const found = searchCities(await loadCities(), text);
      if (!found.length) return send(c.chat_id, T.noCity[L]);
      c.data.cands = found;
      await saveChat(c);
      const prefix = c.step === "city" ? "city" : c.step === "m_city" ? "mcity" : "tzcity";
      return send(c.chat_id, T.pickCity[L], found.map((x, i) => [{ text: `${x[0]}, ${countryName(x[1], L)}`, callback_data: `${prefix}:${i}` }]));
    }
    case "done":
      return (await birthOf(c)) ? send(c.chat_id, T.menu[L], mainKeyboard(L)) : welcome(c);
  }
}

async function onCallback(c: Chat, data: string) {
  const L = c.lang;
  if (data.startsWith("lang:")) {
    const l = data.slice(5) as Lang;
    if (LANGS.includes(l)) c.lang = l;
    await saveChat(c);
    return (await birthOf(c)) ? send(c.chat_id, T.menu[c.lang], mainKeyboard(c.lang)) : welcome(c);
  }
  if (data === "type") return askName(c);
  if (data === "today") return showToday(c);
  if (data === "chart") return showChart(c);
  if (data === "transits") return showTransits(c);
  if (data === "match") return askMatch(c);
  if (data === "weekly:on" || data === "weekly:off") { c.weekly = data === "weekly:on"; await saveChat(c); return showSettings(c); }
  if (data === "mtime:none" && c.step === "m_time") {
    c.data.partner = { ...c.data.partner, time: null }; c.step = "m_city";
    await saveChat(c);
    return send(c.chat_id, fill(T.matchAskCity[L], { name: pname(c) }));
  }
  if (data.startsWith("mcity:") && c.step === "m_city") {
    const x = c.data.cands?.[Number(data.slice(6))];
    const p = c.data.partner ?? {};
    const partner = x && validateBirth({ fullName: p.fullName, date: p.date, time: p.time ?? null, lat: x[2], lon: x[3], tz: x[4], place: `${x[0]}, ${countryName(x[1], L)}` });
    if (!partner) return askMatch(c);
    return showMatch(c, partner);
  }
  if (data.startsWith("hour:")) {
    const h = Number(data.slice(5));
    if (HOURS.includes(h)) { c.send_hour = h; c.daily = true; await saveChat(c); }
    return showSettings(c);
  }
  if (data === "daily:on" || data === "daily:off") { c.daily = data === "daily:on"; await saveChat(c); return showSettings(c); }
  if (data === "tz") { c.step = "tzcity"; c.data = {}; await saveChat(c); return send(c.chat_id, T.tzHint[L]); }
  if (data === "unlink") { c.user_id = null; await saveChat(c); return send(c.chat_id, T.unlinked[L]); }
  if (data === "time:none" && c.step === "time") {
    c.data.time = null; c.step = "city";
    await saveChat(c);
    return send(c.chat_id, T.askCity[L]);
  }
  if (data.startsWith("city:") && c.step === "city") {
    const x = c.data.cands?.[Number(data.slice(5))];
    const birth = x && validateBirth({
      fullName: c.data.fullName, date: c.data.date, time: c.data.time ?? null,
      lat: x[2], lon: x[3], tz: x[4], place: `${x[0]}, ${countryName(x[1], L)}`,
    });
    if (!birth) return askName(c);
    return birthDone(c, birth);
  }
  if (data.startsWith("tzcity:") && c.step === "tzcity") {
    const x = c.data.cands?.[Number(data.slice(7))];
    if (x && isTimeZone(x[4])) c.tz = x[4];
    c.step = "done"; c.data = {};
    await saveChat(c);
    return showSettings(c);
  }
}

/** "@UlduzSpaceBot" typed in any chat: offers today's horoscope to share there. */
async function onInline(q: { id: string; from: { id: number; language_code?: string } }) {
  const c = await loadChat(q.from.id);
  const lang: Lang = c?.lang ?? ((LANGS as string[]).includes(String(q.from.language_code).slice(0, 2)) ? (String(q.from.language_code).slice(0, 2) as Lang) : "az");
  const b = c ? await birthOf(c) : null;
  if (!c || !b) {
    return tg("answerInlineQuery", { inline_query_id: q.id, results: [], cache_time: 10, is_personal: true, button: { text: T.inlineNoBirth[lang], start_parameter: "inline" } });
  }
  const text = shareDay(lang, b, computeChart(b), localNow(c.tz));
  return tg("answerInlineQuery", {
    inline_query_id: q.id, cache_time: 300, is_personal: true,
    results: [{
      type: "article", id: `today-${localNow(c.tz).date}`, title: T.inlineTitle[lang], description: firstName(b.fullName),
      input_message_content: { message_text: text, parse_mode: "HTML", link_preview_options: { is_disabled: true } },
      reply_markup: { inline_keyboard: [[{ text: T.inlineFrom[lang], url: `https://t.me/${botUsername()}?start=inline` }]] },
    }],
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  if (req.headers.get("x-telegram-bot-api-secret-token") !== (await webhookSecret())) return new Response("forbidden", { status: 403 });
  const update = await req.json().catch(() => null);
  if (update?.inline_query) {
    await onInline(update.inline_query).catch((e) => console.error("inline", e));
    return new Response("ok");
  }
  const msg = update?.message;
  const cb = update?.callback_query;
  const chat = msg?.chat ?? cb?.message?.chat;
  // Private chats only; always answer 200 so Telegram doesn't retry the same update forever.
  if (!chat || chat.type !== "private") return new Response("ok");

  const found = await loadChat(chat.id);
  const tgLang = String((msg ?? cb)?.from?.language_code ?? "").slice(0, 2);
  const c = found ?? newChat(chat.id, (LANGS as string[]).includes(tgLang) ? (tgLang as Lang) : "az");
  if (c.blocked) c.blocked = false; // they're writing again, so they unblocked the bot
  try {
    if (cb) {
      await tg("answerCallbackQuery", { callback_query_id: cb.id });
      await onCallback(c, String(cb.data ?? ""));
    } else if (typeof msg?.text === "string") {
      await onText(c, msg.text, !found);
    }
  } catch (e) {
    console.error("telegram-bot", e);
    await send(chat.id, esc(T.error[c.lang])).catch(() => {});
  }
  return new Response("ok");
});
