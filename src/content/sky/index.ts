import type { Lang } from "@/i18n";
import type { SkyContent, SkyMore } from "./types";
import moreEn from "./more-en";
import moreAz from "./more-az";
import moreRu from "./more-ru";
import en from "./en";
import az from "./az";
import ru from "./ru";

export const SKY_CONTENT: Record<Lang, SkyContent> = { en, az, ru };
export const getSkyContent = (lang: Lang): SkyContent => SKY_CONTENT[lang];
export const SKY_MORE: Record<Lang, SkyMore> = { en: moreEn, az: moreAz, ru: moreRu };
export const getSkyMore = (lang: Lang): SkyMore => SKY_MORE[lang];
export type { SkyContent, SkyMore };
