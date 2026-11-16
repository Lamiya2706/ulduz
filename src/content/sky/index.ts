import type { Lang } from "@/i18n";
import type { SkyContent } from "./types";
import en from "./en";
import az from "./az";
import ru from "./ru";

export const SKY_CONTENT: Record<Lang, SkyContent> = { en, az, ru };
export const getSkyContent = (lang: Lang): SkyContent => SKY_CONTENT[lang];
export type { SkyContent };
