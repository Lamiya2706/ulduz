// Pythagorean numerology. Shared by web app and edge functions.
const MAP: Record<string, number> = { a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:1,k:2,l:3,m:4,n:5,o:6,p:7,q:8,r:9,s:1,t:2,u:3,v:4,w:5,x:6,y:7,z:8 };
const TRANSLIT: Record<string, string> = {
  "ə":"e","ı":"i","i̇":"i","ş":"s","ç":"c","ğ":"g","ö":"o","ü":"u","é":"e","è":"e","á":"a","à":"a","ñ":"n","ä":"a","å":"a","ø":"o","ß":"s",
  "а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"e","ж":"zh","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p",
  "р":"r","с":"s","т":"t","у":"u","ф":"f","х":"kh","ц":"ts","ч":"ch","ш":"sh","щ":"sh","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya",
};
export const cleanName = (n: string) =>
  [...n.toLocaleLowerCase("az")].map((c) => TRANSLIT[c] ?? c).join("").normalize("NFD").replace(/[^a-z]/g, "");

const digitSum = (n: number) => [...String(n)].reduce((a, c) => a + Number(c), 0);
export function reduce(n: number, keepMaster = true): number {
  while (n > 9 && !(keepMaster && (n === 11 || n === 22 || n === 33))) n = digitSum(n);
  return n;
}
function isVowel(w: string, i: number) {
  const c = w[i];
  if ("aeiou".includes(c)) return true;
  if (c === "y") {
    const p = w[i - 1], n = w[i + 1];
    return !(p && "aeiou".includes(p)) && !(n && "aeiou".includes(n));
  }
  return false;
}

export interface Numerology {
  lifePath: number; expression: number | null; soul: number | null; personality: number | null;
  birthday: number; personalYear: number; year: number;
}
export function numerology(fullName: string, date: string, now = new Date()): Numerology {
  const [y, m, d] = date.split("-").map(Number);
  const lifePath = reduce(reduce(m) + reduce(d) + reduce(digitSum(y)));
  const words = fullName.trim().split(/\s+/).map(cleanName).filter(Boolean);
  let ex = 0, su = 0, pe = 0;
  for (const w of words) {
    let we = 0, ws = 0, wp = 0;
    [...w].forEach((c, i) => { const v = MAP[c]; we += v; if (isVowel(w, i)) ws += v; else wp += v; });
    ex += reduce(we); su += reduce(ws); pe += reduce(wp);
  }
  const year = now.getFullYear();
  return {
    lifePath,
    expression: words.length ? reduce(ex) : null,
    soul: words.length ? reduce(su) : null,
    personality: words.length ? reduce(pe) : null,
    birthday: reduce(d),
    personalYear: reduce(reduce(m) + reduce(d) + reduce(digitSum(year)), false),
    year,
  };
}
