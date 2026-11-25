import type { NatalPoint, TransitBody } from "@shared/daily";

export type Tone = "soft" | "hard" | "conj";
/** Texts for the personal daily horoscope (/:lang/today). */
export interface DailyContent {
  ui: {
    eyebrow: string; title: string; titleFor: (name: string) => string; intro: string;
    today: string; tomorrow: string;
    overallTitle: string; overall: [string, string, string, string, string];
    moonTitle: (house: string, sign: string) => string; tipTitle: string;
    transitsTitle: string; transitsIntro: string; noTransits: string; touches: string;
    spheresTitle: string;
    sunHouses: string;
    signInTitle: string; signInText: string; signInBtn: string; logIn: string;
    saveTitle: string; saveText: string; saveBtn: string;
    change: string; openChart: string; asc: string;
    disclaimer: string;
  };
  houses: { focus: string; tip: string }[]; // index 0..11 = houses 1..12
  points: Record<NatalPoint, string>;        // the part of you that is touched
  bodies: Record<TransitBody, Record<Tone, string>>;
}
