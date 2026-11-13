// Ulduz chart engine — shared by the web app (via Vite alias) and Supabase Edge Functions (Deno).
// Tropical zodiac, geocentric, whole-sign houses, mean North Node.
import * as Astronomy from "npm:astronomy-engine@2.1.19";

export type PlanetKey =
  | "Sun" | "Moon" | "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn"
  | "Uranus" | "Neptune" | "Pluto" | "Node";
export type Element = "Fire" | "Earth" | "Air" | "Water";
export type Modality = "Cardinal" | "Fixed" | "Mutable";
export type AspectType = "conjunction" | "sextile" | "square" | "trine" | "opposition";

export { SIGNS, SIGN_GLYPHS, SIGN_ELEMENT, SIGN_MODALITY, PLANETS } from "./zodiac.ts";
import { SIGNS, SIGN_ELEMENT, SIGN_MODALITY, PLANETS } from "./zodiac.ts";
export const PLANET_KEYS = PLANETS.map((p) => p.key);
export const OUTER: PlanetKey[] = ["Uranus", "Neptune", "Pluto", "Node"];

export const ASPECTS: { type: AspectType; angle: number; orb: number; symbol: string }[] = [
  { type: "conjunction", angle: 0, orb: 8, symbol: "☌" },
  { type: "sextile", angle: 60, orb: 4, symbol: "⚹" },
  { type: "square", angle: 90, orb: 6, symbol: "□" },
  { type: "trine", angle: 120, orb: 6, symbol: "△" },
  { type: "opposition", angle: 180, orb: 8, symbol: "☍" },
];

export const norm = (a: number) => ((a % 360) + 360) % 360;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
export const signOf = (lon: number) => Math.floor(norm(lon) / 30);
export const degreeIn = (lon: number) => {
  const x = norm(lon) % 30;
  const d = Math.floor(x);
  return { d, m: Math.floor((x - d) * 60) };
};
export const separation = (a: number, b: number) => Math.abs(norm(a - b + 180) - 180);

/* ---------- time ---------- */
/** Offset (ms) of an IANA zone at a UTC instant — uses the runtime's tz database, so historic DST is respected. */
export function tzOffsetMs(utcMs: number, tz: string): number {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(new Date(utcMs))) p[x.type] = x.value;
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}
export function localToUtc(y: number, mo: number, d: number, h: number, mi: number, tz: string): Date {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  let utc = guess - tzOffsetMs(guess, tz);
  utc = guess - tzOffsetMs(utc, tz);
  return new Date(utc);
}

/* ---------- positions ---------- */
const centuries = (date: Date) => Astronomy.MakeTime(date).tt / 36525;
export function planetLon(key: PlanetKey, date: Date): number {
  if (key === "Sun") return norm(Astronomy.SunPosition(date).elon);
  if (key === "Moon") return norm(Astronomy.EclipticGeoMoon(date).lon);
  if (key === "Node") {
    const T = centuries(date);
    return norm(125.04452 - 1934.136261 * T + 0.0020708 * T * T);
  }
  const body = (Astronomy.Body as Record<string, Astronomy.Body>)[key];
  return norm(Astronomy.Ecliptic(Astronomy.GeoVector(body, date, true)).elon);
}
export const obliquity = (date: Date) => 23.439291 - 0.0130042 * centuries(date);
export function angles(date: Date, lat: number, lon: number) {
  const ramc = norm(Astronomy.SiderealTime(date) * 15 + lon);
  const e = rad(obliquity(date)), r = rad(ramc), f = rad(lat);
  const asc = norm(deg(Math.atan2(Math.cos(r), -(Math.sin(r) * Math.cos(e) + Math.tan(f) * Math.sin(e)))));
  const mc = norm(deg(Math.atan2(Math.sin(r), Math.cos(r) * Math.cos(e))));
  return { asc, mc };
}

