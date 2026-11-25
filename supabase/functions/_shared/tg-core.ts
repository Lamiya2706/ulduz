// Telegram bot: pure parts shared by the webhook (telegram-bot) and the morning sender (telegram-daily).
// Input parsing, city search, the bot's own texts (az / en / ru) and the messages it sends.
// The horoscope, moon and transit texts come from the website's content library (src/content), so the bot
// and the site always say the same thing. No Deno or network APIs here, so it is unit-tested with vitest.
import * as Astronomy from "npm:astronomy-engine@2.1.19";
import { ASPECTS, computeChart, planetLon, signOf, type Chart, type PlanetKey } from "./astro.ts";
import type { BirthParams } from "./birthcode.ts";
import { personalDay, type NatalPoint } from "./daily.ts";
import { numerology } from "./numerology.ts";
import type { Lang } from "./prompt.ts";
import { skyDetails, SPHERES } from "./sky.ts";
import { synastry, SYN_CATEGORIES, type SynPoint } from "./synastry.ts";
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
import compatAz from "../../../src/content/compat/az.ts";
import compatEn from "../../../src/content/compat/en.ts";
import compatRu from "../../../src/content/compat/ru.ts";
import fullAz from "../../../src/content/fullmoon/az.ts";
import fullEn from "../../../src/content/fullmoon/en.ts";
import fullRu from "../../../src/content/fullmoon/ru.ts";
import { formatDate, formatDayMonth } from "../../../src/lib/date.ts";

export const LANGS: Lang[] = ["az", "en", "ru"];
const C = { az: contentAz, en: contentEn, ru: contentRu };
const D = { az: dailyAz, en: dailyEn, ru: dailyRu };
const S = { az: skyAz, en: skyEn, ru: skyRu };
const M = { az: moreAz, en: moreEn, ru: moreRu };
const TR = { az: transAz, en: transEn, ru: transRu };
const CC = { az: compatAz, en: compatEn, ru: compatRu };
const FM = { az: fullAz, en: fullEn, ru: fullRu };

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
    az: "Nə göstərim?\n\n/today — bu günün horoskopu\n/chart — natal xəritənin xülasəsi\n/transits — böyük tranzitlər\n/match — uyğunluq\n/settings — səhər mesajı\n/new — doğum məlumatlarını dəyiş\n/lang — dil",
    en: "What shall I show you?\n\n/today — today's horoscope\n/chart — your natal chart summary\n/transits — your big transits\n/match — compatibility with someone\n/settings — the morning message\n/new — change birth details\n/lang — language",
    ru: "Что показать?\n\n/today — гороскоп на сегодня\n/chart — сводка натальной карты\n/transits — большие транзиты\n/match — совместимость\n/settings — утреннее сообщение\n/new — изменить данные рождения\n/lang — язык",
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
  // compatibility
  btnMatch: { az: "💞 Uyğunluq", en: "💞 Compatibility", ru: "💞 Совместимость" },
  matchAskName: {
    az: "Gəl uyğunluğunuza baxaq 💞\n\nQarşı tərəfin adı nədir?",
    en: "Let's look at your compatibility 💞\n\nWhat is the other person's name?",
    ru: "Давай посмотрим вашу совместимость 💞\n\nКак зовут второго человека?",
  },
  matchAskDate: {
    az: "{name} nə vaxt doğulub? Məsələn 15.06.1995",
    en: "When was {name} born? E.g. 15.06.1995",
    ru: "Когда родился(ась) {name}? Например 15.06.1995",
  },
  matchAskTime: {
    az: "{name} saat neçədə doğulub? Bilmirsənsə, düyməni bas.",
    en: "What time was {name} born? If you don't know, tap the button.",
    ru: "Во сколько родился(ась) {name}? Если не знаешь, нажми кнопку.",
  },
  matchAskCity: { az: "{name} hansı şəhərdə doğulub?", en: "Which city was {name} born in?", ru: "В каком городе родился(ась) {name}?" },
  matchTitle: { az: "{a} və {b}: uyğunluq", en: "{a} & {b}: compatibility", ru: "{a} и {b}: совместимость" },
  matchContacts: { az: "Ən güclü əlaqələr", en: "The strongest contacts", ru: "Самые сильные связи" },
  matchOpen: { az: "💞 Tam analiz saytda", en: "💞 Full analysis on Ulduz", ru: "💞 Полный разбор на Ulduz" },
  matchAgain: { az: "💞 Başqa biri", en: "💞 Someone else", ru: "💞 Другой человек" },
  // weekly
  weekTitle: { az: "Sənin həftən · {range}", en: "Your week ahead · {range}", ru: "Твоя неделя · {range}" },
  weekBest: { az: "Ən yaxşı günlər", en: "Best days", ru: "Лучшие дни" },
  weekCare: { az: "Ehtiyatlı olmaq lazım olan gün", en: "Take it easy on", ru: "Береги силы в" },
  weekEvents: { az: "Həftənin hadisələri", en: "This week in the sky", ru: "События недели" },
  weekTransits: { az: "Başlayan tranzitlər", en: "Transits starting", ru: "Начинаются транзиты" },
  weekMoonIn: { az: "Ay {house}-ci evdə", en: "Moon in your {house} house", ru: "Луна в {house} доме" },
  weekly: { az: "Bazar axşamı həftəlik baxış: <b>{state}</b>", en: "Sunday evening week ahead: <b>{state}</b>", ru: "Обзор недели в воскресенье вечером: <b>{state}</b>" },
  weeklyOn: { az: "🗓 Həftəlik: aç", en: "🗓 Weekly: on", ru: "🗓 Неделя: вкл" },
  weeklyOff: { az: "🗓 Həftəlik: bağla", en: "🗓 Weekly: off", ru: "🗓 Неделя: выкл" },
  // new / full moon
  moonPeak: { az: "Zirvə: saat {time}", en: "Peaks at {time}", ru: "Пик в {time}" },
  newMoonText: {
    az: "Xəritəndə bu sahəyə düşür: {area}. Burada niyyət qoymaq və yeni bir şeyə başlamaq üçün yaxşı andır.",
    en: "It falls in the part of your chart about {area}. A good moment to set an intention and start something new here.",
    ru: "Оно приходится на ту часть твоей карты, где {area}. Хороший момент загадать намерение и начать что-то новое.",
  },
  fullMoonText: {
    az: "Xəritəndə bu sahəyə düşür: {area}. Burada nəsə yetişir: nəyin bitməyə hazır olduğuna bax, qalanını burax.",
    en: "It falls in the part of your chart about {area}. Something here comes to a head: notice what is ready to finish, and let go of the rest.",
    ru: "Оно приходится на ту часть твоей карты, где {area}. Здесь что-то созревает: заметь, что готово завершиться, и отпусти лишнее.",
  },
  newMoon: { az: "Təzə Ay", en: "New Moon", ru: "Новолуние" },
  fullMoon: { az: "Bədirlənmiş Ay", en: "Full Moon", ru: "Полнолуние" },
  // inline
  inlineTitle: { az: "Bu günün horoskopunu paylaş", en: "Share today's horoscope", ru: "Поделиться гороскопом на сегодня" },
  inlineNoBirth: { az: "Əvvəlcə botda doğum məlumatlarını əlavə et", en: "Add your birth details in the bot first", ru: "Сначала добавь данные рождения в боте" },
  inlineFrom: { az: "✦ Öz horoskopunu al", en: "✦ Get your own horoscope", ru: "✦ Получить свой гороскоп" },
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
 * a New or Full Moon section on those days (when `tz` is given), and any big transit that begins or is exact today.
 */
