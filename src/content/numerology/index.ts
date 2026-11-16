import type { Lang } from "@/i18n";
import type { NumContent } from "./types";
import en from "./en";
import az from "./az";
import ru from "./ru";

export const NUM_CONTENT: Record<Lang, NumContent> = { en, az, ru };
export const getNumContent = (lang: Lang): NumContent => NUM_CONTENT[lang];
export type { NumContent };
