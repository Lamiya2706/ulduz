import { strict as A } from "node:assert";
const assert = (v: unknown) => A.ok(v);
const assertEquals = (a: unknown, b: unknown) => A.deepStrictEqual(a, b);
const assertStringIncludes = (s: string, sub: string) => A.ok(s.includes(sub), `expected to include: ${sub}`);
import { computeChart } from "../_shared/astro.ts";
import { decodeBirth, encodeBirth, validateBirth } from "../_shared/birthcode.ts";
import { decodeData, encodeData, sign, verify } from "../_shared/epoint.ts";
import { numerology } from "../_shared/numerology.ts";
import { chartData, readingSystem } from "../_shared/prompt.ts";

Deno.env.set("EPOINT_PRIVATE_KEY", "test-private-key");

Deno.test("epoint signature matches base64(sha1_raw(key+data+key))", async () => {
  const data = encodeData({ public_key: "i000000001", amount: "1.00", currency: "AZN", order_id: "abc", description: "Ulduz — şəxsi oxunuş" });
  // reference value computed with Python: base64.b64encode(hashlib.sha1((k+data+k).encode()).digest())
  const expected = data === "eyJwdWJsaWNfa2V5IjoiaTAwMDAwMDAwMSIsImFtb3VudCI6IjEuMDAiLCJjdXJyZW5jeSI6IkFaTiIsIm9yZGVyX2lkIjoiYWJjIiwiZGVzY3JpcHRpb24iOiJVbGR1eiDigJQgxZ/JmXhzaSBveHVudcWfIn0=" ? "z8ch+NSVPLziI8PWE4oImu+eLzs=" : null;
  const sig = await sign(data);
  if (expected) assertEquals(sig, expected);
  assert(await verify(data, sig));
  assert(!(await verify(data, sig.replace(/.$/, sig.endsWith("A") ? "B" : "A"))));
  assertEquals(decodeData(data).description, "Ulduz — şəxsi oxunuş");
});

Deno.test("birth input validation rejects bad input", () => {
  assertEquals(validateBirth({ fullName: "A", date: "1995-02-30", time: null, lat: null, lon: null, tz: "UTC", place: null }), null);
  assertEquals(validateBirth({ fullName: "A", date: "1995-02-10", time: "25:00", lat: 1, lon: 1, tz: "UTC", place: null }), null);
  assertEquals(validateBirth({ fullName: "A", date: "1995-02-10", time: "08:00", lat: null, lon: null, tz: "UTC", place: null }), null);
  assertEquals(validateBirth({ fullName: "A", date: "1995-02-10", time: null, lat: null, lon: null, tz: "Mars/Olympus", place: null }), null);
  const ok = { fullName: "Aysel Həsənova", date: "1995-06-15", time: "08:30", lat: 40.41, lon: 49.87, tz: "Asia/Baku", place: "Bakı" };
  assertEquals(decodeBirth(encodeBirth(ok)), ok);
});

Deno.test("prompt contains the full chart data", () => {
  const input = { fullName: "Diana Frances Spencer", date: "1961-07-01", time: "19:45", lat: 52.83, lon: 0.5, tz: "Europe/London", place: "Sandringham" };
  const c = computeChart(input);
  const nm = numerology(input.fullName, input.date, new Date("2026-11-13"));
  const d = chartData(input, c, nm, new Date("2026-11-13T12:00:00Z"));
  assertStringIncludes(d, "Sun 9°39′ Cancer, 8th house");
  assertStringIncludes(d, "Ascendant 18°24′ Sagittarius");
  assertStringIncludes(d, "Chart ruler: Jupiter");
  assertStringIncludes(d, "Current transits");
  const s = readingSystem("az", "Diana", true);
  assertStringIncludes(s, "## The heart of you");
  assertStringIncludes(s, "Azerbaijani");
});

import { readingPrompt, questionPromptSystem } from "../_shared/order-prompts.ts";
Deno.test("couple prompt includes both people and the synastry", () => {
  const mk = (name: string, date: string, time: string, lat: number, lon: number) => {
    const p = { fullName: name, date, time, lat, lon, tz: "Asia/Baku", place: "Baku" };
    return { full_name: name, birth_date: date, birth_time: time, place: "Baku", lat, lon, chart: computeChart(p), numerology: numerology(name, date) };
  };
  const order = { kind: "couple" as const, lang: "ru" as const, charts: mk("Aysel Həsənova", "1995-06-15", "08:30", 40.41, 49.87), partner: mk("Elvin Məmmədov", "1993-02-04", "21:10", 40.68, 46.36) };
  const { system, user } = readingPrompt(order);
  assertStringIncludes(system, "## What brings you together");
  assertStringIncludes(system, "Russian");
  assertStringIncludes(user, "PERSON 1 — Aysel");
  assertStringIncludes(user, "PERSON 2 — Elvin");
  assertStringIncludes(user, "Synastry contacts");
  assertStringIncludes(user, "planets in Elvin's houses");
  assertStringIncludes(questionPromptSystem(order, "## x"), "never take sides");
  const single = readingPrompt({ ...order, kind: "natal" as const, partner: null });
  assertStringIncludes(single.system, "## The heart of you");
});
