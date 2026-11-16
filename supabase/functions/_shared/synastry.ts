// Synastry (relationship astrology): compares two natal charts. Pure functions shared by web and server.
// Scores describe "chart harmony" in each area — a symbolic reading, not a prediction.
import { ASPECTS, separation, SIGN_ELEMENT, signOf, type AspectType, type Chart, type Element, type PlanetKey } from "./astro.ts";

export type SynPoint = "Sun" | "Moon" | "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn" | "Ascendant";
export type SynCategory = "emotional" | "romance" | "communication" | "commitment" | "growth";
export const SYN_CATEGORIES: SynCategory[] = ["emotional", "romance", "communication", "commitment", "growth"];
const POINTS: SynPoint[] = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Ascendant"];

export interface InterAspect { a: SynPoint; b: SynPoint; type: AspectType; orb: number; pair: string; flow: boolean; weight: number }

/** Unordered pair key in a canonical order, e.g. "Moon-Venus". */
export const synPair = (x: SynPoint, y: SynPoint) => (POINTS.indexOf(x) <= POINTS.indexOf(y) ? `${x}-${y}` : `${y}-${x}`);

// Which life areas each contact speaks to, and how strongly.
const PAIR_WEIGHTS: Record<string, Partial<Record<SynCategory, number>>> = {
  "Moon-Moon": { emotional: 3 },
  "Sun-Moon": { emotional: 3, commitment: 2 },
  "Moon-Venus": { emotional: 2, romance: 2 },
  "Venus-Mars": { romance: 3 },
  "Sun-Venus": { romance: 2, emotional: 1 },
  "Venus-Venus": { romance: 1, emotional: 1 },
  "Mars-Mars": { romance: 1, growth: 1 },
  "Sun-Mars": { romance: 1.5, growth: 1 },
  "Moon-Mars": { romance: 1, emotional: 1 },
  "Mercury-Mercury": { communication: 3 },
  "Moon-Mercury": { communication: 2, emotional: 1 },
  "Sun-Mercury": { communication: 2 },
  "Mercury-Venus": { communication: 1.5, romance: 0.5 },
  "Mercury-Mars": { communication: 1.5 },
  "Sun-Saturn": { commitment: 2.5 },
  "Moon-Saturn": { commitment: 2.5, emotional: 1 },
  "Venus-Saturn": { commitment: 2.5, romance: 0.5 },
  "Mercury-Saturn": { communication: 1, commitment: 1 },
  "Mars-Saturn": { growth: 1, commitment: 0.5 },
  "Sun-Jupiter": { growth: 2 },
  "Moon-Jupiter": { growth: 2, emotional: 0.5 },
  "Venus-Jupiter": { growth: 1.5, romance: 1 },
  "Mercury-Jupiter": { communication: 1, growth: 1 },
  "Sun-Sun": { growth: 1, commitment: 1 },
  "Sun-Ascendant": { romance: 1, growth: 1 },
  "Moon-Ascendant": { emotional: 1.5 },
  "Venus-Ascendant": { romance: 1.5 },
  "Mars-Ascendant": { romance: 1 },
};
export const SYN_PAIRS = Object.keys(PAIR_WEIGHTS);

const ORB: Record<AspectType, number> = { conjunction: 7, opposition: 7, trine: 6, square: 6, sextile: 4 };
const HEAVY = new Set<SynPoint>(["Saturn", "Mars"]);
const ATTRACTION = new Set(["Venus-Mars", "Sun-Moon", "Sun-Venus", "Moon-Venus", "Venus-Ascendant", "Mars-Ascendant"]);

function lonOf(c: Chart, p: SynPoint): number | null {
  if (p === "Ascendant") return c.angles ? c.angles.asc : null;
  return c.pos[p as PlanetKey].lon;
}

/** Is a contact supportive ("flow") or challenging ("tension")? */
function isFlow(type: AspectType, a: SynPoint, b: SynPoint) {
  if (type === "trine" || type === "sextile") return true;
  if (type === "conjunction") return !(HEAVY.has(a) || HEAVY.has(b)) || (a === "Venus" && b === "Mars") || (a === "Mars" && b === "Venus");
  return false;
}

export function interAspects(A: Chart, B: Chart): InterAspect[] {
  const out: InterAspect[] = [];
  for (const pa of POINTS) for (const pb of POINTS) {
    const pair = synPair(pa, pb);
    if (!PAIR_WEIGHTS[pair]) continue;
    const la = lonOf(A, pa), lb = lonOf(B, pb);
    if (la === null || lb === null) continue;
    const sep = separation(la, lb);
    for (const asp of ASPECTS) {
      const orbMax = ORB[asp.type] - (pa === "Jupiter" || pa === "Saturn" || pb === "Jupiter" || pb === "Saturn" ? 1 : 0);
      const orb = Math.abs(sep - asp.angle);
      if (orb <= orbMax) {
        const w = Object.values(PAIR_WEIGHTS[pair]).reduce((s, v) => s + (v ?? 0), 0) * (1 - orb / (orbMax + 1));
        out.push({ a: pa, b: pb, type: asp.type, orb: Math.round(orb * 10) / 10, pair, flow: isFlow(asp.type, pa, pb), weight: Math.round(w * 100) / 100 });
      }
    }
  }
  return out.sort((x, y) => y.weight - x.weight);
}

