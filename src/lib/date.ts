import type { Lang } from "@/i18n";

export const AZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"];

/** Long date ("15 iyun 1995", "June 15, 1995", "15 июня 1995 г."). Azerbaijani is formatted by hand — browser locale data for az is unreliable. */
export function formatDate(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (lang === "az") return `${d} ${AZ_MONTHS[m - 1]} ${y}`;
  return new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** "noyabr 2026", "November 2026", "ноябрь 2026". */
export function formatMonth(y: number, m: number, lang: Lang): string {
  if (lang === "az") return `${AZ_MONTHS[m - 1].charAt(0).toLocaleUpperCase("az")}${AZ_MONTHS[m - 1].slice(1)} ${y}`;
  const s = new Intl.DateTimeFormat(lang, { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 15)));
  return `${s.charAt(0).toLocaleUpperCase(lang)}${s.slice(1)} ${y}`;
}

/** Month name ("mart", "March", "март"). */
export function monthName(m: number, lang: Lang): string {
  if (lang === "az") return AZ_MONTHS[m - 1];
  return new Intl.DateTimeFormat(lang, { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2024, m - 1, 15)));
}
/** Short day + month ("11 mart", "March 11", "11 марта"). */
export function formatDayMonth(d: Date, lang: Lang): string {
  if (lang === "az") return `${d.getUTCDate()} ${AZ_MONTHS[d.getUTCMonth()]}`;
  return new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", timeZone: "UTC" }).format(d);
}