/* ---------- dignity & rulers ---------- */
const DOMICILE: Partial<Record<PlanetKey, number[]>> = { Sun: [4], Moon: [3], Mercury: [2, 5], Venus: [1, 6], Mars: [0, 7], Jupiter: [8, 11], Saturn: [9, 10] };
const EXALT: Partial<Record<PlanetKey, number>> = { Sun: 0, Moon: 1, Mercury: 5, Venus: 11, Mars: 9, Jupiter: 3, Saturn: 6 };
export type Dignity = "domicile" | "exaltation" | "detriment" | "fall" | null;
export function dignity(key: PlanetKey, sign: number): Dignity {
  const dom = DOMICILE[key];
  if (!dom) return null;
  if (dom.includes(sign)) return "domicile";
  if (EXALT[key] === sign) return "exaltation";
  if (dom.map((x) => (x + 6) % 12).includes(sign)) return "detriment";
  if (((EXALT[key] as number) + 6) % 12 === sign) return "fall";
  return null;
}
export const TRADITIONAL_RULER: PlanetKey[] = ["Mars","Venus","Mercury","Moon","Sun","Mercury","Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"];

/* ---------- chart ---------- */
export interface Position { lon: number; sign: number; retro: boolean; house: number | null; dignity: Dignity }
export interface Aspect { a: PlanetKey; b: PlanetKey; type: AspectType; orb: number }
export interface Chart {
  utc: string;
  timeKnown: boolean;
  pos: Record<PlanetKey, Position>;
  angles: { asc: number; mc: number } | null;
  aspects: Aspect[];
  elements: Record<Element, number>;   // percentages 0–100
  modalities: Record<Modality, number>; // percentages 0–100
  moonAlt: number | null;               // other possible Moon sign when time unknown
}
export interface BirthInput {
  fullName: string;
  date: string;        // YYYY-MM-DD
  time: string | null; // HH:MM or null when unknown
  lat: number | null;
  lon: number | null;
  tz: string;          // IANA
}

export function computeChart(input: BirthInput): Chart {
  const [y, m, d] = input.date.split("-").map(Number);
  const timeKnown = !!input.time;
  const [hh, mm] = timeKnown ? input.time!.split(":").map(Number) : [12, 0];
  const utc = localToUtc(y, m, d, hh, mm, input.tz);

  const raw: Partial<Record<PlanetKey, Position>> = {};
  for (const { key } of PLANETS) {
    const lon = planetLon(key, utc);
    let retro = false;
    if (!["Sun", "Moon", "Node"].includes(key)) {
      const next = planetLon(key, new Date(utc.getTime() + 864e5));
      retro = norm(next - lon + 180) - 180 < 0;
    }
    const sign = signOf(lon);
    raw[key] = { lon, sign, retro, house: null, dignity: dignity(key, sign) };
  }
  const pos = raw as Record<PlanetKey, Position>;

  let ang: Chart["angles"] = null;
  if (timeKnown && input.lat != null && input.lon != null) {
    ang = angles(utc, input.lat, input.lon);
    const ascSign = signOf(ang.asc);
    for (const k of PLANET_KEYS) pos[k].house = ((pos[k].sign - ascSign + 12) % 12) + 1;
  }

  const aspects: Aspect[] = [];
  for (let i = 0; i < PLANET_KEYS.length; i++)
    for (let j = i + 1; j < PLANET_KEYS.length; j++) {
      const a = PLANET_KEYS[i], b = PLANET_KEYS[j];
      if (OUTER.includes(a) && OUTER.includes(b)) continue;
      const sep = separation(pos[a].lon, pos[b].lon);
      for (const A of ASPECTS) {
        if ((a === "Node" || b === "Node") && A.angle !== 0) continue;
        const orb = A.orb + (a === "Sun" || a === "Moon" ? 1 : 0);
        const diff = Math.abs(sep - A.angle);
        if (diff <= orb) aspects.push({ a, b, type: A.type, orb: Math.round(diff * 10) / 10 });
      }
    }
  aspects.sort((x, z) => x.orb - z.orb);

  const W: Partial<Record<PlanetKey, number>> = { Sun: 3, Moon: 3, Mercury: 2, Venus: 2, Mars: 2, Jupiter: 1, Saturn: 1, Uranus: 0.5, Neptune: 0.5, Pluto: 0.5 };
  const el: Record<Element, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  const mo: Record<Modality, number> = { Cardinal: 0, Fixed: 0, Mutable: 0 };
  for (const [k, w] of Object.entries(W) as [PlanetKey, number][]) {
    el[SIGN_ELEMENT[pos[k].sign]] += w;
    mo[SIGN_MODALITY[pos[k].sign]] += w;
  }
  if (ang) { el[SIGN_ELEMENT[signOf(ang.asc)]] += 3; mo[SIGN_MODALITY[signOf(ang.asc)]] += 3; }
  const pct = <T extends string>(o: Record<T, number>) => {
    const tot = Object.values<number>(o).reduce((s, v) => s + v, 0);
    const out = {} as Record<T, number>;
    for (const k in o) out[k] = Math.round((o[k] / tot) * 100);
    return out;
  };

  let moonAlt: number | null = null;
  if (!timeKnown) {
    const m0 = signOf(planetLon("Moon", localToUtc(y, m, d, 0, 0, input.tz)));
    const m1 = signOf(planetLon("Moon", localToUtc(y, m, d, 23, 59, input.tz)));
    if (m0 !== m1) moonAlt = m0 === pos.Moon.sign ? m1 : m0;
  }

  return { utc: utc.toISOString(), timeKnown, pos, angles: ang, aspects, elements: pct(el), modalities: pct(mo), moonAlt };
}

