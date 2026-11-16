// "Sky of the day": Moon sign and phase, lunar day, retrograde planets, the universal day number
// and a traditional lunar haircut verdict. Shared by web and server.
import * as Astronomy from "npm:astronomy-engine@2.1.19";
import { norm, planetLon, signOf, type PlanetKey } from "./astro.ts";
import { reduce } from "./numerology.ts";

export type Phase = "new" | "waxing" | "full" | "waning";
export type Verdict = "good" | "neutral" | "bad";
export type HaircutReason = "newFull" | "lunarDay" | "sign";
export interface SkyDay {
  date: string;              // local YYYY-MM-DD
  moonSign: number;          // at local noon
  moonSignChange: number | null; // the sign the Moon moves into later that day, if it changes
  phase: Phase;
  illumination: number;      // 0–100
  lunarDay: number;          // 1–30, counted from the last new moon
  retro: PlanetKey[];
  dayNumber: number;         // universal day number 1–9
  haircut: Verdict;
  haircutReason: HaircutReason;
}

const DAY = 86400000;
const RETRO_CHECK: PlanetKey[] = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
const GOOD_SIGNS = [1, 4, 5, 6, 9];   // Taurus, Leo, Virgo, Libra, Capricorn
const BAD_SIGNS = [3, 7, 11];         // Cancer, Scorpio, Pisces
const HARD_LUNAR_DAYS = [9, 15, 23, 29];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Sky for a local calendar day (computed at local noon, in the browser's time zone). */
export function skyDay(y: number, m: number, d: number): SkyDay {
  const noon = new Date(y, m - 1, d, 12);
  const end = new Date(y, m - 1, d, 23, 59, 59);
  const moon = planetLon("Moon", noon), sun = planetLon("Sun", noon);
  const elong = norm(moon - sun);
  const illumination = Math.round(((1 - Math.cos((elong * Math.PI) / 180)) / 2) * 100);
  const phase: Phase = elong < 12 || elong > 348 ? "new" : Math.abs(elong - 180) < 12 ? "full" : elong < 180 ? "waxing" : "waning";
  const lastNew = Astronomy.SearchMoonPhase(0, noon, -31);
  const lunarDay = lastNew ? Math.min(30, Math.floor((noon.getTime() - lastNew.date.getTime()) / DAY) + 1) : 1;
  const signEnd = signOf(planetLon("Moon", end));
  const moonSign = signOf(moon);
  const retro = RETRO_CHECK.filter((k) => norm(planetLon(k, new Date(noon.getTime() + DAY)) - planetLon(k, noon) + 180) - 180 < 0);
  const dayNumber = reduce([...`${y}${m}${d}`].reduce((a, c) => a + Number(c), 0), false);

  let haircut: Verdict, haircutReason: HaircutReason;
  if (phase === "new" || phase === "full") { haircut = "bad"; haircutReason = "newFull"; }
  else if (HARD_LUNAR_DAYS.includes(lunarDay)) { haircut = "bad"; haircutReason = "lunarDay"; }
  else { haircutReason = "sign"; haircut = GOOD_SIGNS.includes(moonSign) ? "good" : BAD_SIGNS.includes(moonSign) ? "bad" : "neutral"; }

  return {
    date: iso(noon), moonSign, moonSignChange: signEnd !== moonSign ? signEnd : null,
    phase, illumination, lunarDay, retro, dayNumber, haircut, haircutReason,
  };
}

export function skyMonth(y: number, m: number): SkyDay[] {
  const days = new Date(y, m, 0).getDate();
  return Array.from({ length: days }, (_, i) => skyDay(y, m, i + 1));
}
