import { describe, expect, it } from "vitest";
import { skyDay, skyMonth } from "@shared/sky";

describe("sky of the day", () => {
  it("finds full and new moons", () => {
    // Full moon 2026-11-24 14:53 UTC, new moon 2026-12-09 00:52 UTC (approx.)
    const full = skyDay(2026, 11, 24);
    expect(full.phase).toBe("full");
    expect(full.illumination).toBeGreaterThan(97);
    expect(full.haircut).toBe("bad");
    const nm = skyDay(2026, 12, 9);
    expect(nm.phase).toBe("new");
    expect(nm.lunarDay).toBeLessThanOrEqual(2);
  });
  it("builds a whole month", () => {
    const m = skyMonth(2026, 11);
    expect(m).toHaveLength(30);
    expect(new Set(m.map((d) => d.moonSign)).size).toBeGreaterThanOrEqual(12);
    for (const d of m) { expect(d.dayNumber).toBeGreaterThanOrEqual(1); expect(d.dayNumber).toBeLessThanOrEqual(9); }
  });
});
