import { describe, expect, it } from "vitest";
import { SYN_PAIRS, SYN_CATEGORIES } from "@shared/synastry";
import { getCompat, getContent } from "@/content";
import { COUPLE_UI } from "@/i18n/couple";
import en from "@/i18n/en";
import az from "@/i18n/az";
import ru from "@/i18n/ru";

const LANGS = ["az", "en", "ru"] as const;
const keys = (o: unknown, p = ""): string[] =>
  o && typeof o === "object" && !Array.isArray(o) ? Object.entries(o).flatMap(([k, v]) => keys(v, p ? `${p}.${k}` : k)) : [p];

describe("content completeness", () => {
  it("has a compatibility text for every synastry contact in every language", () => {
    for (const l of LANGS) {
      const cc = getCompat(l);
      for (const pair of SYN_PAIRS) { expect(cc.pairs[pair], `${l} ${pair}`).toHaveLength(2); }
      for (const cat of SYN_CATEGORIES) expect(cc.categories[cat].name).toBeTruthy();
    }
  });
  it("has the same UI keys in every language", () => {
    expect(keys(az)).toEqual(keys(en));
    expect(keys(ru)).toEqual(keys(en));
    expect(keys(COUPLE_UI.az)).toEqual(keys(COUPLE_UI.en));
    expect(keys(COUPLE_UI.ru)).toEqual(keys(COUPLE_UI.en));
  });
  it("has 12 signs and 16 archetypes per language", () => {
    for (const l of LANGS) { const c = getContent(l); expect(c.signs).toHaveLength(12); expect(Object.keys(c.archetypes)).toHaveLength(16); }
  });
});
