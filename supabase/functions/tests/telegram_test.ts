import { strict as A } from "node:assert";
import { computeChart } from "../_shared/astro.ts";
import { chartSummary, fold, parseDate, parseName, parseTime, searchCities, type City } from "../_shared/telegram.ts";

Deno.test("telegram: dates in the formats people type", () => {
  A.equal(parseDate("15.06.1995"), "1995-06-15");
  A.equal(parseDate("5/6/1995"), "1995-06-05");
  A.equal(parseDate("15-06-1995"), "1995-06-15");
  A.equal(parseDate("1995-06-15"), "1995-06-15");
  A.equal(parseDate("31.02.1995"), null);
  A.equal(parseDate("15.06.95"), null);
  A.equal(parseDate("01.01.2999"), null);
});

Deno.test("telegram: times", () => {
  A.equal(parseTime("8:30"), "08:30");
  A.equal(parseTime("08.30"), "08:30");
  A.equal(parseTime("0830"), "08:30");
  A.equal(parseTime("24:00"), null);
  A.equal(parseTime("не знаю"), null);
});

Deno.test("telegram: names", () => {
  A.equal(parseName("  Aysel   Həsənova "), "Aysel Həsənova");
  A.equal(parseName("/start"), null);
  A.equal(parseName("12345"), null);
  A.equal(parseName("A"), null);
});

Deno.test("telegram: city search matches Azerbaijani, Latin and Cyrillic spellings", () => {
  const all: City[] = [["Bakı", "AZ", 40.41, 49.87, "Asia/Baku", ["Baku", "Баку"]], ["Gəncə", "AZ", 40.68, 46.36, "Asia/Baku", ["Ganja", "Гянджа"]]];
  A.equal(searchCities(all, "baki")[0][0], "Bakı");
  A.equal(searchCities(all, "Баку")[0][0], "Bakı");
  A.equal(searchCities(all, "gence")[0][0], "Gəncə");
  A.equal(searchCities(all, "x").length, 0);
  A.equal(fold("Şəki"), "seki");
});

Deno.test("telegram: chart summary in Russian and without birth time", () => {
  const known = computeChart({ fullName: "A", date: "1995-06-15", time: "08:30", lat: 40.41, lon: 49.87, tz: "Asia/Baku" });
  const s = chartSummary("ru", "Айсель", known, 9);
  A.ok(s.includes("Близнецы"), s);
  A.ok(s.includes("Асцендент"));
  A.ok(s.includes("Число жизненного пути: 9"));
  const unknown = computeChart({ fullName: "A", date: "1995-06-15", time: null, lat: null, lon: null, tz: "Asia/Baku" });
  const u = chartSummary("az", "Aysel <b>", unknown, 9);
  A.ok(!u.includes("Asendent:"));
  A.ok(u.includes("&lt;b&gt;"));
});
