// "Sky of the day": Moon sign and phase, lunar day, retrograde planets, the universal day number
// and a traditional lunar haircut verdict. Shared by web and server.
import * as Astronomy from "npm:astronomy-engine@2.1.19";
import { ASPECTS, norm, planetLon, signOf, type AspectType, type PlanetKey } from "./astro.ts";
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

/* ---------- detailed view for one day ---------- */

export type Sphere = "love" | "money" | "work" | "health";
export const SPHERES: Sphere[] = ["love", "money", "work", "health"];
// Traditional "how the Moon's sign colours the day", 1–5 per sphere: [love, money, work, health]
const SIGN_SPHERES: number[][] = [
  [3, 3, 4, 4], [4, 5, 4, 4], [3, 3, 4, 3], [4, 3, 3, 3], [5, 3, 4, 4], [3, 4, 5, 4],
  [5, 3, 3, 3], [4, 4, 3, 2], [4, 3, 3, 4], [3, 4, 5, 3], [3, 3, 4, 3], [4, 2, 2, 3],
];
const FAST: PlanetKey[] = ["Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
export interface DayAspect { a: PlanetKey; b: PlanetKey; type: AspectType; orb: number }
export interface SkyDetails {
  planets: { key: PlanetKey; sign: number; retro: boolean }[];
  sunSign: number;
  aspects: DayAspect[];
  moonIngress: Date | null;           // when the Moon changes sign during this local day
  spheres: Record<Sphere, number>;
  nextFull: Date; nextNew: Date;
  mercury: { retro: boolean; changes: Date | null }; // next station of Mercury (within ~4 months)
}

function mercuryStation(from: Date): Date | null {
  const speed = (t: Date) => norm(planetLon("Mercury", new Date(t.getTime() + DAY / 2)) - planetLon("Mercury", new Date(t.getTime() - DAY / 2)) + 180) - 180;
  const s0 = Math.sign(speed(from));
  for (let i = 1; i <= 130; i++) {
    const t = new Date(from.getTime() + i * DAY);
    if (Math.sign(speed(t)) !== s0) return t;
  }
  return null;
}

export function skyDetails(y: number, m: number, d: number, base: SkyDay = skyDay(y, m, d)): SkyDetails {
  const noon = new Date(y, m - 1, d, 12);
  const pos = FAST.map((key) => ({ key, lon: planetLon(key, noon) }));
  const planets = pos.map((p) => ({ key: p.key, sign: signOf(p.lon), retro: base.retro.includes(p.key) }));

  const aspects: DayAspect[] = [];
  for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) {
    const sep = Math.abs(norm(pos[i].lon - pos[j].lon + 180) - 180);
    for (const a of ASPECTS) {
      const orb = Math.abs(sep - a.angle);
      const slow = ["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
      if (slow.includes(pos[i].key) && slow.includes(pos[j].key)) continue; // generational, months long
      if (orb <= 2) aspects.push({ a: pos[i].key, b: pos[j].key, type: a.type, orb: Math.round(orb * 10) / 10 });
    }
  }
  aspects.sort((x, z) => x.orb - z.orb);

  let moonIngress: Date | null = null;
  const start = new Date(y, m - 1, d, 0, 0), end = new Date(y, m - 1, d, 23, 59);
  const s0 = signOf(planetLon("Moon", start));
  if (signOf(planetLon("Moon", end)) !== s0) {
    let lo = start.getTime(), hi = end.getTime();
    while (hi - lo > 60000) { const mid = (lo + hi) / 2; if (signOf(planetLon("Moon", new Date(mid))) === s0) lo = mid; else hi = mid; }
    moonIngress = new Date(hi);
  }

  const [love, money, work, health] = SIGN_SPHERES[base.moonSign];
  const sp: Record<Sphere, number> = { love, money, work, health };
  if (base.retro.includes("Venus")) { sp.love--; sp.money--; }
  if (base.retro.includes("Mercury")) sp.work--;
  if (base.retro.includes("Mars")) sp.health--;
  if (base.phase === "full" || base.phase === "new") sp.health--;
  for (const a of aspects) {
    const soft = a.type === "trine" || a.type === "sextile", hard = a.type === "square" || a.type === "opposition";
    const has = (k: PlanetKey) => a.a === k || a.b === k;
    const delta = soft ? 1 : hard ? -1 : 0;
    if (has("Venus")) sp.love += delta;
    if (has("Jupiter") && (has("Venus") || has("Sun"))) sp.money += delta;
    if (has("Mercury") || has("Saturn")) sp.work += delta;
    if (has("Mars")) sp.health += delta;
  }
  for (const k of SPHERES) sp[k] = Math.max(1, Math.min(5, sp[k]));

  const from = new Date(y, m - 1, d, 0, 0);
  const nextFull = Astronomy.SearchMoonPhase(180, from, 40)!.date;
  const nextNew = Astronomy.SearchMoonPhase(0, from, 40)!.date;
  return {
    planets, sunSign: signOf(pos[0].lon), aspects: aspects.slice(0, 5), moonIngress, spheres: sp, nextFull, nextNew,
    mercury: { retro: base.retro.includes("Mercury"), changes: mercuryStation(noon) },
  };
}
