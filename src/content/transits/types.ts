import type { AlertKind, AlertPoint, SlowPlanet } from "@shared/transits";

/** Texts for transit alerts (slow planets touching the birth chart). */
export interface TransitContent {
  ui: {
    title: string; intro: string; now: string; soon: string; none: string;
    period: (from: string, to: string) => string; exact: (dates: string) => string; touches: string;
    showAll: (n: number) => string; showLess: string; noTimeNote: string;
    accountTitle: string; accountActive: (n: number) => string; accountNone: string; accountOpen: string;
  };
  points: Record<AlertPoint, string>;
  planets: Record<SlowPlanet, Record<AlertKind, string>>;
}
