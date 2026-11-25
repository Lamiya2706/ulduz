// Draws a shareable "big three" card (Instagram story size, 1080×1920) for a natal chart on a canvas.
// Everything is drawn locally in the browser; nothing is uploaded.
import { SIGN_ELEMENT, SIGN_GLYPHS, signOf, type Chart } from "@shared/astro";

export interface CardText {
  name: string;
  sunLabel: string; moonLabel: string; risingLabel: string;
  signNames: string[];
  elementLabel: string; elementName: string;
  lifePathLabel: string; lifePath: number;
  quote: string;
  cta: string; site: string;
}

const W = 1080, H = 1920;
const GOLD = "#D6B47C", GOLD_SOFT = "#E8D3A8", IVORY = "#F4EDE2", MUTED = "#A79E92";
const EL_COLOR = { Fire: "#D6B47C", Earth: "#8FAE96", Air: "#9FB3D1", Water: "#B79CC9" } as const;
const DISPLAY = '"Cormorant Garamond", Georgia, serif';
const SANS = 'Inter, system-ui, sans-serif';
const GLYPH = '"Noto Sans Symbols", "Noto Sans Symbols 2", "Segoe UI Symbol", "Apple Symbols", serif';

/** Small deterministic random generator, so the same chart always gets the same sky. */
function rng(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/), lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxW && line) { lines.push(line); line = w; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Shrinks a font until the text fits the width. */
function fit(ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, start: number, maxW: number) {
  let px = start;
  ctx.font = font(px);
  while (px > 40 && ctx.measureText(text).width > maxW) { px -= 4; ctx.font = font(px); }
  return px;
}

export async function drawChartCard(chart: Chart, t: CardText): Promise<HTMLCanvasElement> {
  // Make sure the web fonts are ready, or the canvas falls back to system fonts.
  try {
    await Promise.all([`300 120px ${DISPLAY}`, `400 40px ${SANS}`, `500 40px ${SANS}`, `400 80px ${GLYPH}`].map((f) => document.fonts.load(f, "AaӘə♌☉")));
  } catch { /* draw with whatever is available */ }

  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d")!;
  const rand = rng(t.name + chart.utc);

  // Night sky
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#1A1E3A"); bg.addColorStop(0.45, "#10132A"); bg.addColorStop(1, "#0B0D17");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 760, 40, W / 2, 760, 620);
  glow.addColorStop(0, "rgba(214,180,124,0.16)"); glow.addColorStop(1, "rgba(214,180,124,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 220; i++) {
    const r = rand() < 0.92 ? rand() * 1.6 + 0.4 : rand() * 2.4 + 1.6;
    ctx.globalAlpha = 0.25 + rand() * 0.6;
    ctx.fillStyle = rand() < 0.2 ? GOLD_SOFT : IVORY;
    ctx.beginPath(); ctx.arc(rand() * W, rand() * H, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Frame
  ctx.strokeStyle = "rgba(214,180,124,0.35)"; ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";

  // Brand
  ctx.fillStyle = GOLD; ctx.font = `500 30px ${SANS}`;
  ctx.letterSpacing = "10px";
  ctx.fillText("✦  ULDUZ  ✦", W / 2, 170);
  ctx.letterSpacing = "0px";

  // Name
  ctx.fillStyle = IVORY;
  fit(ctx, t.name, (px) => `300 ${px}px ${DISPLAY}`, 128, W - 200);
  ctx.fillText(t.name, W / 2, 330);

  // Zodiac ring with the Sun, Moon and Ascendant marked
  const cx = W / 2, cy = 720, R = 250;
  ctx.strokeStyle = "rgba(214,180,124,0.5)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "rgba(214,180,124,0.25)";
  ctx.beginPath(); ctx.arc(cx, cy, R - 70, 0, Math.PI * 2); ctx.stroke();
  const off = chart.angles ? chart.angles.asc : 0;
  const at = (lon: number, r: number) => { const a = ((180 + lon - off) * Math.PI) / 180; return [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const; };
  for (let i = 0; i < 12; i++) {
    const [x1, y1] = at(i * 30, R), [x2, y2] = at(i * 30, R - 70);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const [gx, gy] = at(i * 30 + 15, R - 35);
    ctx.fillStyle = EL_COLOR[SIGN_ELEMENT[i]]; ctx.font = `400 34px ${GLYPH}`; ctx.textBaseline = "middle";
    ctx.fillText(SIGN_GLYPHS[i], gx, gy);
  }
  const marks: [number, string][] = [[chart.pos.Sun.lon, "☉"], [chart.pos.Moon.lon, "☽"]];
  if (chart.angles) marks.push([chart.angles.asc, "↑"]);
  const sep = (x: number, y: number) => Math.abs((((x - y) % 360) + 540) % 360 - 180);
  marks.forEach(([lon, g], i) => {
    // Points close together on the wheel would overlap, so the later one moves further in.
    const crowded = marks.slice(0, i).some(([l]) => sep(l, lon) < 24);
    const [px, py] = at(lon, crowded ? R - 205 : R - 120);
    ctx.strokeStyle = "rgba(214,180,124,0.35)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(...at(lon, R - 70)); ctx.stroke();
    ctx.fillStyle = "#10132A"; ctx.beginPath(); ctx.arc(px, py, 34, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = GOLD; ctx.font = `400 38px ${GLYPH}`; ctx.fillText(g, px, py + 2);
  });
  ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
  ctx.textBaseline = "alphabetic";

  // The big three
  const rows: [string, string, number][] = [["☉", t.sunLabel, chart.pos.Sun.sign], ["☽", t.moonLabel, chart.pos.Moon.sign]];
  if (chart.angles) rows.push(["↑", t.risingLabel, signOf(chart.angles.asc)]);
  const colW = (W - 160) / rows.length;
  rows.forEach(([g, label, sign], i) => {
    const x = 80 + colW * i + colW / 2;
    ctx.fillStyle = GOLD; ctx.font = `400 64px ${GLYPH}`; ctx.fillText(SIGN_GLYPHS[sign], x, 1130);
    ctx.fillStyle = MUTED; ctx.font = `500 24px ${SANS}`; ctx.letterSpacing = "4px";
    ctx.fillText(`${g}  ${label.toUpperCase()}`, x, 1190); ctx.letterSpacing = "0px";
    ctx.fillStyle = IVORY;
    fit(ctx, t.signNames[sign], (px) => `400 ${px}px ${DISPLAY}`, 64, colW - 24);
    ctx.fillText(t.signNames[sign], x, 1262);
  });

  // Divider
  ctx.strokeStyle = "rgba(214,180,124,0.35)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W / 2 - 160, 1330); ctx.lineTo(W / 2 + 160, 1330); ctx.stroke();
  ctx.fillStyle = GOLD; ctx.font = `400 22px ${GLYPH}`; ctx.fillText("✦", W / 2, 1338);

  // Quote from the chart
  ctx.fillStyle = IVORY;
  let qpx = 46, lines: string[] = [];
  for (; qpx >= 34; qpx -= 2) {
    ctx.font = `italic 300 ${qpx}px ${DISPLAY}`;
    lines = wrap(ctx, t.quote, W - 240);
    if (lines.length <= 3) break;
  }
  lines = lines.slice(0, 3);
  const lh = Math.round(qpx * 1.3);
  lines.forEach((l, i) => ctx.fillText(l, W / 2, 1420 + i * lh));

  // Element and Life Path
  const y = 1420 + (lines.length - 1) * lh + 90;
  ctx.fillStyle = MUTED; ctx.font = `400 30px ${SANS}`;
  ctx.fillText(`${t.elementLabel}: ${t.elementName}   ·   ${t.lifePathLabel}: ${t.lifePath}`, W / 2, y);

  // Call to action
  ctx.fillStyle = GOLD; ctx.font = `500 30px ${SANS}`;
  ctx.fillText(t.cta, W / 2, H - 170);
  ctx.fillStyle = IVORY; ctx.font = `400 52px ${DISPLAY}`;
  ctx.fillText(t.site, W / 2, H - 105);
  return cv;
}

export const canvasToBlob = (cv: HTMLCanvasElement) => new Promise<Blob>((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error("toBlob"))), "image/png"));
