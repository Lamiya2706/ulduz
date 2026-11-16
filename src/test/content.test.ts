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

import { NUM_CONTENT } from "@/content/numerology";
import { NUM_UI } from "@/i18n/numerology";
describe("numerology content", () => {
  const keys = (o: object): string[] => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? keys(v).map((x) => `${k}.${x}`) : [k])).sort();
  it("has the same structure in every language", () => {
    for (const l of ["az", "ru"] as const) {
      expect(keys(NUM_CONTENT[l])).toEqual(keys(NUM_CONTENT.en));
      expect(keys(NUM_UI[l])).toEqual(keys(NUM_UI.en));
    }
  });
  it("covers every number", () => {
    for (const c of Object.values(NUM_CONTENT)) {
      expect(Object.keys(c.numbers).map(Number).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]);
      for (const s of Object.values(c.square)) expect(s.levels).toHaveLength(4);
    }
  });
});

import { SKY_CONTENT, SKY_MORE } from "@/content/sky";
import { SKY_UI } from "@/i18n/sky";
describe("sky content", () => {
  const keys = (o: object): string[] => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? keys(v).map((x) => `${k}.${x}`) : [k])).sort();
  it("has the same structure in every language", () => {
    for (const l of ["az", "ru"] as const) {
      expect(keys(SKY_CONTENT[l])).toEqual(keys(SKY_CONTENT.en));
      expect(keys(SKY_UI[l])).toEqual(keys(SKY_UI.en));
      expect(SKY_CONTENT[l].moonSigns).toHaveLength(12);
      expect(SKY_CONTENT[l].ui.weekdays).toHaveLength(7);
      expect(keys(SKY_MORE[l])).toEqual(keys(SKY_MORE.en));
      expect(SKY_MORE[l].lunarDays).toHaveLength(30);
      expect(SKY_MORE[l].sunSeason).toHaveLength(12);
    }
  });
});
