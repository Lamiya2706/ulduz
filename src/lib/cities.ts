export interface City { name: string; country: string; lat: number; lon: number; tz: string; aliases: string[] }
type Raw = [string, string, number, number, string, string[]?];

let cache: Promise<City[]> | null = null;
export function loadCities(): Promise<City[]> {
  cache ??= fetch("/cities.json").then((r) => r.json()).then((rows: Raw[]) =>
    rows.map(([name, country, lat, lon, tz, aliases]) => ({ name, country, lat, lon, tz, aliases: aliases ?? [] })));
  return cache;
}

const AZ_MAP: Record<string, string> = { "ə": "e", "ı": "i", "ş": "s", "ç": "c", "ğ": "g", "ö": "o", "ü": "u", "i̇": "i" };
export const fold = (s: string) =>
  [...s.toLocaleLowerCase()].map((c) => AZ_MAP[c] ?? c).join("").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ё/g, "е");

export function searchCities(all: City[], q: string, limit = 8): City[] {
  const f = fold(q.trim());
  if (f.length < 2) return [];
  const starts: City[] = [], contains: City[] = [];
  for (const c of all) {
    const names = [c.name, ...c.aliases].map(fold);
    if (names.some((n) => n.startsWith(f))) starts.push(c);
    else if (names.some((n) => n.includes(f))) contains.push(c);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

const regionNames: Record<string, Intl.DisplayNames | null> = {};
export function countryName(code: string, lang: string): string {
  if (!(lang in regionNames)) {
    try { regionNames[lang] = new Intl.DisplayNames([lang], { type: "region" }); } catch { regionNames[lang] = null; }
  }
  return regionNames[lang]?.of(code) ?? code;
}
