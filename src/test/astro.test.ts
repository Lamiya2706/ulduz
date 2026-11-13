import { describe, expect, it } from "vitest";
import { computeChart, fmtPos, localToUtc, attachment, jungianType } from "@shared/astro";
import { numerology } from "@shared/numerology";

describe("chart engine", () => {
  it("matches the published chart of 1 July 1961, 19:45 BST, Sandringham", () => {
    const c = computeChart({ fullName: "Diana Frances Spencer", date: "1961-07-01", time: "19:45", lat: 52.83, lon: 0.5, tz: "Europe/London" });
    expect(c.utc).toBe("1961-07-01T18:45:00.000Z");
    expect(fmtPos(c.pos.Sun.lon)).toBe("9°39′ Cancer");
    expect(fmtPos(c.pos.Moon.lon)).toBe("25°02′ Aquarius");
    expect(fmtPos(c.angles!.asc)).toBe("18°24′ Sagittarius");
    expect(fmtPos(c.angles!.mc)).toBe("23°03′ Libra");
    expect(c.pos.Sun.house).toBe(8);
    expect(c.pos.Mercury.retro).toBe(true);
    expect(["secure", "anxious", "avoidant", "fearful"]).toContain(attachment(c));
    expect(jungianType(c)).toMatch(/^[EI][NS][TF][JP]$/);
  });

  it("respects historical DST in Baku", () => {
    expect(localToUtc(1990, 7, 15, 12, 0, "Asia/Baku").toISOString()).toBe("1990-07-15T07:00:00.000Z");
    expect(localToUtc(2020, 7, 15, 12, 0, "Asia/Baku").toISOString()).toBe("2020-07-15T08:00:00.000Z");
  });

  it("hides angles and flags an uncertain Moon when the time is unknown", () => {
    const c = computeChart({ fullName: "Test", date: "1988-11-03", time: null, lat: null, lon: null, tz: "UTC" });
    expect(c.angles).toBeNull();
    expect(c.pos.Sun.house).toBeNull();
    expect(c.moonAlt).not.toBeNull();
  });
});

describe("numerology", () => {
  it("computes core numbers and handles Azerbaijani letters", () => {
    const n = numerology("Ləmiyə Əsgərova", "1995-06-15", new Date("2026-11-13"));
    expect(n.lifePath).toBe(9);
    expect(n.birthday).toBe(6);
    expect(n.personalYear).toBe(4);
    expect(n.expression).not.toBeNull();
  });
});
