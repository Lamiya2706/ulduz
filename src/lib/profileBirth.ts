// Conversions between the profile row, the birth params used by chart links, and sign-up metadata.
import type { BirthParams } from "@shared/birthcode";
import type { Profile, ProfilePatch } from "./supabase";

/** Birth params → profile columns. A place is kept only with real coordinates. */
export function birthToProfile(r: BirthParams): ProfilePatch {
  const hasPlace = r.lat != null && r.lon != null;
  return {
    full_name: r.fullName, birth_date: r.date, birth_time: r.time,
    birth_place: hasPlace ? r.place : null, lat: hasPlace ? r.lat : null, lon: hasPlace ? r.lon : null, tz: hasPlace ? r.tz : null,
  };
}

/** Profile → birth params for a chart link, or null when the name or date is missing. */
export function profileBirth(p: Profile | null | undefined): BirthParams | null {
  if (!p?.full_name || !p.birth_date) return null;
  const hasPlace = p.lat != null && p.lon != null;
  return {
    fullName: p.full_name, date: p.birth_date, time: hasPlace ? p.birth_time : null,
    lat: hasPlace ? p.lat : null, lon: hasPlace ? p.lon : null, tz: hasPlace ? p.tz ?? "UTC" : "UTC", place: hasPlace ? p.birth_place : null,
  };
}

const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
const num = (v: unknown, lim: number) => (typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= lim ? v : null);

/**
 * Birth data saved in the auth user's metadata at sign-up (`birth`), as profile columns.
 * Sign-up can't write the profile directly (the person isn't signed in until they confirm the email),
 * so the first signed-in visit copies it over. Returns null when there's no usable birth date.
 */
export function metadataBirth(meta: unknown): ProfilePatch | null {
  const b = (meta as { birth?: Record<string, unknown> } | null)?.birth;
  if (!b || typeof b !== "object") return null;
  const date = typeof b.birth_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.birth_date) ? b.birth_date : null;
  if (!date) return null;
  const time = typeof b.birth_time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(b.birth_time) ? b.birth_time : null;
  const lat = num(b.lat, 90), lon = num(b.lon, 180);
  const hasPlace = lat != null && lon != null;
  return {
    birth_date: date, birth_time: time,
    birth_place: hasPlace ? str(b.birth_place, 200) : null, lat: hasPlace ? lat : null, lon: hasPlace ? lon : null, tz: hasPlace ? str(b.tz, 64) : null,
  };
}
