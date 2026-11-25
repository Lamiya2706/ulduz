// Per-route <title>/<meta description>. Used by the app at runtime and by the build-time prerender (vite.config.ts),
// so it must only use relative imports.
import en from "../i18n/en";
import az from "../i18n/az";
import ru from "../i18n/ru";
import { COUPLE_UI } from "../i18n/couple";
import { NUM_UI } from "../i18n/numerology";
import { SKY_UI } from "../i18n/sky";
import { YEAR_UI } from "../i18n/year";
import { FULLMOON_UI } from "../i18n/fullmoon";
import { AUTH_UI } from "../i18n/auth";
import { DAILY_UI } from "../i18n/daily";
import { getPage } from "../pages/staticContent";

export type SeoLang = "az" | "en" | "ru";
export const SEO_LANGS: SeoLang[] = ["az", "en", "ru"];
const UI = { en, az, ru };

/** Public, indexable routes (relative to /:lang). */
export const PUBLIC_ROUTES = ["", "today", "moon", "full-moon", "year", "numerology", "couple", "page/about", "page/terms", "page/privacy", "page/refund", "page/contact"];

/** Personal pages (someone's chart, reading or payment) must not be indexed. */
export const isPrivatePath = (rest: string) => /^\/(chart|reading|payment|login|reset-password|account|unsubscribe)\b|^\/couple\/.+|^\/numerology\/.+|^\/year\/.+/.test(rest);

export function pageMeta(lang: SeoLang, rest: string): { title: string; description: string } {
  const r = rest.replace(/^\/+|\/+$/g, "");
  const home = UI[lang].meta;
  if (r.startsWith("today")) return DAILY_UI[lang].meta;
  if (r.startsWith("moon")) return SKY_UI[lang].meta;
  if (r.startsWith("full-moon")) return FULLMOON_UI[lang].meta;
  if (r.startsWith("year")) return YEAR_UI[lang].meta;
  if (r.startsWith("numerology")) return NUM_UI[lang].meta;
  if (r.startsWith("couple")) return COUPLE_UI[lang].meta;
  if (r.startsWith("login")) return AUTH_UI[lang].meta.login;
  if (r.startsWith("reset-password")) return AUTH_UI[lang].meta.reset;
  if (r.startsWith("account")) return AUTH_UI[lang].meta.account;
  if (r.startsWith("unsubscribe")) return AUTH_UI[lang].meta.unsubscribe;
  const m = r.match(/^page\/(\w+)/);
  if (m) {
    const p = getPage(lang, m[1]);
    if (p) return { title: `${p.title} — Ulduz`, description: home.description };
  }
  return home;
}
