import { useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { yearForecast, type SlowPlanet } from "@shared/year";
import { SIGN_GLYPHS } from "@shared/zodiac";
import { Reveal } from "@/components/Decor";
import { useLang } from "@/components/Layout";
import { getContent } from "@/content";
import { getNumContent } from "@/content/numerology";
import { getYearContent } from "@/content/year";
import { track } from "@/lib/analytics";
import { formatDayMonth, monthName } from "@/lib/date";

const PLANET_GLYPH: Record<SlowPlanet, string> = { Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇" };
const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && +s.slice(0, 4) >= 1900 && +s.slice(0, 4) <= 2100;

export function YearFormPage() {
  const lang = useLang();
  const yc = getYearContent(lang);
  const nav = useNavigate();
  const [date, setDate] = useState("");
  const [err, setErr] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!validDate(date)) return setErr(true);
    track("year_create");
    nav(`/${lang}/year/${date}`);
  };
  return (
    <div className="mx-auto max-w-6xl px-5 pt-8 sm:px-8 lg:pt-14">
      <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">{yc.ui.eyebrow}</p>
        <h1 className="mt-5 text-5xl leading-[1.05] sm:text-6xl">{yc.ui.title1} <em className="text-gold">{yc.ui.title2}</em></h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">{yc.ui.sub}</p>
      </motion.header>
      <motion.form onSubmit={submit} noValidate initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 }} className="card mx-auto mt-12 grid max-w-xl grid-cols-1 gap-5">
        <label className="label">{yc.ui.date}
          <input className="field" type="date" min="1900-01-01" max="2100-12-31" value={date} onChange={(e) => { setDate(e.target.value); setErr(false); }} data-field="date" />
        </label>
        <p className="hint">{yc.ui.hint}</p>
        {err && <p role="alert" className="text-sm text-rose">—</p>}
        <button type="submit" className="btn">{yc.ui.submit} <span aria-hidden>→</span></button>
      </motion.form>
    </div>
  );
}

