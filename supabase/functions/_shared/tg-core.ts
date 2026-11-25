// Telegram bot: pure parts shared by the webhook (telegram-bot) and the morning sender (telegram-daily).
// Input parsing, city search, the bot's own texts (az / en / ru) and the messages it sends.
// The horoscope, moon and transit texts come from the website's content library (src/content), so the bot
// and the site always say the same thing. No Deno or network APIs here, so it is unit-tested with vitest.
import { ASPECTS, type Chart } from "./astro.ts";
import type { BirthParams } from "./birthcode.ts";
import { personalDay, type NatalPoint } from "./daily.ts";
import { numerology } from "./numerology.ts";
import type { Lang } from "./prompt.ts";
import { SPHERES } from "./sky.ts";
import { transitAlerts, type AlertPoint, type TransitAlert } from "./transits.ts";
import { PLANETS, SIGN_GLYPHS } from "./zodiac.ts";
import contentAz from "../../../src/content/az.ts";
import contentEn from "../../../src/content/en.ts";
import contentRu from "../../../src/content/ru.ts";
import dailyAz from "../../../src/content/daily/az.ts";
import dailyEn from "../../../src/content/daily/en.ts";
import dailyRu from "../../../src/content/daily/ru.ts";
import skyAz from "../../../src/content/sky/az.ts";
import skyEn from "../../../src/content/sky/en.ts";
import skyRu from "../../../src/content/sky/ru.ts";
import moreAz from "../../../src/content/sky/more-az.ts";
import moreEn from "../../../src/content/sky/more-en.ts";
import moreRu from "../../../src/content/sky/more-ru.ts";
import transAz from "../../../src/content/transits/az.ts";
import transEn from "../../../src/content/transits/en.ts";
import transRu from "../../../src/content/transits/ru.ts";
import { formatDate, formatDayMonth } from "../../../src/lib/date.ts";

export const LANGS: Lang[] = ["az", "en", "ru"];
const C = { az: contentAz, en: contentEn, ru: contentRu };
const D = { az: dailyAz, en: dailyEn, ru: dailyRu };
const S = { az: skyAz, en: skyEn, ru: skyRu };
const M = { az: moreAz, en: moreEn, ru: moreRu };
const TR = { az: transAz, en: transEn, ru: transRu };

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const strip = (g: string) => g.replace(/︎/g, "");

