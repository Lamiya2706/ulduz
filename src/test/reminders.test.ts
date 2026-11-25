import { describe, expect, it } from "vitest";
import { computeChart } from "@shared/astro";
import { nearestFullMoon } from "@shared/sky";
import { transitAlerts } from "@shared/transits";
import { dueReminders, localDate, reminderKey, renderEmail, type Lang } from "@shared/reminders";

const chart = computeChart({ fullName: "Aysel Mammadova", date: "1990-07-15", time: "08:30", lat: 40.41, lon: 49.87, tz: "Asia/Baku" });
const H = 3600000;

describe("due reminders", () => {
  it("announces a Full Moon that peaks within the next day, with its house", () => {
    const fm = nearestFullMoon(new Date(Date.UTC(2026, 11, 1)));
    const due = dueReminders(chart, "1990-07-15", new Date(fm.date.getTime() - 6 * H));
    const moon = due.find((r) => r.kind === "moon");
    expect(moon).toMatchObject({ kind: "moon", phase: "full", sign: fm.sign });
    if (moon?.kind === "moon") expect(moon.house).toBeGreaterThanOrEqual(1);
    // Two days before, nothing about the Moon yet.
    expect(dueReminders(chart, "1990-07-15", new Date(fm.date.getTime() - 48 * H)).some((r) => r.kind === "moon")).toBe(false);
  });

  it("sends a birthday note on the local birthday only", () => {
    const morning = new Date(Date.UTC(2026, 6, 15, 5));
    expect(dueReminders(chart, "1990-07-15", morning).find((r) => r.kind === "birthday")).toEqual({ kind: "birthday", year: 2026 });
    expect(dueReminders(chart, "1990-07-15", new Date(Date.UTC(2026, 6, 16, 5))).some((r) => r.kind === "birthday")).toBe(false);
    // 22:00 UTC on the 14th is already the 15th in Baku.
    expect(localDate(new Date(Date.UTC(2026, 6, 14, 22)), "Asia/Baku")).toBe("2026-07-15");
  });

  it("gives a week's notice before a slow-planet transit starts, once", () => {
    const upcoming = transitAlerts(chart, new Date(Date.UTC(2026, 10, 25)), 365).find((a) => !a.active && a.start > "2026-12-10");
    expect(upcoming).toBeTruthy();
    const start = Date.parse(`${upcoming!.start}T12:00:00Z`);
    const due = dueReminders(chart, "1990-07-15", new Date(start - 3 * 24 * H - 7 * H));
    const tr = due.find((r) => r.kind === "transit" && r.planet === upcoming!.planet && r.point === upcoming!.point && r.type === upcoming!.type);
    expect(tr).toBeTruthy();
    expect(reminderKey(tr!)).toBe(`transit:${upcoming!.planet}:${upcoming!.type}:${upcoming!.point}:${upcoming!.start}`);
    // A month before, it isn't announced yet.
    const early = dueReminders(chart, "1990-07-15", new Date(start - 30 * 24 * H));
    expect(early.some((r) => r.kind === "transit" && reminderKey(r) === reminderKey(tr!))).toBe(false);
  });
});

describe("reminder email", () => {
  const reminders = [
    { kind: "moon", phase: "new", at: "2026-12-09T03:52:00Z", sign: 8, house: 4 },
    { kind: "transit", planet: "Saturn", point: "Sun", type: "conjunction", start: "2026-12-12", exact: "2026-12-30" },
  ] as const;
  for (const lang of ["az", "en", "ru"] as Lang[]) {
    it(`renders in ${lang}`, () => {
      const m = renderEmail({ lang, name: "Aysel <b>", reminders: [...reminders], site: "https://ulduz.space", unsubscribeUrl: "https://ulduz.space/x/unsubscribe?t=abc", birthDate: "1990-07-15" });
      expect(m.subject.length).toBeGreaterThan(3);
      expect(m.html).toContain("Aysel &lt;b&gt;");
      expect(m.html).toContain("https://ulduz.space/x/unsubscribe?t=abc");
      expect(m.html).toContain(`https://ulduz.space/${lang}/today#transits`);
      expect(m.text).toContain("07:52"); // the New Moon time in Baku
    });
  }
  it("leads with the birthday when there is one", () => {
    const m = renderEmail({ lang: "en", name: "Aysel", reminders: [{ kind: "birthday", year: 2026 }], site: "https://ulduz.space", unsubscribeUrl: "u", birthDate: "1990-07-15" });
    expect(m.subject).toBe("Happy birthday from Ulduz");
    expect(m.html).toContain("https://ulduz.space/en/year/1990-07-15");
  });
});
