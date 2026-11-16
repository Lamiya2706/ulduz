import type { CoreKey } from "@shared/numerology-full";

export interface NumText {
  title: string;
  essence: string;   // who you are with this number — 2–3 sentences
  love: string;      // in relationships
  work: string;      // in work and money
  advice: string;    // one piece of advice
  pinnacle: string;  // as the theme of a life period
}

type Nine<T> = Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9, T>;

export interface NumContent {
  ui: {
    eyebrow: string; title1: string; title2: string; sub: string; trust: string;
    submit: string; dateOnly: string;
    nav: { core: string; name: string; karma: string; square: string; cycles: string; now: string };
    coreTitle: string; coreIntro: string; loveL: string; workL: string; adviceL: string; more: string; less: string;
    nameTitle: string; nameIntro: string; vowelsNote: string; intensityTitle: string; passionTitle: string; passionText: (nums: string) => string;
    karmaTitle: string; karmaIntro: string; debtTitle: string; debtIn: (position: string) => string; noDebt: string;
    lessonsTitle: string; noLessons: string;
    squareTitle: string; squareIntro: string; workingNumbers: string; empty: string;
    cyclesTitle: string; cyclesIntro: string; pinnacles: string; challenges: string;
    ages: (from: number, to: number | null) => string; nowBadge: string;
    nowTitle: string; yearL: (y: number) => string; monthL: string; dayL: string;
    ctaTitle: string; ctaText: string; ctaBtn: string; another: string; copy: string; copied: string;
    disclaimer: string;
  };
  positions: Record<CoreKey, [string, string]>; // [name, what it describes]
  numbers: Record<number, NumText>;               // 1–9, 11, 22, 33
  debts: Record<13 | 14 | 16 | 19, string>;
  lessons: Nine<string>;
  challenges: Record<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, string>;
  months: Nine<string>;
  days: Nine<string>;
  square: Nine<{ name: string; levels: [string, string, string, string] }>; // 0, 1, 2, 3+
}
