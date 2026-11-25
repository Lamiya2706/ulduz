import { describe, expect, it } from "vitest";
import { computeChart } from "@shared/astro";
import { transitAlerts } from "@shared/transits";

const chart = computeChart({ fullName: "A", date: "1990-07-15", time: "08:30", lat: 40.41, lon: 49.87, tz: "Asia/Baku" });

describe("transit alerts", () => {
  const from = new Date(Date.UTC(2026, 10, 25));
  const list = transitAlerts(chart, from, 365);
  it("finds the slow-planet contacts of the coming year", () => {
    console.log(list.map((a) => `${a.active ? "*" : " "} ${a.planet} ${a.type} ${a.point} ${a.start}..${a.end} exact ${a.exact.join(",")}`).join("\n"));
    expect(list.length).toBeGreaterThan(0);
    for (const a of list) {
      expect(a.start <= a.end).toBe(true);
      expect(a.end >= "2026-11-25").toBe(true);
      expect(a.start <= "2027-11-25").toBe(true);
      expect(a.exact.length).toBeGreaterThan(0);
    }
  });
  it("lists the active ones first", () => {
    const firstInactive = list.findIndex((a) => !a.active);
    if (firstInactive >= 0) expect(list.slice(firstInactive).every((a) => !a.active)).toBe(true);
  });
  it("leaves out the Moon and the angles without a birth time", () => {
    const noTime = computeChart({ fullName: "B", date: "1995-03-02", time: null, lat: null, lon: null, tz: "UTC" });
    expect(transitAlerts(noTime, from).every((a) => !["Moon", "Asc", "MC"].includes(a.point))).toBe(true);
  });
});
