// Telegram bot helpers: Bot API client, input parsing, city search and the bot's texts (az / en / ru).
import type { Chart } from "./astro.ts";
import { SIGNS, signOf } from "./astro.ts";
import { db, env } from "./http.ts";
import { readingUrl } from "./orders.ts";
import type { Lang } from "./prompt.ts";

// ---------- Bot API ----------
export type Button = { text: string; callback_data?: string; url?: string; web_app?: { url: string } };
export type Keyboard = Button[][];

export async function tg(method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${env("TELEGRAM_BOT_TOKEN")}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const out = await res.json().catch(() => ({}));
  if (!out.ok) console.error("telegram", method, res.status, JSON.stringify(out).slice(0, 300));
  return out;
}
export const send = (chatId: number, text: string, keyboard?: Keyboard) =>
  tg("sendMessage", {
    chat_id: chatId, text, parse_mode: "HTML", link_preview_options: { is_disabled: true },
    ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
  });

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---------- Parsing ----------
/** Accepts 15.06.1995, 15/06/1995, 15-06-1995, 15 06 1995 or 1995-06-15. Returns YYYY-MM-DD or null. */
export function parseDate(s: string): string | null {
  const t = s.trim();
  let y: number, m: number, d: number;
  let r = t.match(/^(\d{1,2})[.\/\-\s](\d{1,2})[.\/\-\s](\d{4})$/);
  if (r) { d = +r[1]; m = +r[2]; y = +r[3]; }
  else if ((r = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) { y = +r[1]; m = +r[2]; d = +r[3]; }
  else return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (y < 1900 || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  if (dt.getTime() > Date.now()) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Accepts 8:30, 08:30, 08.30, 0830. Returns HH:MM or null. */
export function parseTime(s: string): string | null {
  const r = s.trim().match(/^(\d{1,2})[:.\s]?(\d{2})$/);
  if (!r) return null;
  const h = +r[1], mi = +r[2];
  if (h > 23 || mi > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}

export function parseName(s: string): string | null {
  const t = s.trim().replace(/\s+/g, " ");
  if (t.length < 2 || t.length > 120 || t.startsWith("/") || !/\p{L}/u.test(t)) return null;
  return t;
}

// ---------- Cities (same list and matching as the website) ----------
export type City = [name: string, country: string, lat: number, lon: number, tz: string, aliases?: string[]];
let cities: Promise<City[]> | null = null;
export const loadCities = () =>
  (cities ??= fetch(`${env("SITE_URL").replace(/\/$/, "")}/cities.json`).then((r) => {
    if (!r.ok) throw new Error(`cities.json ${r.status}`);
    return r.json();
  }).catch((e) => { cities = null; throw e; }));

const AZ_MAP: Record<string, string> = { "ə": "e", "ı": "i", "ş": "s", "ç": "c", "ğ": "g", "ö": "o", "ü": "u", "i̇": "i" };
export const fold = (s: string) =>
  [...s.toLocaleLowerCase()].map((c) => AZ_MAP[c] ?? c).join("").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ё/g, "е");

export function searchCities(all: City[], q: string, limit = 6): City[] {
  const f = fold(q.trim());
  if (f.length < 2) return [];
  const starts: City[] = [], contains: City[] = [];
  for (const c of all) {
    const names = [c[0], ...(c[5] ?? [])].map(fold);
    if (names.some((n) => n.startsWith(f))) starts.push(c);
    else if (names.some((n) => n.includes(f))) contains.push(c);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

export function countryName(code: string, lang: Lang) {
  try { return new Intl.DisplayNames([lang], { type: "region" }).of(code) ?? code; } catch { return code; }
}

// ---------- Texts ----------
const SIGN_NAMES: Record<Lang, string[]> = {
  az: ["Qoç", "Buğa", "Əkizlər", "Xərçəng", "Şir", "Qız", "Tərəzi", "Əqrəb", "Oxatan", "Oğlaq", "Dolça", "Balıqlar"],
  en: [...SIGNS],
  ru: ["Овен", "Телец", "Близнецы", "Рак", "Лев", "Дева", "Весы", "Скорпион", "Стрелец", "Козерог", "Водолей", "Рыбы"],
};
const GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const signByIndex = (lang: Lang, i: number) => `${GLYPHS[i]} ${SIGN_NAMES[lang][i]}`;
export const signName = (lang: Lang, lon: number) => signByIndex(lang, signOf(lon));

export const T = {
  chooseLang: "✦ Ulduz\n\nDil seçin · Choose a language · Выбери язык",
  askName: {
    az: "Gəl sənin natal xəritəni quraq ✨\n\nAdın və soyadın necədir?",
    en: "Let's build your natal chart ✨\n\nWhat is your full name?",
    ru: "Давай построим твою натальную карту ✨\n\nКак тебя зовут? Напиши имя и фамилию.",
  },
  badName: {
    az: "Adını hərflərlə yaz, məsələn: Aysel Həsənova",
    en: "Please write your name in letters, e.g. Emma Stone",
    ru: "Напиши имя буквами, например: Айсель Гасанова",
  },
  askDate: {
    az: "Doğum tarixin? Formatı: <b>GG.AA.İİİİ</b>, məsələn 15.06.1995",
    en: "Your date of birth? Format: <b>DD.MM.YYYY</b>, e.g. 15.06.1995",
    ru: "Дата рождения? Формат: <b>ДД.ММ.ГГГГ</b>, например 15.06.1995",
  },
  badDate: {
    az: "Tarixi tanıya bilmədim. Belə yaz: 15.06.1995",
    en: "I couldn't read that date. Try like this: 15.06.1995",
    ru: "Не получилось разобрать дату. Напиши так: 15.06.1995",
  },
  askTime: {
    az: "Doğum saatın? Məsələn <b>08:30</b>. Bilmirsənsə, aşağıdakı düyməni bas — onda Asendent və evlər hesablanmayacaq.",
    en: "Your time of birth? E.g. <b>08:30</b>. If you don't know it, tap the button below — the Ascendant and houses will be left out.",
    ru: "Время рождения? Например <b>08:30</b>. Если не знаешь, нажми кнопку ниже — тогда Асцендент и дома не будут рассчитаны.",
  },
  noTime: { az: "Saatı bilmirəm", en: "I don't know", ru: "Не знаю" },
  badTime: {
    az: "Saatı belə yaz: 08:30",
    en: "Please write the time like this: 08:30",
    ru: "Напиши время так: 08:30",
  },
  askCity: {
    az: "Hansı şəhərdə doğulmusan?",
    en: "Which city were you born in?",
    ru: "В каком городе ты родился(ась)?",
  },
  pickCity: { az: "Hansıdır?", en: "Which one?", ru: "Какой из них?" },
  noCity: {
    az: "Belə şəhər tapmadım. Başqa yazılışla və ya yaxın böyük şəhəri yaz.",
    en: "I couldn't find that city. Try another spelling or the nearest big city.",
    ru: "Не нашла такой город. Попробуй другое написание или ближайший крупный город.",
  },
  computing: { az: "Ulduzlara baxıram… ✨", en: "Looking at the stars… ✨", ru: "Смотрю на звёзды… ✨" },
  fullChart: { az: "🌌 Tam xəritə", en: "🌌 Full chart", ru: "🌌 Полная карта" },
  buy: { az: "✨ Şəxsi oxunuş — 2 ₼", en: "✨ Personal reading — 2 ₼", ru: "✨ Личный разбор — 2 ₼" },
  again: { az: "🔄 Başqa xəritə", en: "🔄 Another chart", ru: "🔄 Другая карта" },
  buyIntro: {
    az: "Şəxsi oxunuş — sənin xəritənə əsasən yazılmış ətraflı mətn: xarakterin, münasibətlər, istedadlar, iş və indiki dövrün. Sonra 3 sual da verə bilərsən.",
    en: "A personal reading is a detailed text written from your chart: your character, love, gifts, work and the chapter you're in now. You can then ask 3 follow-up questions.",
    ru: "Личный разбор — подробный текст по твоей карте: характер, отношения, таланты, работа и период, в котором ты сейчас. Потом можно задать 3 уточняющих вопроса.",
  },
  pay: { az: "💳 Ödə — 2 ₼", en: "💳 Pay — 2 ₼", ru: "💳 Оплатить — 2 ₼" },
  payNote: {
    az: "Ödəniş Epoint ilə təhlükəsizdir. Ödənişdən sonra oxunuş linkini buraya göndərəcəyəm.",
    en: "Payment is handled securely by Epoint. Once it goes through, I'll send your reading here.",
    ru: "Оплата проходит безопасно через Epoint. Как только она пройдёт, я пришлю разбор сюда.",
  },
  ready: {
    az: "Ödəniş alındı, təşəkkürlər! 🌟 Şəxsi oxunuşun hazırdır:",
    en: "Payment received — thank you! 🌟 Your personal reading is ready:",
    ru: "Оплата получена, спасибо! 🌟 Твой личный разбор готов:",
  },
  openReading: { az: "📖 Oxunuşu aç", en: "📖 Open my reading", ru: "📖 Открыть разбор" },
  noChart: {
    az: "Əvvəlcə xəritəni quraq. /start yaz.",
    en: "Let's build your chart first — send /start.",
    ru: "Сначала построим карту — напиши /start.",
  },
  done: {
    az: "Yeni xəritə üçün /new, dili dəyişmək üçün /lang yaz.",
    en: "Send /new for another chart or /lang to change the language.",
    ru: "Напиши /new для новой карты или /lang, чтобы сменить язык.",
  },
  tooMany: {
    az: "Çox sayda sifariş var. Bir az sonra yenidən yoxla.",
    en: "Too many orders for now. Please try again a bit later.",
    ru: "Слишком много заказов подряд. Попробуй чуть позже.",
  },
  error: {
    az: "Nəsə alınmadı. Bir az sonra yenidən yoxla.",
    en: "Something went wrong. Please try again a little later.",
    ru: "Что-то пошло не так. Попробуй чуть позже.",
  },
  sun: { az: "Günəş", en: "Sun", ru: "Солнце" },
  moon: { az: "Ay", en: "Moon", ru: "Луна" },
  asc: { az: "Asendent", en: "Ascendant", ru: "Асцендент" },
  moonOr: { az: "və ya", en: "or", ru: "или" },
  lifePath: { az: "Həyat yolu rəqəmi", en: "Life Path number", ru: "Число жизненного пути" },
  noAsc: {
    az: "Doğum saatı olmadan Asendent və evlər hesablanmır.",
    en: "Without a birth time the Ascendant and houses can't be calculated.",
    ru: "Без времени рождения Асцендент и дома не рассчитываются.",
  },
} as const;

export function chartSummary(lang: Lang, firstName: string, c: Chart, lifePath: number): string {
  const L: string[] = [`<b>${esc(firstName)}</b> ✦`, ""];
  L.push(`☉ ${T.sun[lang]}: ${signName(lang, c.pos.Sun.lon)}`);
  const moon = signName(lang, c.pos.Moon.lon);
  // moonAlt is a sign index: the Moon changed sign on the birth date and the time is unknown.
  L.push(`☽ ${T.moon[lang]}: ${c.moonAlt != null ? `${moon} ${T.moonOr[lang]} ${signByIndex(lang, c.moonAlt)}` : moon}`);
  if (c.angles) L.push(`↑ ${T.asc[lang]}: ${signName(lang, c.angles.asc)}`);
  L.push(`✧ ${T.lifePath[lang]}: ${lifePath}`);
  if (!c.angles) L.push("", `<i>${T.noAsc[lang]}</i>`);
  return L.join("\n");
}

// ---------- Paid-order notification (used by the bot in test mode and by epoint-callback) ----------

/** Sends the reading link to the chat that placed a paid order. Safe to call more than once: sends at most once. */
export async function notifyOrderPaid(orderId: string, lang: Lang) {
  const sb = db();
  const { data: row } = await sb.from("tg_order_tokens").update({ notified_at: new Date().toISOString() })
    .eq("order_id", orderId).is("notified_at", null).select("chat_id, token").maybeSingle();
  if (!row) return;
  await send(row.chat_id, T.ready[lang], [[{ text: T.openReading[lang], web_app: { url: readingUrl(lang, orderId, row.token) } }]]);
}
