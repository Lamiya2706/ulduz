import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { skyMonth } from "@shared/sky";
import { SIGN_GLYPHS } from "@shared/zodiac";
import { DayCard, MoonIcon, VERDICT_DOT } from "@/components/Sky";
import { useLang } from "@/components/Layout";
import { getSkyContent } from "@/content/sky";
import { formatDate, formatMonth } from "@/lib/date";

const todayParts = () => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }; };

export default function MoonPage() {
  const lang = useLang();
  const sc = getSkyContent(lang);
  const now = todayParts();
  const [ym, setYm] = useState({ y: now.y, m: now.m });
  const [sel, setSel] = useState<number>(now.d);
  const days = useMemo(() => skyMonth(ym.y, ym.m), [ym]);
  const lead = (new Date(ym.y, ym.m - 1, 1).getDay() + 6) % 7; // Monday first
  const shift = (delta: number) => {
    const d = new Date(ym.y, ym.m - 1 + delta, 1);
    const next = { y: d.getFullYear(), m: d.getMonth() + 1 };
    setYm(next);
    setSel(next.y === now.y && next.m === now.m ? now.d : 1);
  };
  const isToday = (d: number) => ym.y === now.y && ym.m === now.m && d === now.d;
  const day = days[Math.min(sel, days.length) - 1];

  return (
    <div className="mx-auto max-w-4xl px-5 pt-8 sm:px-8 lg:pt-14">
      <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="text-center">
        <p className="eyebrow">Ulduz</p>
        <h1 className="mt-4 text-5xl sm:text-6xl">{sc.ui.calTitle}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-muted">{sc.ui.calIntro}</p>
      </motion.header>

      <section className="card mt-10 p-4 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <button type="button" data-track="moon_month_change" data-track-label="prev" onClick={() => shift(-1)} aria-label={sc.ui.prev} className="grid h-10 w-10 place-items-center rounded-full text-gold hover:bg-gold/10">←</button>
          <div className="text-center">
            <h2 className="font-display text-3xl">{formatMonth(ym.y, ym.m, lang)}</h2>
            {!(ym.y === now.y && ym.m === now.m) && <button type="button" onClick={() => { setYm({ y: now.y, m: now.m }); setSel(now.d); }} className="mt-1 text-xs text-gold hover:text-ivory">{sc.ui.today}</button>}
          </div>
          <button type="button" data-track="moon_month_change" data-track-label="next" onClick={() => shift(1)} aria-label={sc.ui.next} className="grid h-10 w-10 place-items-center rounded-full text-gold hover:bg-gold/10">→</button>
        </div>
        <div className="mt-6 grid grid-cols-7 gap-1 text-center text-[0.65rem] uppercase tracking-[0.1em] text-muted sm:gap-2">
          {sc.ui.weekdays.map((w) => <div key={w}>{w}</div>)}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
          {Array.from({ length: lead }, (_, i) => <div key={`e${i}`} />)}
          {days.map((d, i) => {
            const n = i + 1;
            const active = n === sel;
            return (
              <button key={n} type="button" data-track="moon_day_select" data-track-label={d.date} data-track-haircut={d.haircut} onClick={() => setSel(n)} aria-pressed={active} aria-label={formatDate(d.date, lang)}
                className={`relative flex aspect-[4/5] flex-col items-center justify-between rounded-xl border px-0.5 py-1.5 transition sm:aspect-square sm:py-2 ${active ? "border-gold bg-gold/[0.12]" : isToday(n) ? "border-gold/50" : "border-gold/10 hover:border-gold/40"}`}>
                <span className={`text-sm sm:text-base ${isToday(n) ? "font-semibold text-gold" : "text-ivory"}`}>{n}</span>
                <MoonIcon illumination={d.illumination} phase={d.phase} className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="flex items-center gap-1 text-[0.7rem] leading-none sm:text-xs">
                  <span className="glyph text-gold/80">{SIGN_GLYPHS[d.moonSign]}</span>
                  <span className={`h-1.5 w-1.5 rounded-full ${VERDICT_DOT[d.haircut]}`} />
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted">
          <span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${VERDICT_DOT.good}`} />✂ {sc.ui.legendGood}</span>
          <span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${VERDICT_DOT.neutral}`} />{sc.ui.legendNeutral}</span>
          <span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${VERDICT_DOT.bad}`} />{sc.ui.legendBad}</span>
        </div>
      </section>

      {day && (
        <section className="mt-8" aria-live="polite">
          <DayCard day={day} lang={lang} title={isToday(sel) ? sc.ui.todayTitle(formatDate(day.date, lang)) : sc.ui.dayTitle(formatDate(day.date, lang))} />
        </section>
      )}
      <p className="mx-auto mt-10 max-w-xl text-center text-xs text-muted/70">{sc.ui.disclaimer}</p>
    </div>
  );
}
