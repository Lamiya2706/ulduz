// Reminder emails: what is due for one person on one day, and the email that tells them.
// Pure functions, shared by the send-reminders edge function and the web tests.
import * as Astronomy from "npm:astronomy-engine@2.1.19";
import { planetLon, signOf, type Chart } from "./astro.ts";
import { transitAlerts, type AlertPoint, type SlowPlanet } from "./transits.ts";
import type { AspectType } from "./astro.ts";

export type Lang = "az" | "en" | "ru";
export type Reminder =
  | { kind: "moon"; phase: "new" | "full"; at: string; sign: number; house: number }
  | { kind: "birthday"; year: number }
  | { kind: "transit"; planet: SlowPlanet; point: AlertPoint; type: AspectType; start: string; exact: string };

const DAY = 86400000;
/** How many days ahead a transit is announced. */
export const TRANSIT_NOTICE_DAYS = 7;

/** YYYY-MM-DD of an instant in a time zone. */
export function localDate(t: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(t);
  } catch {
    return t.toISOString().slice(0, 10);
  }
}

/** A stable id per reminder, so each one is sent only once. */
export function reminderKey(r: Reminder): string {
  if (r.kind === "moon") return `moon:${r.phase}:${r.at.slice(0, 10)}`;
  if (r.kind === "birthday") return `birthday:${r.year}`;
  return `transit:${r.planet}:${r.type}:${r.point}:${r.start}`;
}

/**
 * Reminders due for one chart, for a run at `now` (the daily job runs early in the morning).
 * - a New or Full Moon that peaks within the next 24 hours, with the house it falls in;
 * - a birthday today, in the person's time zone (`tz`, default Asia/Baku);
 * - a slow-planet transit that starts within the next week.
 */
export function dueReminders(chart: Chart, birthDate: string, now: Date, tz = "Asia/Baku"): Reminder[] {
  const out: Reminder[] = [];
  const base = chart.angles ? signOf(chart.angles.asc) : chart.pos.Sun.sign;

  for (const [phase, angle] of [["new", 0], ["full", 180]] as const) {
    const hit = Astronomy.SearchMoonPhase(angle, now, 1);
    if (hit && hit.date.getTime() - now.getTime() <= DAY) {
      const sign = signOf(planetLon("Moon", hit.date));
      out.push({ kind: "moon", phase, at: hit.date.toISOString(), sign, house: ((sign - base + 12) % 12) + 1 });
    }
  }

  const today = localDate(now, tz);
  if (birthDate.slice(5) === today.slice(5) && birthDate < today) out.push({ kind: "birthday", year: Number(today.slice(0, 4)) });

  const until = new Date(now.getTime() + TRANSIT_NOTICE_DAYS * DAY).toISOString().slice(0, 10);
  const from = now.toISOString().slice(0, 10);
  for (const a of transitAlerts(chart, now, TRANSIT_NOTICE_DAYS + 1)) {
    if (a.active || a.start < from || a.start > until) continue;
    out.push({ kind: "transit", planet: a.planet, point: a.point, type: a.type, start: a.start, exact: a.exact.find((d) => d >= a.start) ?? a.start });
  }
  return out;
}

/* ---------- the email ---------- */

