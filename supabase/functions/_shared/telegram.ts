// Telegram bot: Bot API client, chat storage and setup. Used by telegram-bot (webhook) and telegram-daily (hourly job).
import { validateBirth, type BirthParams } from "./birthcode.ts";
import { db, env, sha256 } from "./http.ts";
import type { Lang } from "./prompt.ts";
import { type City, profileBirth, type ProfileRow } from "./tg-core.ts";

export type Button = { text: string; callback_data?: string; url?: string; web_app?: { url: string } };
export type Keyboard = Button[][];

export interface TgResult { ok: boolean; error_code?: number; description?: string; result?: any }
export async function tg(method: string, body: Record<string, unknown>): Promise<TgResult> {
  const res = await fetch(`https://api.telegram.org/bot${env("TELEGRAM_BOT_TOKEN")}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const out = await res.json().catch(() => ({ ok: false, error_code: res.status }));
  if (!out.ok) console.error("telegram", method, res.status, JSON.stringify(out).slice(0, 300));
  return out;
}
export const send = (chatId: number, text: string, keyboard?: Keyboard) =>
  tg("sendMessage", {
    chat_id: chatId, text, parse_mode: "HTML", link_preview_options: { is_disabled: true },
    ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
  });

export const site = () => env("SITE_URL", "https://ulduz.space").replace(/\/$/, "");

/**
 * The webhook's secret token, derived from the bot token, so there is only one secret to keep.
 * Telegram sends it back in a header with every update.
 */
export const webhookSecret = async () => (await sha256(`ulduz-telegram-webhook:${env("TELEGRAM_BOT_TOKEN")}`)).slice(0, 48);

const COMMANDS: Record<Lang, { command: string; description: string }[]> = {
  az: [
    { command: "today", description: "Bu günün horoskopu" }, { command: "chart", description: "Natal xəritənin xülasəsi" },
    { command: "transits", description: "Böyük tranzitlər" }, { command: "settings", description: "Səhər mesajı" },
    { command: "new", description: "Doğum məlumatlarını dəyiş" }, { command: "lang", description: "Dil" },
  ],
  en: [
    { command: "today", description: "Today's horoscope" }, { command: "chart", description: "Your natal chart summary" },
    { command: "transits", description: "Your big transits" }, { command: "settings", description: "The morning message" },
    { command: "new", description: "Change birth details" }, { command: "lang", description: "Language" },
  ],
  ru: [
    { command: "today", description: "Гороскоп на сегодня" }, { command: "chart", description: "Сводка натальной карты" },
    { command: "transits", description: "Большие транзиты" }, { command: "settings", description: "Утреннее сообщение" },
    { command: "new", description: "Изменить данные рождения" }, { command: "lang", description: "Язык" },
  ],
};

/** Points Telegram at the telegram-bot function and registers the command menu, if that isn't done yet. */
export async function ensureWebhook(): Promise<string> {
  const url = `${env("SUPABASE_URL").replace(/\/$/, "")}/functions/v1/telegram-bot`;
  const info = await tg("getWebhookInfo", {});
  if (info.ok && info.result?.url === url) return "webhook ok";
  const set = await tg("setWebhook", { url, secret_token: await webhookSecret(), allowed_updates: ["message", "callback_query"], drop_pending_updates: true });
  if (!set.ok) return `setWebhook failed: ${set.description ?? set.error_code}`;
  await tg("setMyCommands", { commands: COMMANDS.az });
  await tg("setMyCommands", { commands: COMMANDS.az, language_code: "az" });
  await tg("setMyCommands", { commands: COMMANDS.en, language_code: "en" });
  await tg("setMyCommands", { commands: COMMANDS.ru, language_code: "ru" });
  await tg("setChatMenuButton", { menu_button: { type: "commands" } });
  return "webhook set";
}

// ---------- Cities (the website's own list) ----------
let cities: Promise<City[]> | null = null;
export const loadCities = () =>
  (cities ??= fetch(`${site()}/cities.json`).then((r) => {
    if (!r.ok) throw new Error(`cities.json ${r.status}`);
    return r.json();
  }).catch((e) => { cities = null; throw e; }));

// ---------- Chats ----------
export type Step = "lang" | "name" | "date" | "time" | "city" | "tzcity" | "done";
export interface ChatData { fullName?: string; date?: string; time?: string | null; cands?: City[] }
export interface Chat {
  chat_id: number; user_id: string | null; lang: Lang; step: Step; data: ChatData; birth: BirthParams | null;
  daily: boolean; send_hour: number; tz: string; last_daily: string | null; blocked: boolean;
}
const COLS = "chat_id, user_id, lang, step, data, birth, daily, send_hour, tz, last_daily, blocked";

export async function loadChat(chatId: number): Promise<Chat | null> {
  const { data } = await db().from("tg_chats").select(COLS).eq("chat_id", chatId).maybeSingle();
  return (data as Chat | null) ?? null;
}
export const newChat = (chatId: number, lang: Lang = "az"): Chat => ({
  chat_id: chatId, user_id: null, lang, step: "lang", data: {}, birth: null, daily: true, send_hour: 8, tz: "Asia/Baku", last_daily: null, blocked: false,
});
export async function saveChat(c: Chat) {
  const { error } = await db().from("tg_chats").upsert({
    chat_id: c.chat_id, user_id: c.user_id, lang: c.lang, step: c.step, data: c.data, birth: c.birth,
    daily: c.daily, send_hour: c.send_hour, tz: c.tz, last_daily: c.last_daily, blocked: c.blocked,
  });
  if (error) throw error;
}

const PROFILE_COLS = "full_name, birth_date, birth_time, birth_place, lat, lon, tz, lang";
export async function loadProfile(userId: string): Promise<ProfileRow | null> {
  const { data } = await db().from("profiles").select(PROFILE_COLS).eq("id", userId).maybeSingle();
  return (data as ProfileRow | null) ?? null;
}

/** The birth details to read from: the linked account's, else the ones typed in the bot. */
export async function birthOf(c: Chat, profile?: ProfileRow | null): Promise<BirthParams | null> {
  if (c.user_id) {
    const b = profileBirth(profile !== undefined ? profile : await loadProfile(c.user_id));
    if (b) return validateBirth(b);
  }
  return c.birth ? validateBirth(c.birth) : null;
}
