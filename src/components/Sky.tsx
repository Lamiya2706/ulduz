import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ASPECTS, type PlanetKey } from "@shared/astro";
import { fullNumerology } from "@shared/numerology-full";
import { PLANETS, SIGN_GLYPHS } from "@shared/zodiac";
import { skyDetails, SPHERES, type Phase, type SkyDay, type Verdict } from "@shared/sky";
import { getContent } from "@/content";
import { getNumContent } from "@/content/numerology";
import { getSkyContent, getSkyMore } from "@/content/sky";
import { getDailyContent } from "@/content/daily";
import { FULLMOON_UI } from "@/i18n/fullmoon";
import type { Lang } from "@/i18n";
import { formatDate } from "@/lib/date";

export const VERDICT_STYLE: Record<Verdict, string> = {
  good: "bg-emerald-400/15 text-emerald-300",
  neutral: "bg-gold/15 text-gold",
  bad: "bg-rose/15 text-rose",
};
export const VERDICT_DOT: Record<Verdict, string> = { good: "bg-emerald-300", neutral: "bg-gold/70", bad: "bg-rose" };

/** Shown on Full Moon days: invites to the manifestation ritual. */
export function FullMoonBanner({ lang, place }: { lang: Lang; place: string }) {
  const b = FULLMOON_UI[lang].banner;
  return (
    <Link to={`/${lang}/full-moon`} data-track="fullmoon_banner" data-track-place={place}
      className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-gradient-to-r from-gold/[0.14] to-transparent px-5 py-4 transition hover:border-gold">
      <span className="flex items-center gap-3 text-sm text-ivory"><span aria-hidden className="h-5 w-5 flex-none rounded-full bg-[#EFE3C8] shadow-[0_0_18px_rgba(239,227,200,.55)]" />{b.now}</span>
      <span className="text-sm text-gold transition group-hover:text-ivory">{b.cta} →</span>
    </Link>
  );
}

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

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const daysBetween = (from: string, to: Date) => Math.round((new Date(iso(to) + "T12:00").getTime() - new Date(from + "T12:00").getTime()) / 86400000);
const cap = (t: string, lang: Lang) => t.charAt(0).toLocaleUpperCase(lang) + t.slice(1);
const BIRTH_KEY = "ulduz.birthdate";

function Dots({ n }: { n: number }) {
  return <span className="flex gap-1" aria-hidden>{[1, 2, 3, 4, 5].map((i) => <span key={i} className={`h-2 w-2 rounded-full ${i <= n ? "bg-gold" : "bg-white/10"}`} />)}</span>;
}

