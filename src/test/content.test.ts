import { describe, expect, it } from "vitest";
import { SYN_PAIRS, SYN_CATEGORIES } from "@shared/synastry";
import { getCompat, getContent } from "@/content";
import { COUPLE_UI } from "@/i18n/couple";
import en from "@/i18n/en";
import az from "@/i18n/az";
import ru from "@/i18n/ru";

const LANGS = ["az", "en", "ru"] as const;
const keys = (o: unknown, p = ""): string[] =>
  o && typeof o === "object" && !Array.isArray(o) ? Object.entries(o).flatMap(([k, v]) => keys(v, p ? `${p}.${k}` : k)) : [p];

describe("content completeness", () => {
  it("has a compatibility text for every synastry contact in every language", () => {
    for (const l of LANGS) {
      const cc = getCompat(l);
      for (const pair of SYN_PAIRS) { expect(cc.pairs[pair], `${l} ${pair}`).toHaveLength(2); }
      for (const cat of SYN_CATEGORIES) expect(cc.categories[cat].name).toBeTruthy();
    }
  });
  it("has the same UI keys in every language", () => {
    expect(keys(az)).toEqual(keys(en));
    expect(keys(ru)).toEqual(keys(en));
    expect(keys(COUPLE_UI.az)).toEqual(keys(COUPLE_UI.en));
    expect(keys(COUPLE_UI.ru)).toEqual(keys(COUPLE_UI.en));
  });
  it("has 12 signs and 16 archetypes per language", () => {
    for (const l of LANGS) { const c = getContent(l); expect(c.signs).toHaveLength(12); expect(Object.keys(c.archetypes)).toHaveLength(16); }
  });
});

import { NUM_CONTENT } from "@/content/numerology";
import { NUM_UI } from "@/i18n/numerology";
describe("numerology content", () => {
  const keys = (o: object): string[] => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? keys(v).map((x) => `${k}.${x}`) : [k])).sort();
  it("has the same structure in every language", () => {
    for (const l of ["az", "ru"] as const) {
      expect(keys(NUM_CONTENT[l])).toEqual(keys(NUM_CONTENT.en));
      expect(keys(NUM_UI[l])).toEqual(keys(NUM_UI.en));
    }
  });
  it("covers every number", () => {
    for (const c of Object.values(NUM_CONTENT)) {
      expect(Object.keys(c.numbers).map(Number).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]);
      for (const s of Object.values(c.square)) expect(s.levels).toHaveLength(4);
    }
  });
});

import { SKY_CONTENT, SKY_MORE } from "@/content/sky";
import { SKY_UI } from "@/i18n/sky";
describe("sky content", () => {
  const keys = (o: object): string[] => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? keys(v).map((x) => `${k}.${x}`) : [k])).sort();
  it("has the same structure in every language", () => {
    for (const l of ["az", "ru"] as const) {
      expect(keys(SKY_CONTENT[l])).toEqual(keys(SKY_CONTENT.en));
      expect(keys(SKY_UI[l])).toEqual(keys(SKY_UI.en));
      expect(SKY_CONTENT[l].moonSigns).toHaveLength(12);
      expect(SKY_CONTENT[l].ui.weekdays).toHaveLength(7);
      expect(keys(SKY_MORE[l])).toEqual(keys(SKY_MORE.en));
      expect(SKY_MORE[l].lunarDays).toHaveLength(30);
      expect(SKY_MORE[l].sunSeason).toHaveLength(12);
    }
  });
});

import { YEAR_CONTENT } from "@/content/year";
import { YEAR_UI } from "@/i18n/year";
describe("year content", () => {
  const keys = (o: object): string[] => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? keys(v).map((x) => `${k}.${x}`) : [k])).sort();
  it("has the same structure in every language", () => {
    for (const l of ["az", "ru"] as const) {
      expect(keys(YEAR_CONTENT[l])).toEqual(keys(YEAR_CONTENT.en));
      expect(keys(YEAR_UI[l])).toEqual(keys(YEAR_UI.en));
      expect(Object.keys(YEAR_CONTENT[l].years)).toHaveLength(9);
    }
  });
});

import { FULLMOON_CONTENT } from "@/content/fullmoon";
import { FULLMOON_UI } from "@/i18n/fullmoon";
import { nearestFullMoon } from "@shared/sky";
describe("full moon content", () => {
  const keys = (o: object): string[] => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? keys(v).map((x) => `${k}.${x}`) : [k])).sort();
  it("has the same structure in every language", () => {
    for (const l of ["az", "ru"] as const) {
      expect(keys(FULLMOON_CONTENT[l])).toEqual(keys(FULLMOON_CONTENT.en));
      expect(keys(FULLMOON_UI[l])).toEqual(keys(FULLMOON_UI.en));
    }
    for (const c of Object.values(FULLMOON_CONTENT)) {
      expect(c.signs).toHaveLength(12);
      expect(c.steps).toHaveLength(7);
      expect(c.methods).toHaveLength(8);
      for (const m of c.methods) expect(m.steps.length).toBeGreaterThanOrEqual(3);
    }
  });
  it("finds the Full Moon of 24 Nov 2026 in Gemini", () => {
    const f = nearestFullMoon(new Date("2026-11-24T10:00:00Z"));
    expect(f.date.toISOString().slice(0, 13)).toBe("2026-11-24T14");
    expect(f.sign).toBe(2);
    expect(nearestFullMoon(new Date("2026-11-27T10:00:00Z")).date.toISOString().slice(0, 10)).toBe("2026-12-24");
  });
});

