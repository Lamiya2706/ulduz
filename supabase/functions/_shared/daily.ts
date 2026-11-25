// Personal daily horoscope: today's sky laid over one birth chart.
// The Moon's house (whole-sign from the Ascendant, or from the Sun sign when the birth time is unknown),
// the tightest contacts of the fast planets to the natal planets, and a 1–5 score per life area.
// Shared by web and server.
import { ASPECTS, planetLon, separation, signOf, type AspectType, type Chart } from "./astro.ts";
import { skyDay, skyDetails, SPHERES, type SkyDay, type Sphere } from "./sky.ts";

export type TransitBody = "Moon" | "Sun" | "Mercury" | "Venus" | "Mars";
export type NatalPoint = "Sun" | "Moon" | "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn" | "Asc";
export const TRANSIT_BODIES: TransitBody[] = ["Moon", "Sun", "Mercury", "Venus", "Mars"];
const NATAL: Exclude<NatalPoint, "Asc">[] = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
// The Moon moves ~13° a day, so a wider orb catches the contacts it makes during the day.
const ORB: Record<TransitBody, number> = { Moon: 5, Sun: 1.5, Mercury: 1.5, Venus: 1.5, Mars: 1.5 };
// How much a contact matters for "today": fast, personal planets on personal points first.
const BODY_W: Record<TransitBody, number> = { Moon: 1, Sun: 1.4, Mercury: 1.1, Venus: 1.3, Mars: 1.4 };
const POINT_W: Record<NatalPoint, number> = { Sun: 1.5, Moon: 1.5, Asc: 1.4, Venus: 1.2, Mars: 1.2, Mercury: 1, Jupiter: 0.8, Saturn: 0.9 };

export interface DailyTransit { body: TransitBody; point: NatalPoint; type: AspectType; orb: number; soft: boolean | null }
export interface PersonalDay {
  date: string;
  sky: SkyDay;
  moonSign: number;
  moonHouse: number;             // 1–12
  houseFrom: "asc" | "sun";      // what the houses are counted from
  transits: DailyTransit[];      // up to 4, most important first
  spheres: Record<Sphere, number>; // 1–5
  overall: number;               // 1–5
}

const softness = (t: AspectType): boolean | null => (t === "trine" || t === "sextile" ? true : t === "square" || t === "opposition" ? false : null);
// Conjunctions with the benefics read as easy, with Mars and Saturn as demanding.
const conjTone = (b: TransitBody, p: NatalPoint) => (b === "Venus" || p === "Venus" || p === "Jupiter" ? 1 : b === "Mars" || p === "Saturn" ? -1 : 0);

/** The personal day for a local calendar date (planets at local noon). */
export function personalDay(chart: Chart, y: number, m: number, d: number): PersonalDay {
  const noon = new Date(y, m - 1, d, 12);
  const sky = skyDay(y, m, d);
  const details = skyDetails(y, m, d, sky);
  const asc = chart.angles?.asc ?? null;
  const base = asc != null ? signOf(asc) : chart.pos.Sun.sign;
  const moonSign = sky.moonSign;
  const moonHouse = ((moonSign - base + 12) % 12) + 1;

  const points: { key: NatalPoint; lon: number }[] = NATAL.map((k) => ({ key: k, lon: chart.pos[k].lon }));
  if (asc != null) points.push({ key: "Asc", lon: asc });
  // Without a birth time the natal Moon can be off by up to ~7°, so only count it with a known time.
  const usable = chart.timeKnown ? points : points.filter((p) => p.key !== "Moon");

  const found: (DailyTransit & { w: number })[] = [];
  for (const body of TRANSIT_BODIES) {
    const lon = planetLon(body, noon);
    for (const p of usable) {
      if (body === p.key && body !== "Moon" && body !== "Sun") continue; // e.g. Venus return — rare, skip the noise
      const sep = separation(lon, p.lon);
      for (const a of ASPECTS) {
        const orb = Math.abs(sep - a.angle);
        if (orb > ORB[body]) continue;
        const w = BODY_W[body] * POINT_W[p.key] * (1 - orb / (ORB[body] + 1)) * (a.type === "conjunction" || a.type === "opposition" ? 1.15 : 1);
        found.push({ body, point: p.key, type: a.type, orb: Math.round(orb * 10) / 10, soft: softness(a.type), w });
      }
    }
  }
  found.sort((x, z) => z.w - x.w);
  // One contact per planet, so each line says something different.
  const seen = new Set<TransitBody>();
  const transits = found.filter((t) => !seen.has(t.body) && seen.add(t.body)).slice(0, 4).map(({ w: _w, ...t }) => t);

  // Start from the general sky of the day, then tilt each area by the personal contacts and the Moon's house.
  const sp: Record<Sphere, number> = { ...details.spheres };
  const bump = (k: Sphere, v: number) => { sp[k] += v; };
  for (const t of found) {
    const tone = t.soft === true ? 1 : t.soft === false ? -1 : conjTone(t.body, t.point);
    if (!tone) continue;
    const has = (x: string) => t.body === x || t.point === x;
    if (has("Venus") || (t.body === "Moon" && t.point === "Moon")) bump("love", tone);
    if (has("Jupiter") || (has("Venus") && (has("Sun") || has("Asc")))) bump("money", tone);
    if (has("Mercury") || has("Saturn") || (t.body === "Sun" && t.point === "Sun")) bump("work", tone);
    if (has("Mars") || (t.point === "Asc" && t.body === "Moon")) bump("health", tone);
  }
  if ([5, 7].includes(moonHouse)) bump("love", 1);
  if ([2, 8].includes(moonHouse)) bump("money", 1);
  if ([6, 10].includes(moonHouse)) bump("work", 1);
  if (moonHouse === 12) bump("health", -1);
  if (moonHouse === 1) bump("health", 1);
  for (const k of SPHERES) sp[k] = Math.max(1, Math.min(5, Math.round(sp[k])));
  const overall = Math.max(1, Math.min(5, Math.round(SPHERES.reduce((s, k) => s + sp[k], 0) / SPHERES.length)));

  return { date: sky.date, sky, moonSign, moonHouse, houseFrom: asc != null ? "asc" : "sun", transits, spheres: sp, overall };
}