export const fmtDeg = (lon: number) => {
  const { d, m } = degreeIn(lon);
  return `${d}°${String(m).padStart(2, "0")}′`;
};
export const fmtPos = (lon: number) => `${fmtDeg(lon)} ${SIGNS[signOf(lon)]}`;

/* ---------- derived analysis (language-neutral keys) ---------- */
export const isSoft = (t: AspectType) => t === "trine" || t === "sextile";
export const isHard = (t: AspectType) => t === "square" || t === "opposition";
export const pairKey = (a: PlanetKey, b: PlanetKey) =>
  PLANET_KEYS.indexOf(a) < PLANET_KEYS.indexOf(b) ? `${a}-${b}` : `${b}-${a}`;

export function jungianType(c: Chart): string {
  const e = c.elements, m = c.modalities;
  return (e.Fire + e.Air >= e.Earth + e.Water ? "E" : "I") + (e.Fire >= e.Earth ? "N" : "S") +
    (e.Air > e.Water ? "T" : "F") + (m.Mutable < (m.Cardinal + m.Fixed) / 2 ? "J" : "P");
}

export type AttachmentKey = "secure" | "anxious" | "avoidant" | "fearful";
export function attachment(c: Chart): AttachmentKey {
  let sec = 1.5, anx = 0, avo = 0;
  const mo = c.pos.Moon.sign, ve = c.pos.Venus.sign;
  const el = SIGN_ELEMENT[mo];
  if (el === "Water") anx += 2; else if (el === "Air") avo += 1.5; else sec += 1;
  if (mo === 9 || mo === 10) avo += 1;
  if (mo === 3 || mo === 7) anx += 0.5;
  if (mo === 1 || mo === 3) sec += 0.5;
  if ([5, 9, 10].includes(ve)) avo += 1;
  if ([3, 6, 7, 11].includes(ve)) anx += 1;
  if ([1, 4].includes(ve)) sec += 1;
  if (c.pos.Moon.house === 12) avo += 1;
  if (c.pos.Venus.house === 12) anx += 0.5;
  for (const a of c.aspects) {
    const pair = [a.a, a.b];
    if (!pair.includes("Moon") && !pair.includes("Venus")) continue;
    const other = pair.find((x) => x !== "Moon" && x !== "Venus") ?? (pair[0] === "Moon" ? pair[1] : pair[0]);
    const hard = isHard(a.type) || (a.type === "conjunction" && ["Saturn", "Pluto", "Uranus", "Neptune"].includes(other));
    if (other === "Saturn" && hard) { avo += 1.5; anx += 0.5; }
    else if (other === "Pluto" && hard) anx += 1.5;
    else if (other === "Uranus" && hard) avo += 1.5;
    else if (other === "Neptune" && hard) anx += 1;
    else if (["Jupiter", "Sun", "Moon", "Venus"].includes(other) && (isSoft(a.type) || a.type === "conjunction")) sec += 1;
  }
  if (anx >= 2.5 && avo >= 2.5 && Math.abs(anx - avo) < 1.5) return "fearful";
  if (sec >= Math.max(anx, avo)) return "secure";
  return anx > avo ? "anxious" : "avoidant";
}

