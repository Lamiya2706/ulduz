import type { Lang } from "@/i18n";
import type { TransitContent } from "./types";
import en from "./en";
import az from "./az";
import ru from "./ru";

export const TRANSIT_CONTENT: Record<Lang, TransitContent> = { en, az, ru };
export const getTransitContent = (lang: Lang): TransitContent => TRANSIT_CONTENT[lang];
export type { TransitContent };
