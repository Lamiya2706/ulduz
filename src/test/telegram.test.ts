import { describe, expect, it } from "vitest";
import { computeChart } from "@shared/astro";
import type { TransitAlert } from "@shared/transits";
import {
  alertsForDay, chartSummary, dailyMessage, localDayBounds, localNow, matchMessage, moonEvents, shareDay, weeklyMessage, parseDate, parseName, parseTime, profileBirth, searchCities, startCode, transitsMessage,
  type City,
} from "@shared/tg-core";

const birth = { fullName: "aysel Həsənova", date: "1995-06-15", time: "08:30", lat: 40.41, lon: 49.87, tz: "Asia/Baku", place: "Bakı, Azərbaycan" };
const chart = computeChart(birth);

describe("telegram bot input", () => {
  it("parses dates, times and names", () => {
    expect(parseDate("15.06.1995")).toBe("1995-06-15");
    expect(parseDate("1995-6-5")).toBe("1995-06-05");
    expect(parseDate("31.02.1995")).toBeNull();
    expect(parseDate("01.01.2099")).toBeNull();
    expect(parseTime("8:30")).toBe("08:30");
    expect(parseTime("0830")).toBe("08:30");
    expect(parseTime("25:00")).toBeNull();
    expect(parseName("  Aysel   Həsənova ")).toBe("Aysel Həsənova");
    expect(parseName("/start")).toBeNull();
  });
  it("reads the account-link code from /start", () => {
    expect(startCode("/start 0123456789abcdef0123456789abcdef0123")).toBe("0123456789abcdef0123456789abcdef0123");
    expect(startCode("/start")).toBeNull();
    expect(startCode("/start short")).toBeNull();
  });
  it("finds cities ignoring Azerbaijani letters", () => {
    const all: City[] = [["Baku", "AZ", 40.4, 49.9, "Asia/Baku", ["Bakı", "Баку"]], ["Gəncə", "AZ", 40.7, 46.4, "Asia/Baku"]];
    expect(searchCities(all, "baki")[0][0]).toBe("Baku");
    expect(searchCities(all, "gence")[0][0]).toBe("Gəncə");
  });
  it("uses the profile time only with a place, like the website", () => {
    expect(profileBirth({ full_name: "A B", birth_date: "1990-01-01", birth_time: "10:00", birth_place: null, lat: null, lon: null, tz: null })?.time).toBeNull();
    expect(profileBirth({ full_name: null, birth_date: "1990-01-01", birth_time: null, birth_place: null, lat: null, lon: null, tz: null })).toBeNull();
  });
  it("gives the local date and hour in a time zone", () => {
    const t = new Date("2026-11-25T21:30:00Z");
    expect(localNow("Asia/Baku", t)).toMatchObject({ date: "2026-11-26", hour: 1 });
    expect(localNow("Europe/Moscow", t)).toMatchObject({ date: "2026-11-26", hour: 0 });
    expect(localNow("Not/AZone", t).date).toBe("2026-11-26"); // falls back to Baku
  });
});

describe("telegram bot messages", () => {
  it("builds the morning message in every language, short enough for Telegram", () => {
    for (const lang of ["az", "en", "ru"] as const) {
      const m = dailyMessage(lang, birth, chart, { y: 2026, m: 11, d: 25 });
      expect(m.length).toBeLessThan(4096);
      expect(m).toContain("Aysel");
      expect(m).toContain("🌙");
      expect(m).not.toContain("undefined");
    }
  });
  it("summarises the natal chart", () => {
    const m = chartSummary("en", birth, chart);
    expect(m).toContain("Sun: ♊ Gemini");
    expect(m).toContain("Ascendant");
    expect(m).toContain("Life Path number");
    const noTime = computeChart({ ...birth, time: null });
    expect(chartSummary("en", { ...birth, time: null }, noTime)).toContain("Without a birth time");
  });
  it("lists transits and picks the ones that start or are exact on a day", () => {
    expect(transitsMessage("ru", chart, new Date("2026-11-25T12:00:00Z"))).toContain("🪐");
    const a: TransitAlert = { planet: "Saturn", point: "Sun", type: "square", kind: "hard", start: "2026-11-25", end: "2027-01-01", exact: ["2026-12-10"], active: true };
    expect(alertsForDay([a], "2026-11-25")).toEqual([{ a, note: "begins" }]);
    expect(alertsForDay([a], "2026-12-10")).toEqual([{ a, note: "exact" }]);
    expect(alertsForDay([a], "2026-12-11")).toEqual([]);
  });
});

describe("telegram bot extras", () => {
  it("finds the local day and the New and Full Moons in it", () => {
    const [from, to] = localDayBounds("2026-11-24", "Asia/Baku");
    expect(from.toISOString()).toBe("2026-11-23T20:00:00.000Z");
    const ev = moonEvents(from, to);
    expect(ev).toHaveLength(1);
    expect(ev[0].phase).toBe("full");
    expect(ev[0].sign).toBe(2); // Gemini
  });
  it("adds the Full Moon section on its day only", () => {
    expect(dailyMessage("en", birth, chart, { y: 2026, m: 11, d: 24 }, "Asia/Baku")).toContain("Full Moon in Gemini");
    expect(dailyMessage("en", birth, chart, { y: 2026, m: 11, d: 26 }, "Asia/Baku")).not.toContain("Full Moon in");
  });
  it("compares two charts", () => {
    const other = { fullName: "Elvin", date: "1993-02-03", time: null, lat: null, lon: null, tz: "UTC", place: null };
    for (const lang of ["az", "en", "ru"] as const) {
      const m = matchMessage(lang, birth, other);
      expect(m).toMatch(/\d+%/);
      expect(m).not.toContain("undefined");
      expect(m.length).toBeLessThan(4096);
    }
  });
  it("builds the week ahead and the shareable day", () => {
    for (const lang of ["az", "en", "ru"] as const) {
      const w = weeklyMessage(lang, birth, chart, { y: 2026, m: 11, d: 30 }, "Asia/Baku");
      expect(w.split("\n").filter((l) => l.includes("●")).length).toBe(7);
      expect(w).not.toContain("undefined");
      expect(w.length).toBeLessThan(4096);
      expect(shareDay(lang, birth, chart, { y: 2026, m: 11, d: 25 })).toContain("Aysel");
    }
    // the week of 7 December has a New Moon (9 Dec)
    expect(weeklyMessage("en", birth, chart, { y: 2026, m: 12, d: 7 }, "Asia/Baku")).toContain("🌑");
  });
});
