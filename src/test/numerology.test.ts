import { describe, expect, it } from "vitest";
import { decodeNum, encodeNum, fullNumerology } from "@shared/numerology-full";

describe("extended numerology", () => {
  const n = fullNumerology("Aysel Hasanova", "1985-06-21", new Date(2026, 10, 16));
  it("computes the Pythagoras square", () => {
    expect(n.square.working).toEqual([32, 5, 28, 10]);
    expect(n.square.cells.slice(1)).toEqual([3, 3, 1, 0, 2, 1, 0, 2, 1]);
  });
  it("finds karmic debt in the life path and computes cycles", () => {
    expect(n.core.lifePath).toBe(5);
    expect(n.debts).toContainEqual({ key: "lifePath", debt: 14 });
    expect(n.pinnacles.map((p) => p.value)).toEqual([9, 8, 8, 11]);
    expect(n.pinnacles[0]).toEqual({ value: 9, from: 0, to: 31 });
    expect(n.challenges.map((p) => p.value)).toEqual([3, 2, 1, 1]);
    expect(n.age).toBe(41);
    expect(n.personalYear).toBe(1);
  });
  it("builds the name chart", () => {
    expect(n.letters.flat().length).toBe(13);
    expect(n.lessons).toEqual([2, 9]);
    expect(n.passion).toEqual([1]);
  });
  it("round-trips the URL code", () => {
    expect(decodeNum(encodeNum("Ləman Əsgərova", "1999-02-28"))).toEqual({ name: "Ləman Əsgərova", date: "1999-02-28" });
    expect(decodeNum("garbage")).toBeNull();
  });
});
