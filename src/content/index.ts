import type { Lang } from "@/i18n";
import type { Content } from "./types";
import en from "./en";
import az from "./az";
import ru from "./ru";

const CONTENT: Record<Lang, Content> = { en, az, ru };
export const getContent = (lang: Lang): Content => CONTENT[lang];
export type { Content };
