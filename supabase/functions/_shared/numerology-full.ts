// Extended numerology: Pythagorean core numbers plus karmic numbers, name chart,
// pinnacles/challenges, cycles and the Pythagoras square (psychomatrix). Shared by web and server.
import { cleanName, reduce } from "./numerology.ts";

const MAP: Record<string, number> = { a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:1,k:2,l:3,m:4,n:5,o:6,p:7,q:8,r:9,s:1,t:2,u:3,v:4,w:5,x:6,y:7,z:8 };
const digitSum = (n: number) => [...String(Math.abs(n))].reduce((a, c) => a + Number(c), 0);
const single = (n: number) => reduce(n, false);
const KARMIC = [13, 14, 16, 19];

function isVowel(w: string, i: number) {
  const c = w[i];
  if ("aeiou".includes(c)) return true;
  if (c === "y") {
    const p = w[i - 1], n = w[i + 1];
    return !(p && "aeiou".includes(p)) && !(n && "aeiou".includes(n));
  }
  return false;
}

/** Reduces a compound number step by step and reports whether it passed through 13/14/16/19. */
function reduceTrack(n: number): { value: number; debt: number | null } {
  let debt: number | null = null;
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    if (KARMIC.includes(n)) debt = n;
    n = digitSum(n);
  }
  return { value: n, debt };
}

export type CoreKey = "lifePath" | "expression" | "soul" | "personality" | "birthday" | "maturity";
export interface Letter { ch: string; value: number; vowel: boolean }
export interface Period { value: number; from: number; to: number | null }
export interface FullNumerology {
  name: string; date: string;
  core: Record<CoreKey, number | null>;
  debts: { key: CoreKey; debt: number }[];
  letters: Letter[][];
  intensity: number[];          // index 1..9: how many letters carry that number
  lessons: number[];            // numbers missing from the name
  passion: number[];            // most frequent number(s) in the name
  pinnacles: Period[]; challenges: Period[];
  personalYear: number; personalMonth: number; personalDay: number; year: number; age: number;
  square: { cells: number[]; working: number[] }; // cells index 1..9: count of each digit
}

export function fullNumerology(fullName: string, date: string, now = new Date()): FullNumerology {
  const [y, m, d] = date.split("-").map(Number);
  const debts: { key: CoreKey; debt: number }[] = [];

  // Life Path: month + day + year, each reduced first (keeps master numbers).
  const lpT = reduceTrack(reduce(m) + reduce(d) + reduce(digitSum(y)));
  if (lpT.debt) debts.push({ key: "lifePath", debt: lpT.debt });
  const bdT = reduceTrack(d);
  if (bdT.debt) debts.push({ key: "birthday", debt: bdT.debt });

  const words = fullName.trim().split(/\s+/).map(cleanName).filter(Boolean);
  const letters: Letter[][] = words.map((w) => [...w].map((ch, i) => ({ ch, value: MAP[ch], vowel: isVowel(w, i) })));
  const sumWords = (pick: (l: Letter) => boolean) => letters.reduce((a, w) => a + reduce(w.filter(pick).reduce((s, l) => s + l.value, 0)), 0);
  const nameNum = (key: CoreKey, pick: (l: Letter) => boolean) => {
    if (!words.length) return null;
    const t = reduceTrack(sumWords(pick));
    if (t.debt) debts.push({ key, debt: t.debt });
    return t.value;
  };
  const expression = nameNum("expression", () => true);
  const soul = nameNum("soul", (l) => l.vowel);
  const personality = nameNum("personality", (l) => !l.vowel);
  const maturity = expression === null ? null : reduce(lpT.value + expression);

  const intensity = Array(10).fill(0);
  letters.flat().forEach((l) => intensity[l.value]++);
  const lessons = words.length ? [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => intensity[n] === 0) : [];
  const max = Math.max(...intensity.slice(1));
  const passion = words.length && max > 0 ? [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => intensity[n] === max) : [];

  // Pinnacles and challenges (single digits; master numbers kept for pinnacles only).
  const sm = single(m), sd = single(d), sy = single(digitSum(y));
  const p1 = reduce(sm + sd), p2 = reduce(sd + sy), p3 = reduce(p1 + p2), p4 = reduce(sm + sy);
  const c1 = Math.abs(sm - sd), c2 = Math.abs(sd - sy), c3 = Math.abs(c1 - c2), c4 = Math.abs(sm - sy);
  const end1 = 36 - single(lpT.value);
  const spans: [number, number | null][] = [[0, end1], [end1 + 1, end1 + 9], [end1 + 10, end1 + 18], [end1 + 19, null]];
  const pinnacles = [p1, p2, p3, p4].map((value, i) => ({ value, from: spans[i][0], to: spans[i][1] }));
  const challenges = [c1, c2, c3, c4].map((value, i) => ({ value, from: spans[i][0], to: spans[i][1] }));

  const year = now.getFullYear();
  const personalYear = single(sm + sd + single(digitSum(year)));
  const personalMonth = single(personalYear + now.getMonth() + 1);
  const personalDay = single(personalMonth + now.getDate());
  let age = year - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--;

  // Pythagoras square: digits of the birth date plus four "working numbers".
  const dateDigits = `${String(d).padStart(2, "0")}${String(m).padStart(2, "0")}${y}`.split("").map(Number);
  const w1 = dateDigits.reduce((a, b) => a + b, 0);
  const w2 = digitSum(w1);
  const firstDay = Number(String(d)[0]);
  const w3 = y >= 2000 ? w1 + 19 : w1 - 2 * firstDay;
  const w4 = digitSum(w3);
  const working = [w1, w2, w3, w4];
  const cells = Array(10).fill(0);
  [...dateDigits.join(""), ...working.map(String).join("")].forEach((c) => { const n = Number(c); if (n > 0) cells[n]++; });

  return {
    name: fullName.trim(), date,
    core: { lifePath: lpT.value, expression, soul, personality, birthday: bdT.value, maturity },
    debts, letters, intensity, lessons, passion, pinnacles, challenges,
    personalYear, personalMonth, personalDay, year, age, square: { cells, working },
  };
}

// URL code for the numerology page: just name + date.
const toB64Url = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64Url = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));
export const encodeNum = (name: string, date: string) => toB64Url(JSON.stringify([name.trim().slice(0, 120), date]));
export function decodeNum(code: string): { name: string; date: string } | null {
  try {
    const [name, date] = JSON.parse(fromB64Url(code));
    if (typeof name !== "string" || !name.trim() || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const [y, m, d] = date.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (y < 1900 || y > 2100 || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
    return { name: name.trim().slice(0, 120), date };
  } catch { return null; }
}