const T = {
  en: {
    locale: "en-GB",
    signIn: ["in Aries", "in Taurus", "in Gemini", "in Cancer", "in Leo", "in Virgo", "in Libra", "in Scorpio", "in Sagittarius", "in Capricorn", "in Aquarius", "in Pisces"],
    planets: { Jupiter: "Jupiter", Saturn: "Saturn", Uranus: "Uranus", Neptune: "Neptune", Pluto: "Pluto" } as Record<SlowPlanet, string>,
    points: { Sun: "your Sun", Moon: "your Moon", Mercury: "your Mercury", Venus: "your Venus", Mars: "your Mars", Asc: "your Ascendant", MC: "your Midheaven" } as Record<AlertPoint, string>,
    aspects: { conjunction: "joins", sextile: "makes a sextile to", square: "makes a square to", trine: "makes a trine to", opposition: "opposes" } as Record<AspectType, string>,
    houses: ["you, your body and your look", "money and what you value", "talks, messages and learning", "home and family", "love, joy and creativity", "work, health and routines", "partners and close relationships", "deep feelings and shared money", "travel, study and big ideas", "career and reputation", "friends and hopes for the future", "rest, dreams and inner healing"],
    hello: (n: string) => (n ? `Hello, ${n}` : "Hello"),
    subject: { moon: { new: "New Moon today", full: "Full Moon today" }, birthday: "Happy birthday from Ulduz", transit: "A new transit is starting", several: "Your sky this week" },
    moonTitle: (p: "new" | "full", s: string) => `${p === "new" ? "New Moon" : "Full Moon"} ${s}`,
    moonText: (p: "new" | "full", time: string, area: string) =>
      `It peaks at ${time} and falls in the part of your chart about ${area}. ${p === "new" ? "A good moment to set an intention and start something new here." : "Something here comes to a head: notice what is ready to finish, and let go of the rest."}`,
    birthdayTitle: "Happy birthday!",
    birthdayText: "Your new personal year starts today. See what the year ahead holds for you.",
    birthdayCta: "Open my year ahead",
    transitTitle: (pl: string, asp: string, pt: string) => `${pl} ${asp} ${pt}`,
    transitText: (start: string, exact: string) => `It starts on ${start}${exact !== start ? ` and is exact on ${exact}` : ""}. Read what it means for you.`,
    transitCta: "See my transits",
    moonCta: "Open my day",
    why: "You get this email because you turned on reminders in your Ulduz account.",
    unsub: "Unsubscribe",
  },
  az: {
    locale: "az-Latn-AZ",
    signIn: ["Qoçda", "Buğada", "Əkizlərdə", "Xərçəngdə", "Şirdə", "Qızda", "Tərəzidə", "Əqrəbdə", "Oxatanda", "Oğlaqda", "Dolçada", "Balıqlarda"],
    planets: { Jupiter: "Yupiter", Saturn: "Saturn", Uranus: "Uran", Neptune: "Neptun", Pluto: "Pluton" } as Record<SlowPlanet, string>,
    points: { Sun: "Günəşinə", Moon: "Ayına", Mercury: "Merkurinə", Venus: "Venerana", Mars: "Marsına", Asc: "Assendentinə", MC: "Zenitinə" } as Record<AlertPoint, string>,
    aspects: { conjunction: "birləşir", sextile: "sekstil edir", square: "kvadrat edir", trine: "trin edir", opposition: "oppozisiyada durur" } as Record<AspectType, string>,
    houses: ["sən, bədənin və görünüşün", "pul və dəyər verdiyin şeylər", "söhbətlər, mesajlar və öyrənmə", "ev və ailə", "sevgi, sevinc və yaradıcılıq", "iş, sağlamlıq və gündəlik qayda", "tərəfdaşlar və yaxın münasibətlər", "dərin hisslər və ortaq pul", "səyahət, təhsil və böyük ideyalar", "karyera və nüfuz", "dostlar və gələcək arzuları", "istirahət, yuxular və daxili şəfa"],
    hello: (n: string) => (n ? `Salam, ${n}` : "Salam"),
    subject: { moon: { new: "Bu gün Yeni Ay", full: "Bu gün Tam Ay" }, birthday: "Ad günün mübarək, Ulduz-dan", transit: "Yeni tranzit başlayır", several: "Bu həftənin səması" },
    moonTitle: (p: "new" | "full", s: string) => `${p === "new" ? "Yeni Ay" : "Tam Ay"} ${s}`,
    moonText: (p: "new" | "full", time: string, area: string) =>
      `Zirvəsi saat ${time} radələrindədir və xəritənin bu sahəsinə düşür: ${area}. ${p === "new" ? "Burada niyyət qoymaq və yeni bir şeyə başlamaq üçün yaxşı andır." : "Burada nəsə yetişir: nəyin bitməyə hazır olduğuna bax, qalanını burax."}`,
    birthdayTitle: "Ad günün mübarək!",
    birthdayText: "Yeni şəxsi ilin bu gün başlayır. Qarşıdakı ilin sənə nə gətirdiyinə bax.",
    birthdayCta: "İl proqnozumu aç",
    transitTitle: (pl: string, asp: string, pt: string) => `${pl} ${pt} ${asp}`,
    transitText: (start: string, exact: string) => `${start} tarixində başlayır${exact !== start ? `, dəqiq anı ${exact}` : ""}. Bunun sənin üçün nə demək olduğunu oxu.`,
    transitCta: "Tranzitlərimə bax",
    moonCta: "Günümü aç",
    why: "Bu məktubu Ulduz hesabında xatırlatmaları açdığın üçün alırsan.",
    unsub: "Abunəlikdən çıx",
  },
  ru: {
    locale: "ru-RU",
    signIn: ["в Овне", "в Тельце", "в Близнецах", "в Раке", "во Льве", "в Деве", "в Весах", "в Скорпионе", "в Стрельце", "в Козероге", "в Водолее", "в Рыбах"],
    planets: { Jupiter: "Юпитер", Saturn: "Сатурн", Uranus: "Уран", Neptune: "Нептун", Pluto: "Плутон" } as Record<SlowPlanet, string>,
    points: { Sun: "твоему Солнцу", Moon: "твоей Луне", Mercury: "твоему Меркурию", Venus: "твоей Венере", Mars: "твоему Марсу", Asc: "твоему Асценденту", MC: "твоему MC" } as Record<AlertPoint, string>,
    aspects: { conjunction: "соединяется с", sextile: "в секстиле к", square: "в квадрате к", trine: "в трине к", opposition: "в оппозиции к" } as Record<AspectType, string>,
    houses: ["ты сам(а), твоё тело и внешность", "деньги и то, что ты ценишь", "разговоры, сообщения и учёба", "дом и семья", "любовь, радость и творчество", "работа, здоровье и распорядок", "партнёры и близкие отношения", "глубокие чувства и общие деньги", "путешествия, учёба и большие идеи", "карьера и репутация", "друзья и надежды на будущее", "отдых, сны и внутреннее исцеление"],
    hello: (n: string) => (n ? `Привет, ${n}` : "Привет"),
    subject: { moon: { new: "Сегодня новолуние", full: "Сегодня полнолуние" }, birthday: "С днём рождения от Ulduz", transit: "Начинается новый транзит", several: "Твоё небо на этой неделе" },
    moonTitle: (p: "new" | "full", s: string) => `${p === "new" ? "Новолуние" : "Полнолуние"} ${s}`,
    moonText: (p: "new" | "full", time: string, area: string) =>
      `Пик в ${time}, в той части твоей карты, что отвечает за: ${area}. ${p === "new" ? "Хороший момент загадать намерение и начать здесь что-то новое." : "Здесь что-то созревает: посмотри, что готово завершиться, и отпусти остальное."}`,
    birthdayTitle: "С днём рождения!",
    birthdayText: "Сегодня начинается твой новый личный год. Посмотри, что он тебе готовит.",
    birthdayCta: "Открыть мой год",
    transitTitle: (pl: string, asp: string, pt: string) => `${pl} ${asp} ${pt}`,
    transitText: (start: string, exact: string) => `Начинается ${start}${exact !== start ? `, точный аспект ${exact}` : ""}. Прочитай, что это значит для тебя.`,
    transitCta: "Мои транзиты",
    moonCta: "Открыть мой день",
    why: "Ты получаешь это письмо, потому что включил(а) напоминания в аккаунте Ulduz.",
    unsub: "Отписаться",
  },
};
// The point names above fit most aspects ("Saturn Günəşinə kvadrat edir", "Сатурн в квадрате к твоему Солнцу");
// a conjunction needs another case ("Günəşinlə birləşir", "соединяется с твоим Солнцем").
const AZ_WITH: Record<AlertPoint, string> = { Sun: "Günəşinlə", Moon: "Ayınla", Mercury: "Merkurinlə", Venus: "Veneranla", Mars: "Marsınla", Asc: "Assendentinlə", MC: "Zenitinlə" };
const RU_WITH: Record<AlertPoint, string> = { Sun: "твоим Солнцем", Moon: "твоей Луной", Mercury: "твоим Меркурием", Venus: "твоей Венерой", Mars: "твоим Марсом", Asc: "твоим Асцендентом", MC: "твоим MC" };

