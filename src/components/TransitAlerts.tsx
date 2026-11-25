import { useMemo, useState } from "react";
import { ASPECTS, PLANETS, type Chart } from "@shared/astro";
import { transitAlerts, type AlertPoint, type TransitAlert } from "@shared/transits";
import type { Lang } from "@/i18n";
import { getContent } from "@/content";
import { getDailyContent } from "@/content/daily";
import { getTransitContent } from "@/content/transits";
import { formatDate, formatDayMonth } from "@/lib/date";

const glyph = (k: string) => PLANETS.find((p) => p.key === k)?.glyph ?? "";
const symbol = (t: TransitAlert["type"]) => ASPECTS.find((a) => a.type === t)!.symbol;
const KIND_STYLE = { soft: "text-emerald-300", hard: "text-rose", conjunction: "text-gold" } as const;
const SHOWN = 4;

/** Alerts for one chart, computed once per day. */
export function useTransitAlerts(chart: Chart | null) {
  const day = new Date().toISOString().slice(0, 10);
  return useMemo(() => (chart ? transitAlerts(chart, new Date(day + "T12:00:00Z")) : []), [chart, day]);
}

export default function TransitAlerts({ chart, lang }: { chart: Chart; lang: Lang }) {
  const tc = getTransitContent(lang), c = getContent(lang), dc = getDailyContent(lang);
  const alerts = useTransitAlerts(chart);
  const [all, setAll] = useState(false);
  const pointName = (k: AlertPoint) => (k === "Asc" ? dc.ui.asc : k === "MC" ? "MC" : c.planetNames[k]);
  const pointGlyph = (k: AlertPoint) => (k === "Asc" ? "↑" : k === "MC" ? "" : glyph(k));
  const shown = all ? alerts : alerts.slice(0, SHOWN);
  const today = new Date().toISOString().slice(0, 10);
  // Not in orb today: show when it next becomes exact.
  const nextExact = (a: TransitAlert) => { const d = a.exact.find((x) => x >= today) ?? a.start; return formatDayMonth(new Date(d + "T12:00:00Z"), lang); };

  return (
    <section id="transits" className="mt-12 scroll-mt-24">
      <p className="eyebrow">{tc.ui.title}</p>
      <p className="mt-3 max-w-2xl text-sm text-muted">{tc.ui.intro}</p>
      {!alerts.length ? <p className="card mt-5 text-sm leading-relaxed text-ivory/85">{tc.ui.none}</p> : (
        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {shown.map((a) => (
            <li key={`${a.planet}-${a.point}-${a.type}-${a.start}`} className={`card ${a.active ? "border-gold/40" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-ivory">
                  <span className="glyph text-gold">{glyph(a.planet)}</span> {c.planetNames[a.planet]} <span className={`glyph ${KIND_STYLE[a.kind]}`}>{symbol(a.type)}</span>{" "}
                  {pointGlyph(a.point) && <span className="glyph text-gold">{pointGlyph(a.point)}</span>} {pointName(a.point)}
                </p>
                <span className={`flex-none rounded-full px-3 py-1 text-xs ${a.active ? "bg-gold/15 text-gold" : "bg-white/[0.05] text-muted"}`}>{a.active ? tc.ui.now : nextExact(a)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">{tc.ui.period(formatDate(a.start, lang), formatDate(a.end, lang))} · {tc.ui.exact(a.exact.map((d) => formatDate(d, lang)).join(", "))}</p>
              <p className="mt-1 text-xs text-muted">{tc.ui.touches}: {tc.points[a.point]}</p>
              <p className="mt-3 text-sm leading-relaxed text-ivory/90">{tc.planets[a.planet][a.kind]}</p>
            </li>
          ))}
        </ul>
      )}
      {alerts.length > SHOWN && (
        <button type="button" data-track="transits_toggle" onClick={() => setAll(!all)} className="mt-4 text-sm text-gold hover:text-ivory">{all ? tc.ui.showLess : tc.ui.showAll(alerts.length)}</button>
      )}
      {!chart.timeKnown && <p className="mt-4 text-xs text-muted">{tc.ui.noTimeNote}</p>}
    </section>
  );
}
