import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en";
import az from "./az";
import ru from "./ru";
import { COUPLE_UI } from "./couple";
import { NUM_UI } from "./numerology";
import { SKY_UI } from "./sky";
import { YEAR_UI } from "./year";
import { FULLMOON_UI } from "./fullmoon";
import { AUTH_UI } from "./auth";
import { DAILY_UI } from "./daily";

export const LANGS = ["az", "en", "ru"] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_LABEL: Record<Lang, string> = { az: "AZ", en: "EN", ru: "RU" };
export const LANG_NAME: Record<Lang, string> = { az: "Azərbaycanca", en: "English", ru: "Русский" };
export const isLang = (x: string | undefined): x is Lang => !!x && (LANGS as readonly string[]).includes(x);

export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem("ulduz.lang");
    if (isLang(saved ?? undefined)) return saved as Lang;
  } catch { /* storage unavailable */ }
  const nav = (navigator.language || "az").slice(0, 2).toLowerCase();
  return isLang(nav) ? nav : "az";
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: { ...en, couple: COUPLE_UI.en, numerology: NUM_UI.en, sky: SKY_UI.en, year: YEAR_UI.en, fullmoon: FULLMOON_UI.en, auth: AUTH_UI.en, daily: DAILY_UI.en } }, az: { translation: { ...az, couple: COUPLE_UI.az, numerology: NUM_UI.az, sky: SKY_UI.az, year: YEAR_UI.az, fullmoon: FULLMOON_UI.az, auth: AUTH_UI.az, daily: DAILY_UI.az } }, ru: { translation: { ...ru, couple: COUPLE_UI.ru, numerology: NUM_UI.ru, sky: SKY_UI.ru, year: YEAR_UI.ru, fullmoon: FULLMOON_UI.ru, auth: AUTH_UI.ru, daily: DAILY_UI.ru } } },
  lng: "az",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnObjects: true,
});

export default i18n;
