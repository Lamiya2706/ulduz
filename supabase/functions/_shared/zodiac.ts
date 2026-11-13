// Zodiac constants without the astronomy dependency (safe for the landing page bundle).
import type { Element, Modality, PlanetKey } from "./astro.ts";

export const SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"] as const;
export const SIGN_GLYPHS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"].map((g) => g + "︎");
export const SIGN_ELEMENT: Element[] = ["Fire","Earth","Air","Water","Fire","Earth","Air","Water","Fire","Earth","Air","Water"];
export const SIGN_MODALITY: Modality[] = ["Cardinal","Fixed","Mutable","Cardinal","Fixed","Mutable","Cardinal","Fixed","Mutable","Cardinal","Fixed","Mutable"];
export const PLANETS: { key: PlanetKey; glyph: string }[] = [
  { key: "Sun", glyph: "☉" }, { key: "Moon", glyph: "☽" }, { key: "Mercury", glyph: "☿" }, { key: "Venus", glyph: "♀" },
  { key: "Mars", glyph: "♂" }, { key: "Jupiter", glyph: "♃" }, { key: "Saturn", glyph: "♄" }, { key: "Uranus", glyph: "♅" },
  { key: "Neptune", glyph: "♆" }, { key: "Pluto", glyph: "♇" }, { key: "Node", glyph: "☊" },
].map((p) => ({ key: p.key as PlanetKey, glyph: p.glyph + "︎" }));