function PersonalDay({ lang, date }: { lang: Lang; date: string }) {
  const sm = getSkyMore(lang), nc = getNumContent(lang);
  const [birth, setBirth] = useState<string>(() => { try { return localStorage.getItem(BIRTH_KEY) ?? ""; } catch { return ""; } });
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(!birth);
  const save = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft)) return;
    setBirth(draft); setEditing(false);
    try { localStorage.setItem(BIRTH_KEY, draft); } catch { /* ignore */ }
  };
  const [y, m, d] = date.split("-").map(Number);
  const n = birth && !editing ? fullNumerology("", birth, new Date(y, m - 1, d, 12)) : null;
  return (
    <div className="card border-gold/30">
      <p className="font-display text-xl">✦ {sm.ui.personalTitle}</p>
      {!n ? (
        <>
          <p className="mt-2 text-sm text-muted">{sm.ui.personalIntro}</p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="label min-w-[12rem] flex-1">{sm.ui.personalDate}
              <input className="field" type="date" min="1900-01-01" max="2099-12-31" value={draft} onChange={(e) => setDraft(e.target.value)} />
            </label>
            <button type="button" className="btn" data-track="personal_day_set" onClick={save}>{sm.ui.personalBtn}</button>
          </div>
        </>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[[sm.ui.personalDay, n.personalDay], [sm.ui.personalMonth, n.personalMonth], [sm.ui.personalYear(n.year), n.personalYear]].map(([label, v]) => (
              <div key={String(label)} className="rounded-2xl border border-gold/15 py-3">
                <div className="font-display text-4xl leading-none text-gold">{v}</div>
                <div className="mt-2 text-[0.62rem] uppercase tracking-[0.12em] text-muted">{label}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ivory/90"><span className="text-ivory">{nc.numbers[n.personalDay].title}.</span> {nc.days[n.personalDay as 1]} {nc.months[n.personalMonth as 1]}</p>
          <button type="button" onClick={() => { setDraft(birth); setEditing(true); }} className="mt-3 text-xs text-gold hover:text-ivory">{sm.ui.personalChange}</button>
        </>
      )}
      <Link to={`/${lang}/today`} data-track="personal_day_horoscope" className="mt-4 flex items-center justify-between gap-3 border-t border-gold/10 pt-4 text-sm text-gold hover:text-ivory">
        <span>✦ {getDailyContent(lang).ui.teaser}</span><span aria-hidden>→</span>
      </Link>
    </div>
  );
}

export function DayCard({ day, lang, title, showLink = false }: { day: SkyDay; lang: Lang; title: string; showLink?: boolean }) {
  const sc = getSkyContent(lang), sm = getSkyMore(lang), c = getContent(lang), nc = getNumContent(lang);
  const det = useMemo(() => { const [y, m, d] = day.date.split("-").map(Number); return skyDetails(y, m, d, day); }, [day]);
  const ms = sc.moonSigns[day.moonSign];
  const ph = sc.phases[day.phase];
  const [ldSymbol, ldText] = sm.lunarDays[day.lunarDay - 1];
  const special = (["Mercury", "Venus", "Mars"] as const).filter((k) => day.retro.includes(k));
  const others = day.retro.filter((k) => !(special as readonly string[]).includes(k)).map((k) => c.planetNames[k]);
  const hairText = day.haircutReason === "sign" ? ms.hair : sc.haircutReason[day.haircutReason];
  const glyph = (k: PlanetKey) => PLANETS.find((p) => p.key === k)!.glyph;
  const events = [
    { label: sm.ui.nextFull, date: det.nextFull, icon: "○" },
    { label: sm.ui.nextNew, date: det.nextNew, icon: "●" },
    ...(det.mercury.changes ? [{ label: det.mercury.retro ? sm.ui.mercEnds : sm.ui.mercStarts, date: det.mercury.changes, icon: "☿" }] : []),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());
  return (
    <div className="grid gap-4">
      {day.phase === "full" && <FullMoonBanner lang={lang} place="day_card" />}
      <div className="card grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex items-center gap-5">
          <MoonIcon illumination={day.illumination} phase={day.phase} className="h-20 w-20 flex-none" />
          <div className="sm:hidden"><p className="font-display text-2xl">{ph.name}</p><p className="text-xs text-muted">{sc.ui.illumination(day.illumination)} · {sc.ui.lunarDay(day.lunarDay)}</p></div>
        </div>
        <div>
          <p className="eyebrow">{title}</p>
          <p className="mt-2 hidden font-display text-3xl sm:block">{ph.name} <span className="text-base text-muted">· {sc.ui.illumination(day.illumination)} · {sc.ui.lunarDay(day.lunarDay)}</span></p>
          <p className="mt-2 text-lg"><span className="glyph text-gold">{SIGN_GLYPHS[day.moonSign]}</span> {sc.ui.moonIn(c.signIn[day.moonSign])}</p>
          {det.moonIngress && day.moonSignChange !== null && <p className="text-sm text-muted">{sm.ui.ingress(hhmm(det.moonIngress), c.signNames[day.moonSignChange])}</p>}
          <p className="mt-2 text-sm leading-relaxed text-ivory/80"><span className="text-ivory">{ms.mood}.</span> {ph.text}</p>
        </div>
        <div className="border-t border-gold/10 pt-5 sm:col-span-2">
          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-gold">{sm.ui.lunarDayTitle(day.lunarDay, ldSymbol)}</p>
          <p className="mt-2 text-sm leading-relaxed text-ivory/90">{ldText}</p>
          <p className="mt-4 text-[0.68rem] uppercase tracking-[0.16em] text-gold"><span className="glyph">{SIGN_GLYPHS[det.sunSign]}</span> {sm.ui.seasonTitle(c.signNames[det.sunSign])}</p>
          <p className="mt-2 text-sm leading-relaxed text-ivory/90">{sm.sunSeason[det.sunSign]}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <p className="font-display text-xl">{sm.ui.spheresTitle}</p>
          <div className="mt-4 grid gap-3">
            {SPHERES.map((k) => (
              <div key={k} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ivory/90">{sm.ui.sphereNames[k]}</span>
                <span className="flex items-center gap-3"><span className="text-xs text-muted">{sm.ui.sphereLevels[det.spheres[k] - 1]}</span><Dots n={det.spheres[k]} /></span>
              </div>
            ))}
          </div>
        </div>
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
      </div>

      <PersonalDay lang={lang} date={day.date} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <p className="font-display text-xl">{sm.ui.planetsTitle}</p>
          <ul className="mt-4 grid gap-2 text-sm">
            {det.planets.map((p) => (
              <li key={p.key} className="flex items-center gap-2">
                <span className="glyph w-5 text-center text-gold">{glyph(p.key)}</span>
                <span className="w-24 text-ivory/90">{c.planetNames[p.key]}</span>
                <span className="text-muted"><span className="glyph">{SIGN_GLYPHS[p.sign]}</span> {c.signNames[p.sign]}{p.retro ? " ℞" : ""}</span>
              </li>
            ))}
          </ul>
          {day.retro.length > 0 && (
            <div className="mt-4 grid gap-2 border-t border-gold/10 pt-4 text-sm leading-relaxed text-ivory/85">
              <p className="text-[0.68rem] uppercase tracking-[0.16em] text-gold">℞ {sc.ui.retroTitle}</p>
              {special.map((k) => <p key={k}>{sc.retro[k]}</p>)}
              {others.length > 0 && <p className="text-muted">{sc.retro.other(others.join(", "))}</p>}
            </div>
          )}
          {day.retro.length === 0 && <p className="mt-4 text-sm text-muted">{sc.ui.noRetro}</p>}
        </div>
        <div className="grid gap-4">
          <div className="card">
            <p className="font-display text-xl">{sm.ui.aspectsTitle}</p>
            {det.aspects.length === 0 ? <p className="mt-3 text-sm text-ivory/85">{sm.ui.noAspects}</p> : (
              <ul className="mt-3 grid gap-3">
                {det.aspects.map((a) => (
                  <li key={a.a + a.b + a.type} className="text-sm leading-relaxed">
                    <p className="text-ivory"><span className="glyph text-gold">{glyph(a.a)}</span> {c.planetNames[a.a]} <span className="text-gold">{ASPECTS.find((x) => x.type === a.type)!.symbol}</span> <span className="glyph text-gold">{glyph(a.b)}</span> {c.planetNames[a.b]} <span className="text-xs text-muted">· {c.aspectNames[a.type]}</span></p>
                    <p className="text-ivory/80">{cap(`${sm.planetThemes[a.a]} + ${sm.planetThemes[a.b]}`, lang)}: {sm.aspectTypes[a.type]}.</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card">
            <p className="font-display text-xl">{sm.ui.eventsTitle}</p>
            <ul className="mt-3 grid gap-2 text-sm">
              {events.map((e) => (
                <li key={e.label} className="flex items-baseline justify-between gap-3">
                  <span className="text-ivory/90"><span className="glyph mr-2 text-gold">{e.icon}</span>{e.label}</span>
                  <span className="text-right text-muted">{formatDate(iso(e.date), lang)} · {sm.ui.inDays(daysBetween(day.date, e.date))}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {showLink && <div className="text-center"><Link to={`/${lang}/moon`} className="btn-ghost">{sc.ui.toCalendar} <span aria-hidden>→</span></Link></div>}
    </div>
  );
}

/** Home page block: a compact summary of the sky today. Lazy-loaded (needs the astronomy engine). */
export default function TodaySection({ lang, day }: { lang: Lang; day: SkyDay }) {
  const sc = getSkyContent(lang), sm = getSkyMore(lang), c = getContent(lang);
  const det = useMemo(() => { const [y, m, d] = day.date.split("-").map(Number); return skyDetails(y, m, d, day); }, [day]);
  const ms = sc.moonSigns[day.moonSign];
  const [ldSymbol] = sm.lunarDays[day.lunarDay - 1];
  return (
    <section className="mx-auto max-w-4xl px-5 sm:px-8">
      <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}>
        <div className="flex items-start gap-5">
          <MoonIcon illumination={day.illumination} phase={day.phase} className="h-16 w-16 flex-none sm:h-20 sm:w-20" />
          <div className="min-w-0">
            <p className="eyebrow">{sc.ui.todayTitle(formatDate(day.date, lang))}</p>
            <p className="mt-2 font-display text-2xl sm:text-3xl">{sc.phases[day.phase].name} · <span className="glyph text-gold">{SIGN_GLYPHS[day.moonSign]}</span> {sc.ui.moonIn(c.signIn[day.moonSign])}</p>
            <p className="mt-1 text-sm text-muted">{sm.ui.lunarDayTitle(day.lunarDay, ldSymbol)} · {ms.mood}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-5 border-t border-gold/10 pt-5 sm:grid-cols-[1.1fr_1fr]">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
            {SPHERES.map((k) => (
              <div key={k} className="flex items-center justify-between gap-2"><span className="text-ivory/85">{sm.ui.sphereNames[k]}</span><Dots n={det.spheres[k]} /></div>
            ))}
          </div>
          <div className="grid gap-1.5 text-sm">
            <p className="text-ivory/90"><span className="text-emerald-300">✓</span> {ms.do[0]}</p>
            <p className="text-ivory/90"><span className="text-rose">✕</span> {ms.avoid[0]}</p>
            <p className="flex items-center gap-2 text-ivory/90">✂ {sc.ui.haircutTitle}: <span className={`rounded-full px-2.5 py-0.5 text-xs ${VERDICT_STYLE[day.haircut]}`}>{sc.ui.verdict[day.haircut]}</span></p>
          </div>
        </div>
        {day.phase === "full" && <div className="mt-6"><FullMoonBanner lang={lang} place="home_today" /></div>}
        <div className="mt-6 text-center sm:text-left">
          <Link to={`/${lang}/moon`} data-track="today_full_click" className="btn-ghost">{sm.ui.fullDay} <span aria-hidden>→</span></Link>
        </div>
      </motion.div>
    </section>
  );
}
