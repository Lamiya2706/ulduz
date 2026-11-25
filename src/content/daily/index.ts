import type { Lang } from "@/i18n";
import type { DailyContent } from "./types";
import en from "./en";
import az from "./az";
import ru from "./ru";

export const DAILY_CONTENT: Record<Lang, DailyContent> = { en, az, ru };
export const getDailyContent = (lang: Lang): DailyContent => DAILY_CONTENT[lang];
export type { DailyContent };
export type { Tone } from "./types";
