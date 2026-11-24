import type { Lang } from "@/i18n";
import type { FullMoonContent } from "./types";
import en from "./en";
import az from "./az";
import ru from "./ru";

export const FULLMOON_CONTENT: Record<Lang, FullMoonContent> = { en, az, ru };
export const getFullMoonContent = (lang: Lang): FullMoonContent => FULLMOON_CONTENT[lang];
export type { FullMoonContent };
