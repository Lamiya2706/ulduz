import type { SlowPlanet, TransitKind } from "@shared/year";

export interface YearText { title: string; theme: string; love: string; work: string; advice: string }
export interface YearContent {
  ui: {
    eyebrow: string; title1: string; title2: string; sub: string; date: string; submit: string; hint: string;
    resultTitle: (y: number) => string; age: (n: number) => string;
    nav: { year: string; months: string; transits: string; sky: string };
    personalYear: string; loveL: string; workL: string; adviceL: string;
    monthsTitle: string; monthsIntro: string; nowBadge: string;
    transitsTitle: string; transitsIntro: (sign: string) => string; noTransits: string; period: (from: string, to: string) => string;
    skyTitle: string; skyIntro: string; retroTitle: string; eclipsesTitle: string; ingressTitle: string;
    solar: (sign: string) => string; lunar: (sign: string) => string; eclipseNote: string;
    enters: (planet: string, sign: string) => string; noEclipses: string;
    another: string; copy: string; copied: string; toChart: string; disclaimer: string;
  };
  years: Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9, YearText>;
  transits: Record<SlowPlanet, Record<TransitKind, string>>;
  retroNotes: Record<"Mercury" | "Venus" | "Mars", string>;
  ingressNotes: Record<"Jupiter" | "Saturn", string>;
}
