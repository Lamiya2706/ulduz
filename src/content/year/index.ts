import type { Lang } from "@/i18n";
import type { YearContent } from "./types";
import en from "./en";
import az from "./az";
import ru from "./ru";

export const YEAR_CONTENT: Record<Lang, YearContent> = { en, az, ru };
export const getYearContent = (lang: Lang): YearContent => YEAR_CONTENT[lang];
export type { YearContent };
