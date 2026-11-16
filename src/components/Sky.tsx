import { Link } from "react-router-dom";
import { SIGN_GLYPHS } from "@shared/zodiac";
import type { Phase, SkyDay, Verdict } from "@shared/sky";
import { getContent } from "@/content";
import { getNumContent } from "@/content/numerology";
import { getSkyContent } from "@/content/sky";
import type { Lang } from "@/i18n";
import { formatDate } from "@/lib/date";
import { Reveal } from "./Decor";

export const VERDICT_STYLE: Record<Verdict, string> = {
  good: "bg-emerald-400/15 text-emerald-300",
  neutral: "bg-gold/15 text-gold",
  bad: "bg-rose/15 text-rose",
};
export const VERDICT_DOT: Record<Verdict, string> = { good: "bg-emerald-300", neutral: "bg-gold/70", bad: "bg-rose" };

/** Moon disc lit according to the phase (northern-hemisphere view). */
export function MoonIcon({ illumination, phase, className = "h-16 w-16" }: { illumination: number; phase: Phase; className?: string }) {
  const k = illumination / 100;
  const rx = Math.abs(1 - 2 * k) * 20;
  const side = phase === "waning" ? 0 : 1; // lit on the right while waxing, on the left while waning
  const outer = side ? "M20 0 A20 20 0 0 1 20 40" : "M20 0 A20 20 0 0 0 20 40";
  const inner = `A${rx} 20 0 0 ${k > 0.5 ? side : 1 - side} 20 0`;
  return (
    <svg viewBox="-2 -2 44 44" className={className} aria-hidden>
      <circle cx="20" cy="20" r="20" fill="#1b1f33" stroke="rgba(214,180,124,.35)" strokeWidth="0.8" />
      {k > 0.02 && (k > 0.98 ? <circle cx="20" cy="20" r="20" fill="#EFE3C8" /> : <path d={`${outer} ${inner} Z`} fill="#EFE3C8" />)}
    </svg>
  );
}

export function DayCard({ day, lang, title, showLink = false }: { day: SkyDay; lang: Lang; title: string; showLink?: boolean }) {
  const sc = getSkyContent(lang), c = getContent(lang), nc = getNumContent(lang);
  const ms = sc.moonSigns[day.moonSign];
  const ph = sc.phases[day.phase];
  const retroNames = day.retro.map((k) => c.planetNames[k]);
  const special = (["Mercury", "Venus", "Mars"] as const).filter((k) => day.retro.includes(k));
  const others = day.retro.filter((k) => !special.includes(k as "Mercury")).map((k) => c.planetNames[k]);
  const hairText = day.haircutReason === "sign" ? ms.hair : sc.haircutReason[day.haircutReason];
  return (
    <div className="grid gap-4">
      <div className="card grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex items-center gap-5">
          <MoonIcon illumination={day.illumination} phase={day.phase} className="h-20 w-20 flex-none" />
          <div className="sm:hidden"><p className="font-display text-2xl">{ph.name}</p><p className="text-xs text-muted">{sc.ui.illumination(day.illumination)} · {sc.ui.lunarDay(day.lunarDay)}</p></div>
        </div>
        <div>
          <p className="eyebrow">{title}</p>
          <p className="mt-2 hidden font-display text-3xl sm:block">{ph.name} <span className="text-base text-muted">· {sc.ui.illumination(day.illumination)} · {sc.ui.lunarDay(day.lunarDay)}</span></p>
          <p className="mt-2 text-lg"><span className="glyph text-gold">{SIGN_GLYPHS[day.moonSign]}</span> {sc.ui.moonIn(c.signIn[day.moonSign])}
            {day.moonSignChange !== null && <span className="text-sm text-muted"> · {sc.ui.moonMoves(c.signNames[day.moonSignChange])}</span>}</p>
          <p className="mt-2 text-sm leading-relaxed text-ivory/80"><span className="text-ivory">{ms.mood}.</span> {ph.text}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-emerald-300">{sc.ui.doTitle}</p>
          <ul className="mt-3 grid gap-2">{ms.do.map((x) => <li key={x} className="flex gap-3 text-sm text-ivory/90"><span className="text-emerald-300">✓</span>{x}</li>)}</ul>
          <p className="mt-5 text-[0.68rem] uppercase tracking-[0.16em] text-rose">{sc.ui.avoidTitle}</p>
          <ul className="mt-3 grid gap-2">{ms.avoid.map((x) => <li key={x} className="flex gap-3 text-sm text-ivory/90"><span className="text-rose">✕</span>{x}</li>)}</ul>
        </div>
        <div className="card">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-xl">✂ {sc.ui.haircutTitle}</p>
            <span className={`rounded-full px-3 py-1 text-xs ${VERDICT_STYLE[day.haircut]}`}>{sc.ui.verdict[day.haircut]}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ivory/85">{hairText}</p>
          {day.phase !== "new" && day.phase !== "full" && <p className="mt-2 text-sm leading-relaxed text-muted">{sc.hairGrowth[day.phase]}</p>}
        </div>
        <div className="card">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-xl">{sc.ui.dayNumber}</p>
            <span className="font-display text-4xl leading-none text-gold">{day.dayNumber}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ivory/85"><span className="text-ivory">{nc.numbers[day.dayNumber].title}.</span> {nc.days[day.dayNumber as 1]}</p>
        </div>
        <div className="card">
          <p className="font-display text-xl">℞ {sc.ui.retroTitle}</p>
          {retroNames.length === 0 ? <p className="mt-3 text-sm text-ivory/85">{sc.ui.noRetro}</p> : (
            <div className="mt-3 grid gap-2 text-sm leading-relaxed text-ivory/85">
              {special.map((k) => <p key={k}>{sc.retro[k]}</p>)}
              {others.length > 0 && <p className="text-muted">{sc.retro.other(others.join(", "))}</p>}
            </div>
          )}
        </div>
      </div>
      {showLink && <div className="text-center"><Link to={`/${lang}/moon`} className="btn-ghost">{sc.ui.toCalendar} <span aria-hidden>→</span></Link></div>}
    </div>
  );
}

/** Home page block: the sky today. Lazy-loaded (needs the astronomy engine). */
export default function TodaySection({ lang, day }: { lang: Lang; day: SkyDay }) {
  const sc = getSkyContent(lang);
  return (
    <section className="mx-auto max-w-4xl px-5 sm:px-8">
      <Reveal>
        <p className="eyebrow text-center">{sc.ui.eyebrow}</p>
        <h2 className="mt-3 text-center text-4xl sm:text-5xl">{sc.ui.todayTitle(formatDate(day.date, lang))}</h2>
      </Reveal>
      <div className="mt-8"><DayCard day={day} lang={lang} title={sc.ui.eyebrow} showLink /></div>
    </section>
  );
}