export function dailyMessage(lang: Lang, birth: BirthParams, chart: Chart, day: { y: number; m: number; d: number }, tz?: string): string {
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

  const moonEv = tz ? moonEventSection(lang, chart, pd.date, tz) : null;
  if (moonEv) L.push("", moonEv);

  const today = alertsForDay(transitAlerts(chart, new Date(pd.date + "T12:00:00Z"), 1), pd.date);
  if (today.length) {
    L.push("", `🪐 <b>${T.transitToday[lang]}</b>`);
    for (const { a, note } of today) L.push("", alertLine(lang, a, note === "exact" ? T.exactToday[lang] : T.begins[lang]));
  }
  return L.join("\n");
}

// ---------- New and Full Moon ----------
const AREAS: Record<Lang, string[]> = {
  en: ["you, your body and your look", "money and what you value", "talks, messages and learning", "home and family", "love, joy and creativity", "work, health and routines", "partners and close relationships", "deep feelings and shared money", "travel, study and big ideas", "career and reputation", "friends and hopes for the future", "rest, dreams and inner healing"],
  az: ["sən, bədənin və görünüşün", "pul və dəyər verdiyin şeylər", "söhbətlər, mesajlar və öyrənmə", "ev və ailə", "sevgi, sevinc və yaradıcılıq", "iş, sağlamlıq və gündəlik qayda", "tərəfdaşlar və yaxın münasibətlər", "dərin hisslər və ortaq pul", "səyahət, təhsil və böyük ideyalar", "karyera və nüfuz", "dostlar və gələcək arzuları", "istirahət, yuxular və daxili şəfa"],
  ru: ["ты сам(а), твоё тело и внешность", "деньги и то, что ты ценишь", "разговоры, сообщения и учёба", "дом и семья", "любовь, радость и творчество", "работа, здоровье и распорядок", "партнёры и близкие отношения", "глубокие чувства и общие деньги", "путешествия, учёба и большие идеи", "карьера и репутация", "друзья и надежды на будущее", "отдых, сны и внутреннее исцеление"],
};

