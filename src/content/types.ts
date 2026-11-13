import type { AspectType, Element, Modality, PlanetKey } from "@shared/astro";
import type { AttachmentKey } from "@shared/astro";

/** Per-sign interpretation fragments. Sentences are complete; "phrase" fields slot into the locale's own templates. */
export interface SignText {
  core: string;    // sentence: who you are at core
  shine: string;   // sentence: when you shine
  need: string;    // sentence: emotional needs
  stress: string;  // sentence: how you react when hurt
  first: string;   // sentence: first impression (rising)
  mind: string;    // sentence: how you think
  love: string;    // sentences: how you love
  drive: string;   // sentence: how you pursue
  grow: string;    // phrase: areas of growth/luck (nominative noun list)
  lesson: string;  // phrase: life lesson (used after a colon)
  shadow: string;  // phrase: shadow traits (used after a colon)
  partner: string; // phrase: kind of people you are drawn to (nominative plural)
}

export interface Content {
  signNames: string[];
  signIn: string[];                 // "in Aries" / "Qoçda" / "в Овне"
  planetNames: Record<PlanetKey, string>;
  elementNames: Record<Element, string>;
  modalityNames: Record<Modality, string>;
  aspectNames: Record<AspectType, string>;
  dignityNames: Record<"domicile" | "exaltation" | "detriment" | "fall", string>;
  signs: SignText[];
  houses: string[];                 // index 1..12: life areas
  ordinal: (n: number) => string;   // "8th" / "8-ci" / "8-м"
  planetDomain: Record<PlanetKey, string>; // "your emotional needs"
  aspectText: Record<AspectType, string>;   // predicate for "{A} and {B} ..."
  special: Record<string, string>;
  specialSoft: Record<string, string>;
  retro: Partial<Record<PlanetKey, string>>;
  outer: Record<"Uranus" | "Neptune" | "Pluto", string>;
  elementText: Record<Element, { dom: string; low: string; gift: string }>;
  modalityText: Record<Modality, string>;
  archetypes: Record<string, [string, string]>;
  attachment: Record<AttachmentKey, { name: string; sum: string; need: string; trig: string; grow: string }>;
  numbers: Record<number, [string, string, string]>; // title, themes, shadow
  personalYear: Record<number, string>;
  tpl: {
    houseLine: (ord: string, area: string) => string;
    aspectLine: (domA: string, domB: string, text: string) => string;
    jupiter: (grow: string) => string;
    saturn: (lesson: string) => string;
    node: (toward: string, away: string) => string;
    outerLine: (outerText: string, grow: string, hasHouse: boolean) => string;
    risingSame: string;
    risingDiff: (asc: string, sun: string) => string;
    elementsShared: string;
    elementsDiffer: string;
    descendant: (sign: string, partner: string) => string;
    drawnTo: (partner: string) => string;
    mc: (sign: string, shine: string) => string;
    noMc: (shine: string, grow: string) => string;
    careerGrow: (jupGrow: string, nodeSign: string, nodeGrow: string) => string;
    lifePathEcho: (n: number, themes: string) => string;
    giftsJupiter: (grow: string) => string;
    giftElement: (gift: string) => string;
    giftSoft: (a: string, b: string) => string;
    giftLifePath: (n: number, themes: string) => string;
    shadowSun: (shadow: string) => string;
    shadowSaturn: (lesson: string) => string;
    shadowHard: (a: string, b: string) => string;
    shadowLifePath: (title: string, shadow: string) => string;
    moonAlt: (a: string, b: string) => string;
    numberCard: (why: string, themes: string) => string;
  };
}
