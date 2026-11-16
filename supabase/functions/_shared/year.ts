// Year forecast: personal year and months (numerology), slow-planet transits to the natal Sun,
// and the main sky events of a calendar year. Shared by web and server.
import * as Astronomy from "npm:astronomy-engine@2.1.19";
import { norm, planetLon, signOf, type AspectType, type PlanetKey } from "./astro.ts";
import { reduce } from "./numerology.ts";

const DAY = 86400000;
const digitSum = (n: number) => [...String(n)].reduce((a, c) => a + Number(c), 0);
const single = (n: number) => reduce(n, false);

export type TransitKind = "conjunction" | "soft" | "hard";
export type SlowPlanet = "Jupiter" | "Saturn" | "Uranus" | "Neptune" | "Pluto";
export interface SunTransit { planet: SlowPlanet; type: AspectType; kind: TransitKind; from: number; to: number } // months 1–12
export interface RetroPeriod { planet: "Mercury" | "Venus" | "Mars"; from: Date; to: Date }
export interface Eclipse { date: Date; solar: boolean; sign: number }
export interface Ingress { planet: "Jupiter" | "Saturn"; date: Date; sign: number }
export interface YearForecast {
  year: number; age: number; sunSign: number;
  personalYear: number; months: number[];           // 12 personal month numbers
  transits: SunTransit[];
  retro: RetroPeriod[]; eclipses: Eclipse[]; ingresses: Ingress[];
}

const SLOW: SlowPlanet[] = ["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
const TRANSIT_ASPECTS: { type: AspectType; angle: number; kind: TransitKind }[] = [
  { type: "conjunction", angle: 0, kind: "conjunction" }, { type: "sextile", angle: 60, kind: "soft" }, { type: "trine", angle: 120, kind: "soft" },
  { type: "square", angle: 90, kind: "hard" }, { type: "opposition", angle: 180, kind: "hard" },
];
const speed = (k: PlanetKey, t: Date) => norm(planetLon(k, new Date(t.getTime() + DAY / 2)) - planetLon(k, new Date(t.getTime() - DAY / 2)) + 180) - 180;

/** Sky events of a calendar year (the same for everyone). */
export function skyYear(year: number): Pick<YearForecast, "retro" | "eclipses" | "ingresses"> {
  const start = Date.UTC(year, 0, 1, 12), days = Math.round((Date.UTC(year + 1, 0, 1, 12) - start) / DAY);
  const retro: RetroPeriod[] = [];
  for (const planet of ["Mercury", "Venus", "Mars"] as const) {
    let from: Date | null = speed(planet, new Date(start)) < 0 ? new Date(start) : null;
    for (let i = 1; i <= days; i++) {
      const t = new Date(start + i * DAY), r = speed(planet, t) < 0;
      if (r && !from) from = t;
      if (!r && from) { retro.push({ planet, from, to: new Date(t.getTime() - DAY) }); from = null; }
    }
    if (from) retro.push({ planet, from, to: new Date(start + (days - 1) * DAY) });
  }
  retro.sort((a, b) => a.from.getTime() - b.from.getTime());

  const ingresses: Ingress[] = [];
  for (const planet of ["Jupiter", "Saturn"] as const) {
    let prev = signOf(planetLon(planet, new Date(start)));
    for (let i = 1; i < days; i++) {
      const t = new Date(start + i * DAY), s = signOf(planetLon(planet, t));
      if (s !== prev) { ingresses.push({ planet, date: t, sign: s }); prev = s; }
    }
  }
  ingresses.sort((a, b) => a.date.getTime() - b.date.getTime());

  const eclipses: Eclipse[] = [];
  const end = Date.UTC(year + 1, 0, 1);
  let s = Astronomy.SearchGlobalSolarEclipse(new Date(Date.UTC(year, 0, 1)));
  while (s.peak.date.getTime() < end) { eclipses.push({ date: s.peak.date, solar: true, sign: signOf(planetLon("Sun", s.peak.date)) }); s = Astronomy.NextGlobalSolarEclipse(s.peak); }
  let l = Astronomy.SearchLunarEclipse(new Date(Date.UTC(year, 0, 1)));
  while (l.peak.date.getTime() < end) {
    if (l.kind !== Astronomy.EclipseKind.Penumbral) eclipses.push({ date: l.peak.date, solar: false, sign: signOf(planetLon("Moon", l.peak.date)) });
    l = Astronomy.NextLunarEclipse(l.peak);
  }
  eclipses.sort((a, b) => a.date.getTime() - b.date.getTime());
  return { retro, eclipses, ingresses };
}

export function yearForecast(birthDate: string, year: number): YearForecast {
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const natalSun = planetLon("Sun", new Date(Date.UTC(by, bm - 1, bd, 12)));
  const personalYear = single(single(bm) + single(bd) + single(digitSum(year)));
  const months = Array.from({ length: 12 }, (_, i) => single(personalYear + i + 1));

  // Slow planets against the natal Sun, sampled every 3 days; orb 2°.
  const hits = new Map<string, { planet: SlowPlanet; type: AspectType; kind: TransitKind; months: Set<number> }>();
  for (let t = Date.UTC(year, 0, 1, 12); t < Date.UTC(year + 1, 0, 1); t += 3 * DAY) {
    const date = new Date(t), month = date.getUTCMonth() + 1;
    for (const planet of SLOW) {
      const sep = Math.abs(norm(planetLon(planet, date) - natalSun + 180) - 180);
      for (const a of TRANSIT_ASPECTS) {
        if (Math.abs(sep - a.angle) > 2) continue;
        const key = `${planet}-${a.type}`;
        if (!hits.has(key)) hits.set(key, { planet, type: a.type, kind: a.kind, months: new Set() });
        hits.get(key)!.months.add(month);
      }
    }
  }
  const transits: SunTransit[] = [...hits.values()].map((h) => ({ planet: h.planet, type: h.type, kind: h.kind, from: Math.min(...h.months), to: Math.max(...h.months) }))
    .sort((a, b) => SLOW.indexOf(a.planet) - SLOW.indexOf(b.planet) || a.from - b.from);

  return { year, age: year - by, sunSign: signOf(natalSun), personalYear, months, transits, ...skyYear(year) };
}