export function dominantElement(c: Chart): Element {
  return (Object.entries(c.elements) as [Element, number][]).sort((a, b) => b[1] - a[1])[0][0];
}
export function weakElement(c: Chart): Element | null {
  const [k, v] = (Object.entries(c.elements) as [Element, number][]).sort((a, b) => a[1] - b[1])[0];
  return v < 12 ? k : null;
}
export function dominantModality(c: Chart): Modality {
  return (Object.entries(c.modalities) as [Modality, number][]).sort((a, b) => b[1] - a[1])[0][0];
}

/* ---------- transits & life cycles ---------- */
export interface Transit { transit: PlanetKey; natal: PlanetKey | "Ascendant" | "Midheaven"; type: AspectType; orb: number }
export function transits(c: Chart, now = new Date()) {
  const slow: PlanetKey[] = ["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
  const targets: PlanetKey[] = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
  const current: Partial<Record<PlanetKey, { lon: number; sign: number; house: number | null }>> = {};
  const list: Transit[] = [];
  for (const k of slow) {
    const lon = planetLon(k, now);
    current[k] = { lon, sign: signOf(lon), house: c.angles ? ((signOf(lon) - signOf(c.angles.asc) + 12) % 12) + 1 : null };
    const pts: [Transit["natal"], number][] = targets.map((t) => [t, c.pos[t].lon]);
    if (c.angles) pts.push(["Ascendant", c.angles.asc], ["Midheaven", c.angles.mc]);
    for (const [t, tl] of pts) {
      const sep = separation(lon, tl);
      for (const A of ASPECTS) {
        const d = Math.abs(sep - A.angle);
        if (d <= (A.angle === 0 || A.angle === 180 ? 3 : 2.5)) list.push({ transit: k, natal: t, type: A.type, orb: Math.round(d * 10) / 10 });
      }
    }
  }
  list.sort((a, b) => a.orb - b.orb);
  return { current, list };
}

export function lifeCycles(c: Chart, now = new Date()) {
  const age = (now.getTime() - new Date(c.utc).getTime()) / (365.2425 * 864e5);
  const satDist = separation(planetLon("Saturn", now), c.pos.Saturn.lon);
  const jupDist = separation(planetLon("Jupiter", now), c.pos.Jupiter.lon);
  const notes: string[] = [];
  if (satDist < 12) notes.push(age < 45 ? "in or near the first Saturn return" : "in or near the second Saturn return");
  else if (Math.abs(satDist - 180) < 12) notes.push("transiting Saturn opposes natal Saturn (a mid-cycle reckoning)");
  else if (Math.abs(satDist - 90) < 10) notes.push("transiting Saturn squares natal Saturn (a structural check-in)");
  if (satDist >= 12) {
    if (age >= 27 && age < 29.5) notes.push("approaching the first Saturn return");
    else if (age >= 29.5 && age < 34) notes.push("recently came through the first Saturn return (around age 29–30)");
    else if (age >= 56 && age < 58.5) notes.push("approaching the second Saturn return");
    else if (age >= 58.5 && age < 63) notes.push("recently came through the second Saturn return");
  }
  if (jupDist < 10) notes.push("in a Jupiter return (a new 12-year cycle of growth)");
  if (age >= 40 && age <= 44) notes.push("in the Uranus-opposition / mid-life window");
  return { age: Math.floor(age), notes };
}