import { AUTH_UI } from "@/i18n/auth";
import { authErrorKey, urlAuthError } from "@/lib/authErrors";
import { isPrivatePath } from "@/lib/seo";
describe("auth", () => {
  const keys = (o: object): string[] => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? keys(v).map((x) => `${k}.${x}`) : [k])).sort();
  it("has the same strings in every language, with a message for every error", () => {
    for (const l of ["az", "ru"] as const) expect(keys(AUTH_UI[l])).toEqual(keys(AUTH_UI.en));
    for (const ui of Object.values(AUTH_UI)) {
      for (const k of ["invalid_credentials", "email_not_confirmed", "user_exists", "weak_password", "rate_limit", "email_invalid", "same_password", "link_expired", "network", "generic"] as const) expect(ui.err[k]).toBeTruthy();
    }
  });
  it("keeps Russian copy gender-neutral", () => {
    const text = JSON.stringify(AUTH_UI.ru);
    for (const w of ["рад", "готова", "забыл", "вошёл", "вошла", "благодарна", "родился", "родилась"]) expect(text).not.toMatch(new RegExp(`(?<!\\p{L})${w}(?!\\p{L})`, "iu"));
  });
  it("maps Supabase errors to messages", () => {
    expect(authErrorKey({ code: "invalid_credentials" })).toBe("invalid_credentials");
    expect(authErrorKey({ message: "Invalid login credentials" })).toBe("invalid_credentials");
    expect(authErrorKey({ code: "email_not_confirmed" })).toBe("email_not_confirmed");
    expect(authErrorKey({ code: "user_already_exists" })).toBe("user_exists");
    expect(authErrorKey({ code: "weak_password" })).toBe("weak_password");
    expect(authErrorKey({ code: "over_email_send_rate_limit" })).toBe("rate_limit");
    expect(authErrorKey({ status: 429 })).toBe("rate_limit");
    expect(authErrorKey({ name: "AuthRetryableFetchError", message: "Failed to fetch" })).toBe("network");
    expect(authErrorKey(new Error("boom"))).toBe("generic");
    expect(urlAuthError("?error=access_denied&error_code=otp_expired", "")).toBe("link_expired");
    expect(urlAuthError("", "#error_code=otp_expired")).toBe("link_expired");
    expect(urlAuthError("?mode=signup", "")).toBeNull();
  });
  it("keeps the account pages out of search indexes", () => {
    for (const p of ["/login", "/reset-password", "/account"]) expect(isPrivatePath(p)).toBe(true);
    expect(isPrivatePath("/moon")).toBe(false);
  });
});

import { birthToProfile, metadataBirth, profileBirth } from "@/lib/profileBirth";
describe("profile birth data", () => {
  const r = { fullName: "Aysel Hasanova", date: "1995-06-15", time: "14:30", lat: 40.41, lon: 49.87, tz: "Asia/Baku", place: "Bakı, Azerbaijan" };
  it("round-trips sign-up birth data through metadata into a chart link", () => {
    const patch = metadataBirth({ birth: birthToProfile(r) })!;
    expect(patch).toMatchObject({ birth_date: "1995-06-15", birth_time: "14:30", lat: 40.41, tz: "Asia/Baku" });
    const p = { id: "x", lang: "az", full_name: r.fullName, ...patch } as Parameters<typeof profileBirth>[0];
    expect(profileBirth(p)).toEqual(r);
  });
  it("drops a birth time without a place, and ignores bad metadata", () => {
    const noPlace = birthToProfile({ ...r, lat: null, lon: null, place: null, tz: "UTC" });
    expect(noPlace).toMatchObject({ birth_place: null, tz: null });
    expect(profileBirth({ id: "x", lang: null, full_name: "A", ...noPlace } as never)?.time).toBeNull();
    expect(metadataBirth(null)).toBeNull();
    expect(metadataBirth({ birth: { birth_date: "15/06/1995" } })).toBeNull();
    expect(metadataBirth({ birth: { birth_date: "1995-06-15", birth_time: "25:00", lat: 999, lon: 1 } })).toMatchObject({ birth_time: null, lat: null, tz: null });
  });
});