export function YearResultPage() {
  const { date = "" } = useParams();
  const lang = useLang();
  const yc = getYearContent(lang), c = getContent(lang), nc = getNumContent(lang);
  const nowYear = new Date().getFullYear();
  const nowMonth = new Date().getMonth() + 1;
  const [year, setYear] = useState(nowYear);
  const [copied, setCopied] = useState(false);
  const data = useMemo(() => (validDate(date) ? yearForecast(date, year) : null), [date, year]);
  if (!validDate(date)) return <Navigate to={`/${lang}/year`} replace />;
  const f = data!;
  const yt = yc.years[f.personalYear as 1];
  const isThisYear = year === nowYear;
  const navKeys = ["year", "months", "transits", "sky"] as const;

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8">
      <header className="pt-8 text-center">
        <p className="eyebrow">{yc.ui.eyebrow}</p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <button type="button" aria-label="−" onClick={() => setYear((y) => Math.max(1900, y - 1))} className="grid h-10 w-10 place-items-center rounded-full text-gold hover:bg-gold/10">←</button>
          <h1 className="min-w-[5ch] text-5xl sm:text-6xl">{year}</h1>
          <button type="button" aria-label="+" onClick={() => setYear((y) => Math.min(2100, y + 1))} className="grid h-10 w-10 place-items-center rounded-full text-gold hover:bg-gold/10">→</button>
        </div>
        <p className="mt-2 text-muted">{yc.ui.age(f.age)}</p>
      </header>

      <nav className="no-print sticky top-0 z-30 -mx-5 mt-10 flex gap-1 overflow-x-auto border-y border-gold/10 bg-night/85 px-5 py-3 backdrop-blur-md [scrollbar-width:none] sm:-mx-8 sm:px-8">
        {navKeys.map((k) => <a key={k} href={`#${k}`} className="flex-none rounded-full px-3.5 py-1.5 text-xs text-muted transition hover:bg-gold/10 hover:text-ivory">{yc.ui.nav[k]}</a>)}
      </nav>

      <section id="year" className="mt-16 scroll-mt-28">
        <Reveal className="card border-gold/30 text-center">
          <div className="font-display text-7xl leading-none text-gold">{f.personalYear}</div>
          <p className="mt-3 text-[0.7rem] uppercase tracking-[0.18em] text-gold">{yc.ui.personalYear}</p>
          <h2 className="mt-2 font-display text-3xl">{yt.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-ivory/90">{yt.theme}</p>
          <dl className="mx-auto mt-6 grid max-w-2xl gap-3 text-left text-sm leading-relaxed sm:grid-cols-3">
            <div><dt className="text-gold">{yc.ui.loveL}</dt><dd className="mt-1 text-ivory/85">{yt.love}</dd></div>
            <div><dt className="text-gold">{yc.ui.workL}</dt><dd className="mt-1 text-ivory/85">{yt.work}</dd></div>
            <div><dt className="text-gold">{yc.ui.adviceL}</dt><dd className="mt-1 text-ivory/85">{yt.advice}</dd></div>
          </dl>
        </Reveal>
      </section>

      <section id="months" className="mt-16 scroll-mt-28">
        <Reveal><h2 className="text-4xl sm:text-[2.6rem]">{yc.ui.monthsTitle}</h2><p className="mt-3 max-w-2xl text-muted">{yc.ui.monthsIntro}</p></Reveal>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {f.months.map((num, i) => {
            const m = i + 1;
            const now = isThisYear && m === nowMonth;
            return (
              <Reveal key={m} delay={(i % 3) * 0.05} className={`card ${now ? "border-gold/45" : ""}`}>
                <div className="flex items-center justify-between">
                  <p className="font-display text-xl capitalize">{monthName(m, lang)}</p>
                  <div className="flex items-center gap-2">
                    {now && <span className="rounded-full bg-gold px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.12em] text-night">{yc.ui.nowBadge}</span>}
                    <span className="font-display text-2xl text-gold">{num}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ivory/80">{nc.months[num as 1]}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section id="transits" className="mt-16 scroll-mt-28">
        <Reveal><h2 className="text-4xl sm:text-[2.6rem]">{yc.ui.transitsTitle}</h2><p className="mt-3 max-w-2xl text-muted">{yc.ui.transitsIntro(c.signNames[f.sunSign])}</p></Reveal>
        <div className="mt-7 grid gap-4">
          {f.transits.length === 0 ? <Reveal className="card"><p className="text-ivory/85">{yc.ui.noTransits}</p></Reveal> : f.transits.map((t, i) => (
            <Reveal key={t.planet + t.type} delay={i * 0.05} className="card">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="glyph text-2xl text-gold">{PLANET_GLYPH[t.planet]}</span>
                <span className="font-display text-xl">{c.planetNames[t.planet]}</span>
                <span className="text-sm text-muted">· {c.aspectNames[t.type]} · {yc.ui.period(monthName(t.from, lang), monthName(t.to, lang))}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ivory/85">{yc.transits[t.planet][t.kind]}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="sky" className="mt-16 scroll-mt-28">
        <Reveal><h2 className="text-4xl sm:text-[2.6rem]">{yc.ui.skyTitle}</h2><p className="mt-3 max-w-2xl text-muted">{yc.ui.skyIntro}</p></Reveal>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <Reveal className="card">
            <p className="font-display text-xl">℞ {yc.ui.retroTitle}</p>
            <ul className="mt-4 grid gap-3">
              {f.retro.map((r, i) => (
                <li key={i} className="text-sm leading-relaxed">
                  <p className="text-ivory"><span className="glyph text-gold">{{ Mercury: "☿", Venus: "♀", Mars: "♂" }[r.planet]}</span> {c.planetNames[r.planet]} <span className="text-muted">· {formatDayMonth(r.from, lang)} – {formatDayMonth(r.to, lang)}</span></p>
                  <p className="text-ivory/75">{yc.retroNotes[r.planet]}</p>
                </li>
              ))}
            </ul>
          </Reveal>
          <div className="grid gap-4">
            <Reveal className="card">
              <p className="font-display text-xl">◍ {yc.ui.eclipsesTitle}</p>
              {f.eclipses.length === 0 ? <p className="mt-3 text-sm text-ivory/85">{yc.ui.noEclipses}</p> : (
                <ul className="mt-4 grid gap-2 text-sm">
                  {f.eclipses.map((e, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-3">
                      <span className="text-ivory/90"><span className="glyph mr-1.5 text-gold">{SIGN_GLYPHS[e.sign]}</span>{e.solar ? yc.ui.solar(c.signNames[e.sign]) : yc.ui.lunar(c.signNames[e.sign])}</span>
                      <span className="text-right text-muted">{formatDayMonth(e.date, lang)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs leading-relaxed text-muted">{yc.ui.eclipseNote}</p>
            </Reveal>
            {f.ingresses.length > 0 && (
              <Reveal className="card">
                <p className="font-display text-xl">{yc.ui.ingressTitle}</p>
                <ul className="mt-4 grid gap-2 text-sm">
                  {f.ingresses.map((g, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-3">
                      <span className="text-ivory/90"><span className="glyph mr-1.5 text-gold">{PLANET_GLYPH[g.planet]}</span>{yc.ui.enters(c.planetNames[g.planet], c.signNames[g.sign])}</span>
                      <span className="text-right text-muted">{formatDayMonth(g.date, lang)}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      <div className="no-print mt-14 flex flex-wrap justify-center gap-3">
        <button className="btn-ghost" data-track="share_link" data-track-type="year" onClick={async () => { try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* ignore */ } }}>
          {copied ? yc.ui.copied : yc.ui.copy}
        </button>
        <Link to={`/${lang}/year`} className="btn-ghost">{yc.ui.another}</Link>
        <Link to={`/${lang}#start`} className="btn-ghost">{yc.ui.toChart}</Link>
      </div>
      <p className="mx-auto mt-10 max-w-xl text-center text-xs text-muted/70">{yc.ui.disclaimer}</p>
    </div>
  );
}

