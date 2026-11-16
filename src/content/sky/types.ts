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
