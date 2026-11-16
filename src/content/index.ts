import type { Lang } from "@/i18n";
import type { Content } from "./types";
import en from "./en";
import az from "./az";
import ru from "./ru";

const CONTENT: Record<Lang, Content> = { en, az, ru };
export const getContent = (lang: Lang): Content => CONTENT[lang];
export type { Content };

import compatEn from "./compat/en";
import compatAz from "./compat/az";
import compatRu from "./compat/ru";
import type { CompatContent } from "./compat/types";
const COMPAT: Record<Lang, CompatContent> = { en: compatEn, az: compatAz, ru: compatRu };
export const getCompat = (lang: Lang): CompatContent => COMPAT[lang];
export type { CompatContent };
