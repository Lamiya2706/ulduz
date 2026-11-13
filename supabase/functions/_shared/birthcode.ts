// Encodes birth input into the URL code used by the free chart page (/:lang/chart/:code). Shared by web and server.
export interface BirthParams {
  fullName: string; date: string; time: string | null; lat: number | null; lon: number | null; tz: string; place: string | null;
}
const toB64Url = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64Url = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));

export function encodeBirth(p: BirthParams): string {
  return toB64Url(JSON.stringify([p.fullName, p.date, p.time, p.lat, p.lon, p.tz, p.place]));
}
export function decodeBirth(code: string): BirthParams | null {
  try {
    const [fullName, date, time, lat, lon, tz, place] = JSON.parse(fromB64Url(code));
    return validateBirth({ fullName, date, time, lat, lon, tz, place });
  } catch {
    return null;
  }
}

/** Strict validation — used on the server for every incoming birth input. */
export function validateBirth(x: unknown): BirthParams | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const fullName = typeof o.fullName === "string" ? o.fullName.trim().slice(0, 120) : "";
  if (!fullName) return null;
  if (typeof o.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(o.date)) return null;
  const [y, m, d] = o.date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (y < 1900 || y > 2100 || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  const time = o.time === null || o.time === undefined ? null : typeof o.time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(o.time) ? o.time : undefined;
  if (time === undefined) return null;
  const num = (v: unknown, max: number) => (v === null || v === undefined ? null : typeof v === "number" && isFinite(v) && Math.abs(v) <= max ? v : NaN);
  const lat = num(o.lat, 66), lon = num(o.lon, 180);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
  if (time && (lat === null || lon === null)) return null;
  if (typeof o.tz !== "string") return null;
  try { new Intl.DateTimeFormat("en", { timeZone: o.tz }); } catch { return null; }
  const place = typeof o.place === "string" ? o.place.slice(0, 160) : null;
  return { fullName, date: o.date, time, lat, lon, tz: o.tz, place };
}