export interface EmailInput { lang: Lang; name: string; reminders: Reminder[]; site: string; unsubscribeUrl: string; birthDate: string; tz?: string }
export interface Email { subject: string; html: string; text: string }

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function renderEmail({ lang, name, reminders, site, unsubscribeUrl, birthDate, tz = "Asia/Baku" }: EmailInput): Email {
  const t = T[lang] ?? T.az;
  const day = (iso: string) => new Intl.DateTimeFormat(t.locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));
  const time = (iso: string) => {
    const f = (zone: string) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: zone }).format(new Date(iso));
    try { return f(tz); } catch { return f("Asia/Baku"); }
  };

  const blocks = reminders.map((r) => {
    if (r.kind === "moon") {
      return { title: t.moonTitle(r.phase, t.signIn[r.sign]), text: t.moonText(r.phase, time(r.at), t.houses[r.house - 1]), cta: t.moonCta, href: `${site}/${lang}/today` };
    }
    if (r.kind === "birthday") {
      return { title: t.birthdayTitle, text: t.birthdayText, cta: t.birthdayCta, href: `${site}/${lang}/year/${birthDate}` };
    }
    const point = r.type !== "conjunction" ? t.points[r.point] : lang === "ru" ? RU_WITH[r.point] : lang === "az" ? AZ_WITH[r.point] : t.points[r.point];
    return { title: t.transitTitle(t.planets[r.planet], t.aspects[r.type], point), text: t.transitText(day(r.start), day(r.exact)), cta: t.transitCta, href: `${site}/${lang}/today#transits` };
  });

  const first = reminders[0];
  const subject = reminders.length > 1 && !reminders.some((r) => r.kind === "birthday")
    ? t.subject.several
    : (reminders.find((r) => r.kind === "birthday") && t.subject.birthday) ||
      (first.kind === "moon" ? t.subject.moon[first.phase] : t.subject.transit);

  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#0B0D17;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B0D17;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:Georgia,'Times New Roman',serif;color:#F4EDE2;">
