// Transit alerts: when the slow planets (Jupiter to Pluto) make exact aspects to the points of one birth chart.
// These are the long background themes of a life, lasting weeks (Jupiter, Saturn) or months (Uranus, Neptune, Pluto).
// Shared by web and server (so reminder emails can use the same list).
import { ASPECTS, planetLon, separation, type AspectType, type Chart } from "./astro.ts";

export type SlowPlanet = "Jupiter" | "Saturn" | "Uranus" | "Neptune" | "Pluto";
export type AlertPoint = "Sun" | "Moon" | "Mercury" | "Venus" | "Mars" | "Asc" | "MC";
export type AlertKind = "conjunction" | "soft" | "hard";
export const SLOW_PLANETS: SlowPlanet[] = ["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];

export interface TransitAlert {
  planet: SlowPlanet;
  point: AlertPoint;
  type: AspectType;
  kind: AlertKind;
  start: string;   // YYYY-MM-DD, first day within orb
  end: string;     // last day within orb
  exact: string[]; // days of exactness (several when the planet turns retrograde)
  active: boolean; // within orb on the reference day (a long window can pause while the planet loops back)
}

const DAY = 86400000;
const ORB: Record<SlowPlanet, number> = { Jupiter: 1.5, Saturn: 1.5, Uranus: 1, Neptune: 1, Pluto: 1 };
// The same contact coming back after a retrograde loop is one story, so windows this close are merged.
const MERGE_GAP_DAYS = 150;
const kindOf = (t: AspectType): AlertKind => (t === "conjunction" ? "conjunction" : t === "trine" || t === "sextile" ? "soft" : "hard");
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/**
 * Alerts that are active on `from` or begin within `days` after it, soonest first (active ones first).
 * Sampled once a day at 12:00 UTC.
 */
export function transitAlerts(chart: Chart, from: Date = new Date(), days = 365): TransitAlert[] {
  const points: { key: AlertPoint; lon: number }[] = (["Sun", "Mercury", "Venus", "Mars"] as const).map((k) => ({ key: k, lon: chart.pos[k].lon }));
  if (chart.timeKnown) points.splice(1, 0, { key: "Moon", lon: chart.pos.Moon.lon });
  if (chart.angles) points.push({ key: "Asc", lon: chart.angles.asc }, { key: "MC", lon: chart.angles.mc });

  const day0 = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 12);
  // Look back far enough to find where a running transit began (outer planets can sit in orb for months).
  const startT = day0 - 240 * DAY, endT = day0 + days * DAY;

  type Win = { start: number; end: number; best: number; bestT: number; exact: number[]; now: boolean };
  const wins = new Map<string, Win[]>();
  const prev = new Map<string, number>(); // previous day's distance from exact, to spot the turning points
  const prev2 = new Map<string, number>();

  for (let t = startT; t <= endT; t += DAY) {
    const date = new Date(t);
    for (const planet of SLOW_PLANETS) {
      const lon = planetLon(planet, date);
      for (const p of points) {
        const sep = separation(lon, p.lon);
        for (const a of ASPECTS) {
          const key = `${planet}|${p.key}|${a.type}`;
          const diff = Math.abs(sep - a.angle);
          const before = prev.get(key), before2 = prev2.get(key);
          prev2.set(key, before ?? diff); prev.set(key, diff);
          if (diff > ORB[planet]) continue;
          const list = wins.get(key) ?? [];
          const last = list[list.length - 1];
          if (last && t - last.end <= MERGE_GAP_DAYS * DAY) last.end = t;
          else list.push({ start: t, end: t, best: diff, bestT: t, exact: [], now: false });
          const w = list[list.length - 1];
          if (diff < w.best) { w.best = diff; w.bestT = t; }
          if (t === day0) w.now = true;
          // Yesterday was a local minimum and close enough to call it exact.
          if (before !== undefined && before2 !== undefined && before <= before2 && before < diff && before < 0.35) w.exact.push(t - DAY);
          wins.set(key, list);
        }
      }
    }
  }

  const out: TransitAlert[] = [];
  for (const [key, list] of wins) {
    const [planet, point, type] = key.split("|") as [SlowPlanet, AlertPoint, AspectType];
    for (const w of list) {
      if (w.end < day0 || w.start > endT) continue;
      const exact = (w.exact.length ? w.exact : [w.bestT]).map(iso);
      out.push({ planet, point, type, kind: kindOf(type), start: iso(w.start), end: iso(w.end), exact, active: w.now });
    }
  }
  // Active ones first, then by the next exact date still ahead.
  const today = iso(day0);
  const next = (a: TransitAlert) => (a.active ? "" : a.exact.find((d) => d >= today) ?? a.start);
  return out.sort((a, b) => next(a).localeCompare(next(b)) || SLOW_PLANETS.indexOf(a.planet) - SLOW_PLANETS.indexOf(b.planet));
}
