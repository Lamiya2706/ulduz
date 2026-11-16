import { describe, expect, it } from "vitest";
import { skyYear, yearForecast } from "@shared/year";

describe("year forecast", () => {
  it("finds the sky events of 2026", () => {
    const s = skyYear(2026);
    const merc = s.retro.filter((r) => r.planet === "Mercury");
    expect(merc).toHaveLength(3); // Feb–Mar, Jun–Jul, Oct–Nov 2026
    expect(merc[0].from.getUTCMonth()).toBe(1);
    expect(s.eclipses.filter((e) => e.solar).map((e) => e.date.toISOString().slice(0, 10))).toEqual(["2026-02-17", "2026-08-12"]);
    expect(s.eclipses.filter((e) => !e.solar).map((e) => e.date.toISOString().slice(0, 10))).toEqual(["2026-03-03", "2026-08-28"]);
    expect(s.ingresses.some((i) => i.planet === "Jupiter" && i.sign === 4)).toBe(true); // Jupiter enters Leo mid-2026
  });
  it("computes the personal year and months", () => {
    const f = yearForecast("1985-06-21", 2027);
    expect(f.personalYear).toBe(2);
    expect(f.months).toEqual([3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5]);
    expect(f.sunSign).toBe(3); // solstice was at 10:44 UTC that day
    for (const t of f.transits) { expect(t.from).toBeLessThanOrEqual(t.to); }
  });
});
