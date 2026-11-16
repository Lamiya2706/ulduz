import type { ElementRelation, LifePathRelation, SynCategory } from "@shared/synastry";

export interface CompatContent {
  /** [flow, tension] text per contact pair (keys from SYN_PAIRS). Neutral wording: "one of you … the other …". */
  pairs: Record<string, [string, string]>;
  categories: Record<SynCategory, { name: string; high: string; mid: string; low: string }>;
  overall: { high: string; mid: string; low: string };
  elements: { sun: Record<ElementRelation, string>; moon: Record<ElementRelation, string>; venusMars: Record<ElementRelation, string> };
  lifePath: Record<LifePathRelation, string>;
  ascendant: string; // label for the Ascendant point
}
