import type { HaircutReason, Phase, Verdict } from "@shared/sky";

export interface SkyContent {
  ui: {
    eyebrow: string; todayTitle: (date: string) => string; dayTitle: (date: string) => string;
    moonIn: (sign: string) => string; moonMoves: (sign: string) => string; illumination: (p: number) => string;
    lunarDay: (n: number) => string; dayNumber: string;
    doTitle: string; avoidTitle: string;
    haircutTitle: string; verdict: Record<Verdict, string>;
    retroTitle: string; noRetro: string;
    toCalendar: string;
    calTitle: string; calIntro: string; weekdays: string[]; prev: string; next: string; today: string;
    legendGood: string; legendNeutral: string; legendBad: string; tapHint: string;
    disclaimer: string;
  };
  phases: Record<Phase, { name: string; text: string }>;
  moonSigns: { mood: string; do: [string, string]; avoid: [string, string]; hair: string }[]; // 12
  haircutReason: Record<Exclude<HaircutReason, "sign">, string>;
  hairGrowth: { waxing: string; waning: string };
  retro: Partial<Record<"Mercury" | "Venus" | "Mars", string>> & { other: (names: string) => string };
}

import type { AspectType, PlanetKey } from "@shared/astro";
import type { Sphere } from "@shared/sky";

/** Texts for the detailed "sky today" view. */
export interface SkyMore {
  ui: {
    lunarDayTitle: (n: number, symbol: string) => string;
    ingress: (time: string, sign: string) => string;
    seasonTitle: (sign: string) => string;
    spheresTitle: string; sphereNames: Record<Sphere, string>; sphereLevels: [string, string, string, string, string];
    planetsTitle: string; retroMark: string;
    aspectsTitle: string; aspectsIntro: string; noAspects: string;
    eventsTitle: string; nextFull: string; nextNew: string; mercStarts: string; mercEnds: string; inDays: (n: number) => string;
    personalTitle: string; personalIntro: string; personalDate: string; personalBtn: string;
    personalDay: string; personalMonth: string; personalYear: (y: number) => string; personalChange: string;
  };
  lunarDays: [string, string][];      // 30 × [symbol, meaning]
  sunSeason: string[];                // 12
  planetThemes: Partial<Record<PlanetKey, string>>;
  aspectTypes: Record<AspectType, string>;
}
