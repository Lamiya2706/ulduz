import { describe, expect, it } from "vitest";
import { computeChart } from "@shared/astro";
import { personalDay } from "@shared/daily";
import { SPHERES } from "@shared/sky";
import { DAILY_CONTENT } from "@/content/daily";

const withTime = computeChart({ fullName: "A", date: "1990-07-15", time: "08:30", lat: 40.41, lon: 49.87, tz: "Asia/Baku" });
const noTime = computeChart({ fullName: "B", date: "1995-03-02", time: null, lat: null, lon: null, tz: "UTC" });

describe("personal daily horoscope", () => {
  it("counts houses from the Ascendant when the birth time is known", () => {
    const d = personalDay(withTime, 2026, 11, 25);
    expect(d.houseFrom).toBe("asc");
    const ascSign = Math.floor(withTime.angles!.asc / 30);
    expect(d.moonHouse).toBe(((d.moonSign - ascSign + 12) % 12) + 1);
  });
  it("falls back to solar houses and skips the uncertain natal Moon without a time", () => {
    for (let day = 1; day <= 28; day++) {
      const d = personalDay(noTime, 2026, 2, day);
      expect(d.houseFrom).toBe("sun");
      expect(d.transits.every((t) => t.point !== "Moon" && t.point !== "Asc")).toBe(true);
    }
  });
  it("keeps scores in range and the list short across a month", () => {
    for (let day = 1; day <= 30; day++) {
      const d = personalDay(withTime, 2026, 11, day);
      expect(d.moonHouse).toBeGreaterThanOrEqual(1); expect(d.moonHouse).toBeLessThanOrEqual(12);
      expect(d.transits.length).toBeLessThanOrEqual(4);
      expect(new Set(d.transits.map((t) => t.body)).size).toBe(d.transits.length);
      for (const k of SPHERES) { expect(d.spheres[k]).toBeGreaterThanOrEqual(1); expect(d.spheres[k]).toBeLessThanOrEqual(5); }
      expect(d.overall).toBeGreaterThanOrEqual(1); expect(d.overall).toBeLessThanOrEqual(5);
    }
  });
  it("has complete texts in every language", () => {
    for (const c of Object.values(DAILY_CONTENT)) {
      expect(c.houses).toHaveLength(12);
      expect(c.ui.overall).toHaveLength(5);
      for (const b of Object.values(c.bodies)) for (const s of Object.values(b)) expect(s.length).toBeGreaterThan(10);
    }
  });
});