export interface MoonEvent { phase: "new" | "full"; at: Date; sign: number }

/** New and Full Moons that peak between two instants. */
export function moonEvents(from: Date, to: Date): MoonEvent[] {
  const out: MoonEvent[] = [];
  for (const [phase, angle] of [["new", 0], ["full", 180]] as const) {
    let t = from;
    for (let i = 0; i < 3; i++) {
      const hit = Astronomy.SearchMoonPhase(angle, t, 40);
      if (!hit || hit.date >= to) break;
      out.push({ phase, at: hit.date, sign: signOf(planetLon("Moon", hit.date)) });
      t = new Date(hit.date.getTime() + 86400000);
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** Start and end (as instants) of a local calendar day in a time zone. */
export function localDayBounds(date: string, tz: string): [Date, Date] {
  // Find the UTC instant whose local date/hour is date 00:00, by correcting a UTC guess with the zone's offset.
  const guess = new Date(date + "T00:00:00Z");
  const l = localNow(tz, guess);
  const shown = Date.UTC(l.y, l.m - 1, l.d, l.hour);
  const start = new Date(guess.getTime() - (shown - guess.getTime()));
  return [start, new Date(start.getTime() + 86400000)];
}

const clock = (lang: Lang, t: Date, tz: string) => {
  try { return new Intl.DateTimeFormat(lang === "az" ? "en-GB" : lang, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: tz }).format(t); }
  catch { return t.toISOString().slice(11, 16); }
};

/** The New or Full Moon section of the morning message, when one peaks on this local day. */
export function moonEventSection(lang: Lang, chart: Chart, date: string, tz: string): string | null {
  const [from, to] = localDayBounds(date, tz);
  const ev = moonEvents(from, to)[0];
  if (!ev) return null;
  const c = C[lang];
  const base = chart.angles ? signOf(chart.angles.asc) : chart.pos.Sun.sign;
  const house = ((ev.sign - base + 12) % 12) + 1;
  const L = [`${ev.phase === "new" ? "🌑" : "🌕"} <b>${ev.phase === "new" ? T.newMoon[lang] : T.fullMoon[lang]} ${c.signIn[ev.sign]}</b> · ${fill(T.moonPeak[lang], { time: clock(lang, ev.at, tz) })}`];
  L.push(esc(fill(ev.phase === "new" ? T.newMoonText[lang] : T.fullMoonText[lang], { area: AREAS[lang][house - 1] })));
  if (ev.phase === "full") {
    const fm = FM[lang], sg = fm.signs[ev.sign];
    L.push(`${esc(sg.theme)}`, `🍃 ${fm.ui.releaseL}: ${esc(sg.release)}`, `✨ ${fm.ui.callL}: ${esc(sg.call)}`, `<i>${esc(sg.affirmation)}</i>`);
  }
  return L.join("\n");
}

// ---------- Compatibility ----------
const tier = (v: number) => (v >= 72 ? "high" : v >= 55 ? "mid" : "low") as "high" | "mid" | "low";
const bar = (v: number) => { const n = Math.round(v / 10); return "▰".repeat(n) + "▱".repeat(10 - n); };

/** The /match answer: overall harmony, the five areas and the strongest contacts, from the site's synastry. */
export function matchMessage(lang: Lang, a: BirthParams, b: BirthParams): string {
  const A = computeChart(a), B = computeChart(b);
  const syn = synastry(A, B, numerology(a.fullName, a.date).lifePath, numerology(b.fullName, b.date).lifePath);
  const cc = CC[lang], c = C[lang];
  const pname = (p: SynPoint) => (p === "Ascendant" ? cc.ascendant : c.planetNames[p as PlanetKey]);
  const L = [`💞 <b>${esc(fill(T.matchTitle[lang], { a: firstName(a.fullName), b: firstName(b.fullName) }))}</b>`, ""];
  L.push(`<b>${syn.overall}%</b> ${bar(syn.overall)}`, esc(cc.overall[tier(syn.overall)]), "");
  for (const k of SYN_CATEGORIES) L.push(`<b>${cc.categories[k].name}</b> · ${syn.scores[k]}%`, esc(cc.categories[k][tier(syn.scores[k])]));
  const top = syn.aspects.filter((x) => cc.pairs[x.pair]).slice(0, 3);
  if (top.length) {
    L.push("", `<b>${T.matchContacts[lang]}</b>`);
    for (const x of top) L.push(`${x.flow ? "✦" : "⚡"} ${pname(x.a)} ${symbol(x.type)} ${pname(x.b)}: ${esc(cc.pairs[x.pair][x.flow ? 0 : 1])}`);
  }
  return L.join("\n");
}

// ---------- Weekly overview ----------
/** Sunday evening: the seven days from `start` (the next Monday), with the best days, sky events and new transits. */
export function weeklyMessage(lang: Lang, birth: BirthParams, chart: Chart, start: { y: number; m: number; d: number }, tz: string): string {
  const c = C[lang], sc = S[lang], sm = M[lang], dc = D[lang];
  const days = Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(Date.UTC(start.y, start.m - 1, start.d + i, 12));
    return { dt, pd: personalDay(chart, dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()) };
  });
  const wd = (dt: Date) => sc.ui.weekdays[(dt.getUTCDay() + 6) % 7];
  const range = `${formatDayMonth(days[0].dt, lang)} – ${formatDayMonth(days[6].dt, lang)}`;
  const L = [`🗓 <b>${esc(fill(T.weekTitle[lang], { range }))}</b>`, `${esc(firstName(birth.fullName))} ✦`, ""];
  for (const { dt, pd } of days) {
    L.push(`<b>${wd(dt)} ${dt.getUTCDate()}</b>  ${dots(pd.overall)}  ${strip(SIGN_GLYPHS[pd.moonSign])} ${esc(dc.houses[pd.moonHouse - 1].focus.split(/[.!]/)[0])}`);
  }
  const max = Math.max(...days.map((x) => x.pd.overall)), min = Math.min(...days.map((x) => x.pd.overall));
  L.push("", `⭐ ${T.weekBest[lang]}: ${days.filter((x) => x.pd.overall === max).map((x) => `${wd(x.dt)} ${x.dt.getUTCDate()}`).join(", ")}`);
  if (min < max && min <= 2) L.push(`🌧 ${T.weekCare[lang]}: ${days.filter((x) => x.pd.overall === min).map((x) => `${wd(x.dt)} ${x.dt.getUTCDate()}`).join(", ")}`);

  const ev: string[] = [];
  const [from] = localDayBounds(days[0].pd.date, tz);
  const to = new Date(from.getTime() + 7 * 86400000);
  for (const e of moonEvents(from, to)) {
    ev.push(`${e.phase === "new" ? "🌑" : "🌕"} ${e.phase === "new" ? sm.ui.nextNew : sm.ui.nextFull} ${c.signIn[e.sign]}: ${formatDayMonth(new Date(e.at.getTime() + 0), lang)}, ${clock(lang, e.at, tz)}`);
  }
  const det = skyDetails(start.y, start.m, start.d);
  if (det.mercury.changes && det.mercury.changes < to) {
    ev.push(`☿ ${det.mercury.retro ? sm.ui.mercEnds : sm.ui.mercStarts}: ${formatDayMonth(det.mercury.changes, lang)}`);
  }
  if (ev.length) L.push("", `<b>${T.weekEvents[lang]}</b>`, ...ev);

  const first = days[0].pd.date, last = days[6].pd.date;
  const starting = transitAlerts(chart, new Date(first + "T12:00:00Z"), 7).filter((a) => a.start >= first && a.start <= last);
  if (starting.length) {
    L.push("", `🪐 <b>${T.weekTransits[lang]}</b>`);
    for (const a of starting.slice(0, 3)) L.push("", alertLine(lang, a));
  }
  return L.join("\n");
}

// ---------- Inline sharing ----------
/** A short horoscope for sharing in any chat: tone of the day, the Moon's house and the areas. */
export function shareDay(lang: Lang, birth: BirthParams, chart: Chart, day: { y: number; m: number; d: number }): string {
  const dc = D[lang], c = C[lang], sm = M[lang];
  const pd = personalDay(chart, day.y, day.m, day.d);
  const house = dc.houses[pd.moonHouse - 1];
  const L = [`✦ <b>${esc(fill(T.dayFor[lang], { name: firstName(birth.fullName), date: formatDate(pd.date, lang) }))}</b>`, ""];
  L.push(`${dots(pd.overall)}  ${esc(dc.ui.overall[pd.overall - 1])}`, "");
  L.push(`${strip(SIGN_GLYPHS[pd.moonSign])} ${esc(dc.ui.moonTitle(c.ordinal(pd.moonHouse), c.signIn[pd.moonSign]))}`, esc(house.focus), `💡 ${esc(house.tip)}`, "");
  L.push(SPHERES.map((k) => `${sm.ui.sphereNames[k]} ${dots(pd.spheres[k])}`).join("\n"));
  return L.join("\n");
}
