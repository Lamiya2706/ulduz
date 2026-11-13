import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en";
import az from "./az";
import ru from "./ru";

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
  resources: { en: { translation: en }, az: { translation: az }, ru: { translation: ru } },
  lng: "az",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnObjects: true,
});

export default i18n;