export type ElementRelation = "same" | "compatible" | "different";
export function elementRelation(x: Element, y: Element): ElementRelation {
  if (x === y) return "same";
  const pairs = [["Fire", "Air"], ["Earth", "Water"]];
  return pairs.some(([p, q]) => (x === p && y === q) || (x === q && y === p)) ? "compatible" : "different";
}

export type LifePathRelation = "mirror" | "harmonious" | "complementary";
const root = (n: number) => (n === 11 ? 2 : n === 22 ? 4 : n === 33 ? 6 : n);
export function lifePathRelation(a: number, b: number): LifePathRelation {
  if (a === b) return "mirror";
  const groups = [[1, 5, 7], [2, 4, 8], [3, 6, 9]];
  return groups.some((g) => g.includes(root(a)) && g.includes(root(b))) ? "harmonious" : "complementary";
}

export interface Synastry {
  aspects: InterAspect[];
  scores: Record<SynCategory, number>;
  overall: number;
  elements: { sun: ElementRelation; moon: ElementRelation; venusMars: ElementRelation };
  lifePath: LifePathRelation;
  overlays: { aInB: Partial<Record<SynPoint, number>>; bInA: Partial<Record<SynPoint, number>> } | null;
}

export function synastry(A: Chart, B: Chart, lifePathA: number, lifePathB: number): Synastry {
  const aspects = interAspects(A, B);
  const raw: Record<SynCategory, number> = { emotional: 0, romance: 0, communication: 0, commitment: 0, growth: 0 };
  for (const x of aspects) {
    const strength = 1 - x.orb / (ORB[x.type] + 1);
    for (const [cat, w] of Object.entries(PAIR_WEIGHTS[x.pair]) as [SynCategory, number][]) {
      let v: number;
      if (x.flow) v = x.type === "sextile" ? 0.8 : 1;
      else if (x.type === "conjunction") v = cat === "commitment" ? 0.7 : 0.2; // heavy conjunctions bind more than they soothe
      else if (x.type === "opposition") v = ATTRACTION.has(x.pair) && cat === "romance" ? 0.6 : -0.3;
      else v = ATTRACTION.has(x.pair) && cat === "romance" ? 0.2 : -0.6;
      if (x.pair.includes("Saturn") && !x.flow && cat === "commitment") v = 0.4; // Saturn ties, even when it tests
      raw[cat] += v * w * strength;
    }
  }
  const el = (c: Chart, k: PlanetKey) => SIGN_ELEMENT[c.pos[k].sign];
  const sun = elementRelation(el(A, "Sun"), el(B, "Sun"));
  const moon = elementRelation(el(A, "Moon"), el(B, "Moon"));
  const vm = elementRelation(el(A, "Venus"), el(B, "Mars"));
  const vm2 = elementRelation(el(B, "Venus"), el(A, "Mars"));
  const ev = (r: ElementRelation) => (r === "same" ? 1 : r === "compatible" ? 0.7 : -0.3);
  raw.emotional += 1.5 * ev(moon);
  raw.growth += 1.2 * ev(sun);
  raw.romance += 0.8 * (ev(vm) + ev(vm2));
  const scores = {} as Record<SynCategory, number>;
  for (const k of SYN_CATEGORIES) scores[k] = Math.round(Math.max(22, Math.min(96, 58 + 7 * raw[k])));
  const overall = Math.round((scores.emotional * 1.3 + scores.romance * 1.1 + scores.communication + scores.commitment * 1.2 + scores.growth * 0.8) / 5.4);

  let overlays: Synastry["overlays"] = null;
  if (A.angles && B.angles) {
    const house = (lon: number, asc: number) => ((signOf(lon) - signOf(asc) + 12) % 12) + 1;
    const pts: SynPoint[] = ["Sun", "Moon", "Venus", "Mars"];
    overlays = { aInB: {}, bInA: {} };
    for (const p of pts) {
      overlays.aInB[p] = house(lonOf(A, p)!, B.angles.asc);
      overlays.bInA[p] = house(lonOf(B, p)!, A.angles.asc);
    }
  }
  return { aspects, scores, overall, elements: { sun, moon, venusMars: vm }, lifePath: lifePathRelation(lifePathA, lifePathB), overlays };
}