// ---------- Parsing ----------
/** Accepts 15.06.1995, 15/06/1995, 15-06-1995, 15 06 1995 or 1995-06-15. Returns YYYY-MM-DD or null. */
export function parseDate(s: string, now = new Date()): string | null {
  const t = s.trim();
  let y: number, m: number, d: number;
  let r = t.match(/^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{4})$/);
  if (r) { d = +r[1]; m = +r[2]; y = +r[3]; }
  else if ((r = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) { y = +r[1]; m = +r[2]; d = +r[3]; }
  else return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (y < 1900 || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  if (dt.getTime() > now.getTime()) return null;
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

/** The account-link code in "/start <code>" (what the website's deep link carries). */
export function startCode(text: string): string | null {
  const m = text.trim().match(/^\/start(?:@\w+)?\s+([A-Za-z0-9_-]{16,64})$/);
  return m ? m[1] : null;
}

// ---------- Cities (same list and matching as the website) ----------
export type City = [name: string, country: string, lat: number, lon: number, tz: string, aliases?: string[]];

const AZ_MAP: Record<string, string> = { "ə": "e", "ı": "i", "ş": "s", "ç": "c", "ğ": "g", "ö": "o", "ü": "u" };
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

// ---------- Birth data from an account profile ----------
export interface ProfileRow {
  full_name: string | null; birth_date: string | null; birth_time: string | null; birth_place: string | null;
  lat: number | null; lon: number | null; tz: string | null; lang?: string | null;
}
/** Same rule as the website (src/lib/profileBirth.ts): a time only counts together with a place. */
export function profileBirth(p: ProfileRow | null | undefined): BirthParams | null {
  if (!p?.full_name || !p.birth_date) return null;
  const hasPlace = p.lat != null && p.lon != null;
  return {
    fullName: p.full_name, date: p.birth_date, time: hasPlace ? p.birth_time : null,
    lat: hasPlace ? p.lat : null, lon: hasPlace ? p.lon : null, tz: hasPlace ? p.tz ?? "UTC" : "UTC", place: hasPlace ? p.birth_place : null,
  };
}

/** Local date and hour in a time zone. */
export function localNow(tz: string, now = new Date()): { date: string; hour: number; y: number; m: number; d: number } {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(now);
  } catch {
    return localNow("Asia/Baku", now);
  }
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const y = get("year"), m = get("month"), d = get("day");
  return { date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`, hour: get("hour") % 24, y, m, d };
}

export const isTimeZone = (tz: string) => { try { new Intl.DateTimeFormat("en", { timeZone: tz }); return true; } catch { return false; } };

// ---------- Bot texts ----------
type L3 = Record<Lang, string>;
export const T = {
  chooseLang: "✦ Ulduz\n\nDil seçin · Choose a language · Выбери язык",
  welcome: {
    az: "Salam! Mən Ulduzam ✨\n\nHər səhər sənə şəxsi gündəlik horoskopunu, Ay qeydlərini və həyatındakı böyük tranzitlər haqqında xəbərdarlıqları göndərəcəyəm.\n\nBunun üçün doğum məlumatların lazımdır. Ulduz hesabın varsa, onu qoş, yoxdursa, məlumatları burada yaz.",
    en: "Hi! I'm Ulduz ✨\n\nEvery morning I'll send you your personal daily horoscope, moon notes and alerts about the big transits in your life.\n\nFor that I need your birth details. If you have an Ulduz account, connect it. If not, just type them here.",
    ru: "Привет! Я Ulduz ✨\n\nКаждое утро я буду присылать тебе личный гороскоп на день, заметки о Луне и предупреждения о больших транзитах в твоей жизни.\n\nДля этого нужны данные рождения. Если у тебя есть аккаунт Ulduz, подключи его. Если нет, просто напиши их здесь.",
  },
  connectAccount: { az: "🔗 Ulduz hesabımı qoş", en: "🔗 Connect my Ulduz account", ru: "🔗 Подключить аккаунт Ulduz" },
  typeHere: { az: "✍️ Məlumatları burada yazım", en: "✍️ Type my details here", ru: "✍️ Напишу данные здесь" },
  connectHow: {
    az: "Saytda hesabına gir və «Telegram-ı qoş» düyməsini bas. Mən səni dərhal tanıyacağam.",
    en: "Sign in on the website and tap “Connect Telegram”. I'll recognise you right away.",
    ru: "Войди в аккаунт на сайте и нажми «Подключить Telegram». Я сразу тебя узнаю.",
  },
  linked: {
    az: "Hazırdır, {name}! Ulduz hesabın bu çata qoşuldu ✨",
    en: "Done, {name}! Your Ulduz account is now connected to this chat ✨",
    ru: "Готово, {name}! Твой аккаунт Ulduz подключён к этому чату ✨",
  },
  linkedNoBirth: {
    az: "Hesabında hələ doğum məlumatları yoxdur. Onları saytda əlavə et və ya burada yaz: /new",
    en: "Your account has no birth details yet. Add them on the website or type them here: /new",
    ru: "В аккаунте пока нет данных рождения. Добавь их на сайте или напиши здесь: /new",
  },
  badLink: {
    az: "Bu keçid artıq etibarlı deyil. Saytdakı hesab səhifəsindən «Telegram-ı qoş» düyməsini yenidən bas.",
    en: "This link has expired. Tap “Connect Telegram” on your account page on the website again.",
    ru: "Эта ссылка уже недействительна. Нажми «Подключить Telegram» на странице аккаунта ещё раз.",
  },
  askName: {
    az: "Gəl sənin natal xəritəni quraq ✨\n\nAdın və soyadın necədir?",
    en: "Let's build your natal chart ✨\n\nWhat is your full name?",
    ru: "Давай построим твою натальную карту ✨\n\nКак тебя зовут? Напиши имя и фамилию.",
  },
  badName: { az: "Adını hərflərlə yaz, məsələn: Aysel Həsənova", en: "Please write your name in letters, e.g. Emma Stone", ru: "Напиши имя буквами, например: Айсель Гасанова" },
  askDate: {
    az: "Doğum tarixin? Formatı: <b>GG.AA.İİİİ</b>, məsələn 15.06.1995",
    en: "Your date of birth? Format: <b>DD.MM.YYYY</b>, e.g. 15.06.1995",
    ru: "Дата рождения? Формат: <b>ДД.ММ.ГГГГ</b>, например 15.06.1995",
  },
  badDate: { az: "Tarixi tanıya bilmədim. Belə yaz: 15.06.1995", en: "I couldn't read that date. Try like this: 15.06.1995", ru: "Не получилось разобрать дату. Напиши так: 15.06.1995" },
  askTime: {
    az: "Doğum saatın? Məsələn <b>08:30</b>. Bilmirsənsə, aşağıdakı düyməni bas: onda Asendent və evlər hesablanmayacaq.",
    en: "Your time of birth? E.g. <b>08:30</b>. If you don't know it, tap the button below: the Ascendant and houses will be left out.",
    ru: "Время рождения? Например <b>08:30</b>. Если не знаешь, нажми кнопку ниже: тогда Асцендент и дома не будут рассчитаны.",
  },
  noTime: { az: "Saatı bilmirəm", en: "I don't know", ru: "Не знаю" },
  badTime: { az: "Saatı belə yaz: 08:30", en: "Please write the time like this: 08:30", ru: "Напиши время так: 08:30" },
  askCity: { az: "Hansı şəhərdə doğulmusan?", en: "Which city were you born in?", ru: "В каком городе ты родился(ась)?" },
  pickCity: { az: "Hansıdır?", en: "Which one?", ru: "Какой из них?" },
  noCity: {
    az: "Belə şəhər tapmadım. Başqa yazılışla və ya yaxın böyük şəhəri yaz.",
    en: "I couldn't find that city. Try another spelling or the nearest big city.",
    ru: "Не нашла такой город. Попробуй другое написание или ближайший крупный город.",
  },
  saved: {
    az: "Yadda saxladım ✨ Hər səhər saat {hour}:00-da ({tz}) gündəlik horoskopunu göndərəcəyəm. Vaxtı /settings ilə dəyişə bilərsən.",
    en: "Saved ✨ I'll send your daily horoscope every morning at {hour}:00 ({tz}). Change it any time with /settings.",
    ru: "Сохранила ✨ Буду присылать гороскоп каждое утро в {hour}:00 ({tz}). Время можно поменять в /settings.",
  },
  noBirth: {
    az: "Əvvəlcə doğum məlumatların lazımdır.",
    en: "First I need your birth details.",
    ru: "Сначала мне нужны твои данные рождения.",
  },
  menu: {
    az: "Nə göstərim?\n\n/today — bu günün horoskopu\n/chart — natal xəritənin xülasəsi\n/transits — böyük tranzitlər\n/settings — səhər mesajı\n/new — doğum məlumatlarını dəyiş\n/lang — dil",
    en: "What shall I show you?\n\n/today — today's horoscope\n/chart — your natal chart summary\n/transits — your big transits\n/settings — the morning message\n/new — change birth details\n/lang — language",
    ru: "Что показать?\n\n/today — гороскоп на сегодня\n/chart — сводка натальной карты\n/transits — большие транзиты\n/settings — утреннее сообщение\n/new — изменить данные рождения\n/lang — язык",
  },
  btnToday: { az: "☀️ Bu gün", en: "☀️ Today", ru: "☀️ Сегодня" },
  btnChart: { az: "🌌 Xəritəm", en: "🌌 My chart", ru: "🌌 Моя карта" },
  btnTransits: { az: "🪐 Tranzitlər", en: "🪐 Transits", ru: "🪐 Транзиты" },
  openSite: { az: "✦ Saytda aç", en: "✦ Open on Ulduz", ru: "✦ Открыть на Ulduz" },
  fullChart: { az: "🌌 Tam xəritə", en: "🌌 Full chart", ru: "🌌 Полная карта" },
  settings: {
    az: "Səhər mesajı: <b>{state}</b>\nVaxt: <b>{hour}:00</b>, {tz}",
    en: "Morning message: <b>{state}</b>\nTime: <b>{hour}:00</b>, {tz}",
    ru: "Утреннее сообщение: <b>{state}</b>\nВремя: <b>{hour}:00</b>, {tz}",
  },
  on: { az: "açıq", en: "on", ru: "включено" },
  off: { az: "bağlı", en: "off", ru: "выключено" },
  turnOn: { az: "🔔 Aç", en: "🔔 Turn on", ru: "🔔 Включить" },
  turnOff: { az: "🔕 Bağla", en: "🔕 Turn off", ru: "🔕 Выключить" },
  pickTz: { az: "🌍 Saat qurşağı", en: "🌍 Time zone", ru: "🌍 Часовой пояс" },
  tzHint: {
    az: "Hansı şəhərdə yaşayırsan? Saat qurşağını ondan götürəcəyəm.",
    en: "Which city do you live in? I'll take the time zone from it.",
    ru: "В каком городе ты живёшь? Возьму часовой пояс оттуда.",
  },
  unlink: { az: "Hesabı ayır", en: "Disconnect account", ru: "Отключить аккаунт" },
  unlinked: {
    az: "Hesab bu çatdan ayrıldı. Doğum məlumatlarını burada yazmaq üçün /new.",
    en: "Your account is disconnected from this chat. Send /new to type your birth details here.",
    ru: "Аккаунт отключён от этого чата. Чтобы ввести данные здесь, напиши /new.",
  },
  stopped: {
    az: "Səhər mesajlarını dayandırdım. Yenidən açmaq üçün /settings.",
    en: "Morning messages are off. Turn them back on with /settings.",
    ru: "Утренние сообщения выключены. Включить снова: /settings.",
  },
  error: { az: "Nəsə alınmadı. Bir az sonra yenidən yoxla.", en: "Something went wrong. Please try again a little later.", ru: "Что-то пошло не так. Попробуй чуть позже." },
  // chart summary
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
  // daily message
  dayFor: { az: "{name}, sənin günün · {date}", en: "{name}, your day · {date}", ru: "{name}, твой день · {date}" },
  moonNotes: { az: "Ay qeydləri", en: "Moon notes", ru: "Заметки о Луне" },
  transitToday: { az: "Tranzit xəbərdarlığı", en: "Transit alert", ru: "Транзит" },
  begins: { az: "bu gün başlayır", en: "begins today", ru: "начинается сегодня" },
  exactToday: { az: "bu gün dəqiqdir", en: "exact today", ru: "точный сегодня" },
} satisfies Record<string, string | L3>;

export const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
export const firstName = (fullName: string) => {
  const f = fullName.trim().split(/\s+/)[0] ?? "";
  return f.charAt(0).toLocaleUpperCase() + f.slice(1);
};

const glyph = (k: string) => strip(PLANETS.find((p) => p.key === k)?.glyph ?? "");
const symbol = (t: string) => ASPECTS.find((a) => a.type === t)!.symbol;
const dots = (n: number) => "●".repeat(n) + "○".repeat(5 - n);
const signName = (lang: Lang, i: number) => `${strip(SIGN_GLYPHS[i])} ${C[lang].signNames[i]}`;

// ---------- Messages ----------
/** Natal chart summary: Sun, Moon and Ascendant with one line each from the site's sign texts, plus the Life Path. */
export function chartSummary(lang: Lang, birth: BirthParams, chart: Chart): string {
  const c = C[lang];
  const nm = numerology(birth.fullName, birth.date);
  const sun = chart.pos.Sun.sign, moon = chart.pos.Moon.sign;
  const L: string[] = [`<b>${esc(firstName(birth.fullName))}</b> ✦ ${esc(formatDate(birth.date, lang))}${birth.place ? `, ${esc(birth.place)}` : ""}`, ""];
  L.push(`☉ <b>${T.sun[lang]}: ${signName(lang, sun)}</b>`, esc(c.signs[sun].core), "");
  const moonLabel = chart.moonAlt != null ? `${signName(lang, moon)} ${T.moonOr[lang]} ${signName(lang, chart.moonAlt)}` : signName(lang, moon);
  L.push(`☽ <b>${T.moon[lang]}: ${moonLabel}</b>`, esc(c.signs[moon].need), "");
  if (chart.angles) {
    const asc = Math.floor(chart.angles.asc / 30) % 12;
    L.push(`↑ <b>${T.asc[lang]}: ${signName(lang, asc)}</b>`, esc(c.signs[asc].first), "");
  }
  L.push(`✧ ${T.lifePath[lang]}: <b>${nm.lifePath}</b>`);
  if (!chart.angles) L.push("", `<i>${T.noAsc[lang]}</i>`);
  return L.join("\n");
}

const alertPointName = (lang: Lang, k: AlertPoint) => (k === "Asc" ? D[lang].ui.asc : k === "MC" ? "MC" : C[lang].planetNames[k]);
const natalPointName = (lang: Lang, k: NatalPoint) => (k === "Asc" ? D[lang].ui.asc : C[lang].planetNames[k]);

function alertLine(lang: Lang, a: TransitAlert, note?: string): string {
  const tc = TR[lang], c = C[lang];
  const day = (iso: string) => formatDayMonth(new Date(iso + "T12:00:00Z"), lang);
  const head = `${glyph(a.planet)} <b>${c.planetNames[a.planet]} ${symbol(a.type)} ${alertPointName(lang, a.point)}</b>${note ? ` · <i>${note}</i>` : ""}`;
  return [head, esc(tc.planets[a.planet][a.kind]), `<i>${esc(tc.ui.period(day(a.start), day(a.end)))}</i>`].join("\n");
}

/** Alerts that start or are exact on `date` (YYYY-MM-DD), for the morning message. */
export function alertsForDay(alerts: TransitAlert[], date: string): { a: TransitAlert; note: "begins" | "exact" }[] {
  const out: { a: TransitAlert; note: "begins" | "exact" }[] = [];
  for (const a of alerts) {
    if (a.exact.includes(date)) out.push({ a, note: "exact" });
    else if (a.start === date) out.push({ a, note: "begins" });
  }
  return out;
}

/** The /transits answer: what is active now, then the next few coming up. */
export function transitsMessage(lang: Lang, chart: Chart, now = new Date()): string {
  const tc = TR[lang];
  const alerts = transitAlerts(chart, now);
  if (!alerts.length) return `🪐 <b>${tc.ui.title}</b>\n\n${esc(tc.ui.none)}`;
  const active = alerts.filter((a) => a.active), soon = alerts.filter((a) => !a.active).slice(0, 3);
  const L = [`🪐 <b>${tc.ui.title}</b>`];
  if (active.length) L.push("", `<b>${tc.ui.now}</b>`, ...active.slice(0, 4).map((a) => `\n${alertLine(lang, a)}`));
  if (soon.length) L.push("", `<b>${tc.ui.soon}</b>`, ...soon.map((a) => `\n${alertLine(lang, a)}`));
  if (!chart.timeKnown) L.push("", `<i>${esc(tc.ui.noTimeNote)}</i>`);
  return L.join("\n");
}

/**
 * The morning message: the tone of the day, the Moon's house with a tip, today's contacts with the birth chart,
 * the forecast by area, moon notes (phase, lunar day, what the Moon's sign is good for, haircut, retrogrades)
 * and any big transit that begins or is exact today.
 */
export function dailyMessage(lang: Lang, birth: BirthParams, chart: Chart, day: { y: number; m: number; d: number }): string {
  const dc = D[lang], c = C[lang], sc = S[lang], sm = M[lang];
  const pd = personalDay(chart, day.y, day.m, day.d);
  const house = dc.houses[pd.moonHouse - 1];
  const L: string[] = [];
  L.push(`✦ <b>${esc(fill(T.dayFor[lang], { name: firstName(birth.fullName), date: formatDate(pd.date, lang) }))}</b>`, "");
  L.push(`${dots(pd.overall)}  <b>${dc.ui.overallTitle}</b>`, esc(dc.ui.overall[pd.overall - 1]), "");
  L.push(`${strip(SIGN_GLYPHS[pd.moonSign])} <b>${esc(dc.ui.moonTitle(c.ordinal(pd.moonHouse), c.signIn[pd.moonSign]))}</b>`, esc(house.focus));
  L.push(`💡 ${esc(house.tip)}`, "");

  if (pd.transits.length) {
    L.push(`<b>${dc.ui.transitsTitle}</b>`);
    for (const t of pd.transits) {
      const tone = t.soft === true ? "soft" : t.soft === false ? "hard" : "conj";
      L.push(`${glyph(t.body)} ${c.planetNames[t.body]} ${symbol(t.type)} ${t.point === "Asc" ? "↑" : glyph(t.point)} ${natalPointName(lang, t.point)}: ${esc(dc.bodies[t.body][tone])}`);
    }
    L.push("");
  }

  L.push(`<b>${dc.ui.spheresTitle}</b>`);
  for (const k of SPHERES) L.push(`${dots(pd.spheres[k])}  ${sm.ui.sphereNames[k]}: ${sm.ui.sphereLevels[pd.spheres[k] - 1]}`);
  L.push("");

  // Moon notes
  const sky = pd.sky, ms = sc.moonSigns[sky.moonSign];
  const [ldSymbol, ldText] = sm.lunarDays[sky.lunarDay - 1] ?? ["", ""];
  L.push(`🌙 <b>${T.moonNotes[lang]}</b>`);
  L.push(`${sc.phases[sky.phase].name}, ${sc.ui.illumination(sky.illumination)}. ${esc(sc.phases[sky.phase].text)}`);
  L.push(`${esc(sm.ui.lunarDayTitle(sky.lunarDay, ldSymbol))}: ${esc(ldText)}`);
  L.push(`${esc(sc.ui.moonIn(c.signIn[sky.moonSign]))}: ${esc(ms.mood)}.`);
  L.push(`✅ ${sc.ui.doTitle}: ${esc(ms.do.join(", ").toLocaleLowerCase(lang))}`);
  L.push(`⛔ ${sc.ui.avoidTitle}: ${esc(ms.avoid.join(", ").toLocaleLowerCase(lang))}`);
  L.push(`✂️ ${sc.ui.haircutTitle}: ${sc.ui.verdict[sky.haircut]}`);
  const named = (["Mercury", "Venus", "Mars"] as const).filter((k) => sky.retro.includes(k));
  for (const k of named) L.push(`℞ ${esc(sc.retro[k] ?? "")}`);

  const today = alertsForDay(transitAlerts(chart, new Date(pd.date + "T12:00:00Z"), 1), pd.date);
  if (today.length) {
    L.push("", `🪐 <b>${T.transitToday[lang]}</b>`);
    for (const { a, note } of today) L.push("", alertLine(lang, a, note === "exact" ? T.exactToday[lang] : T.begins[lang]));
  }
  return L.join("\n");
}