<tr><td style="padding:0 0 24px;text-align:center;font-family:Arial,sans-serif;font-size:12px;letter-spacing:6px;color:#D6B47C;">✦ ULDUZ ✦</td></tr>
<tr><td style="padding:0 0 8px;font-size:26px;">${esc(t.hello(name))}</td></tr>
${blocks.map((b) => `<tr><td style="padding:20px 24px;border:1px solid rgba(214,180,124,0.3);border-radius:16px;background:#10132A;">
<div style="font-size:22px;line-height:1.3;color:#F4EDE2;">${esc(b.title)}</div>
<div style="margin-top:10px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#D9D2C6;">${esc(b.text)}</div>
<div style="margin-top:16px;"><a href="${esc(b.href)}" style="display:inline-block;padding:10px 20px;border-radius:999px;background:#D6B47C;color:#0B0D17;font-family:Arial,sans-serif;font-size:14px;text-decoration:none;">${esc(b.cta)} →</a></div>
</td></tr><tr><td style="height:12px;"></td></tr>`).join("\n")}
<tr><td style="padding:16px 0 0;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#A79E92;text-align:center;">${esc(t.why)}<br><a href="${esc(unsubscribeUrl)}" style="color:#A79E92;">${esc(t.unsub)}</a> · <a href="${esc(site)}" style="color:#A79E92;">ulduz.space</a></td></tr>
</table></td></tr></table></body></html>`;

  const text = [t.hello(name), "", ...blocks.flatMap((b) => [b.title, b.text, `${b.cta}: ${b.href}`, ""]), t.why, `${t.unsub}: ${unsubscribeUrl}`].join("\n");
  return { subject, html, text };
}
