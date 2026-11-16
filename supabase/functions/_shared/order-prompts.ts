// Builds the Claude prompts for an order (single natal reading or couple reading).
import type { Chart } from "./astro.ts";
import type { Numerology } from "./numerology.ts";
import { chartData, coupleQuestionSystem, coupleSystem, firstName, questionSystem, readingSystem, synastryData, type Lang } from "./prompt.ts";
import { synastry } from "./synastry.ts";

// deno-lint-ignore no-explicit-any
type ChartRow = { full_name: string; birth_date: string; birth_time: string | null; place: string | null; lat: number | null; lon: number | null; chart: Chart; numerology: Numerology; [k: string]: any };
// deno-lint-ignore no-explicit-any
type OrderRow = { kind: "natal" | "couple"; lang: Lang; charts: ChartRow; partner: ChartRow | null; [k: string]: any };

const data = (c: ChartRow) => chartData({ fullName: c.full_name, date: c.birth_date, time: c.birth_time, place: c.place, lat: c.lat, lon: c.lon }, c.chart, c.numerology);

function coupleData(o: OrderRow) {
  const a = o.charts, b = o.partner!;
  const na = firstName(a.full_name), nb = firstName(b.full_name);
  const syn = synastry(a.chart, b.chart, a.numerology.lifePath, b.numerology.lifePath);
  return { na, nb, text: `PERSON 1 — ${na}\n${data(a)}\n\nPERSON 2 — ${nb}\n${data(b)}\n\nSYNASTRY\n${synastryData(na, nb, syn)}` };
}

export function readingPrompt(o: OrderRow): { system: string; user: string } {
  if (o.kind === "couple" && o.partner) {
    const { na, nb, text } = coupleData(o);
    return { system: coupleSystem(o.lang, na, nb, o.charts.chart.timeKnown && o.partner.chart.timeKnown), user: `CHART DATA\n${text}\n\nWrite the reading now.` };
  }
  return { system: readingSystem(o.lang, firstName(o.charts.full_name), o.charts.chart.timeKnown), user: `CHART DATA\n${data(o.charts)}\n\nWrite the reading now.` };
}

export function questionPromptSystem(o: OrderRow, reading: string): string {
  if (o.kind === "couple" && o.partner) {
    const { na, nb, text } = coupleData(o);
    return `${coupleQuestionSystem(o.lang, na, nb, reading)}\n\nCHART DATA\n${text}`;
  }
  return `${questionSystem(o.lang, firstName(o.charts.full_name), reading)}\n\nCHART DATA\n${data(o.charts)}`;
}
