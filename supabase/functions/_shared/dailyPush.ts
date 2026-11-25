// What the daily horoscope push says, and when it is due. Shared by the daily-push edge function and the tests.
import { computeChart } from "./astro.ts";
import { personalDay } from "./daily.ts";
import { PUSH_TEXT, type PushLang } from "./pushText.ts";

export interface PushProfile {
  full_name: string | null; birth_date: string | null; birth_time: string | null;
  lat: number | null; lon: number | null; tz: string | null;
}
export interface PushRow { lang: string | null; tz: string | null; hour: number; last_sent_on: string | null }
export interface PushMessage { title: string; body: string; url: string; tag: string }

/** The calendar date (YYYY-MM-DD) and hour at `now` in a time zone; falls back to UTC for an unknown zone. */
export function localNow(tz: string | null, now: Date) {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz || "UTC", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(now);
  } catch {
    return localNow("UTC", now);
  }
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}

/** Due once a day, from the chosen hour (local time) for a few hours, so a missed hourly run still delivers it in the morning. */
export function isDue(row: PushRow, now: Date) {
  const l = localNow(row.tz, now);
  return { due: l.hour >= row.hour && l.hour < row.hour + 4 && row.last_sent_on !== l.date, date: l.date };
}

const asLang = (l: string | null): PushLang => (l === "en" || l === "ru" ? l : "az");

/** The personal message for a local date, or null when the profile has no birth date. */
export function dailyMessage(p: PushProfile, lang: string | null, date: string): PushMessage | null {
  if (!p.birth_date) return null;
  const L = asLang(lang), tx = PUSH_TEXT[L];
  const hasPlace = p.lat != null && p.lon != null;
  const chart = computeChart({
    fullName: p.full_name || "", date: p.birth_date, time: hasPlace ? p.birth_time : null,
    lat: hasPlace ? p.lat : null, lon: hasPlace ? p.lon : null, tz: hasPlace ? p.tz || "UTC" : "UTC",
  });
  const [y, m, d] = date.split("-").map(Number);
  const day = personalDay(chart, y, m, d);
  const name = (p.full_name || "").trim().split(/\s+/)[0];
  const stars = "★".repeat(day.overall) + "☆".repeat(5 - day.overall);
  return {
    title: name ? tx.title.replace("{name}", name) : tx.titleNoName,
    body: `${stars} ${tx.overall[day.overall - 1]}\n${tx.focus[day.moonHouse - 1]}`,
    url: `/${L}/today`,
    tag: `daily-${date}`,
  };
}
