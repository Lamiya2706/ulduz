import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { nearestFullMoon } from "@shared/sky";
import { SIGN_GLYPHS } from "@shared/zodiac";
import { CarpetDivider, Reveal } from "@/components/Decor";
import { useLang } from "@/components/Layout";
import { getContent } from "@/content";
import { getFullMoonContent } from "@/content/fullmoon";
import { formatDate } from "@/lib/date";

const DAY = 86400000;
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const calendarDays = (from: Date, to: Date) => Math.round((new Date(iso(to) + "T12:00").getTime() - new Date(iso(from) + "T12:00").getTime()) / DAY);

type Journal = { gratitude: string; release: string; intent: string };
const EMPTY: Journal = { gratitude: "", release: "", intent: "" };

/** A private notebook for the ritual, kept per Full Moon in this browser only. */
function FullMoonJournal({ storageKey }: { storageKey: string }) {
  const fc = getFullMoonContent(useLang());
  const [j, setJ] = useState<Journal>(() => {
    try { const raw = localStorage.getItem(storageKey); return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY; } catch { return EMPTY; }
  });
  const [burning, setBurning] = useState(false);
  const [released, setReleased] = useState(false);
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(j)); } catch { /* storage unavailable */ } }, [j, storageKey]);
  const set = (k: keyof Journal) => (e: React.ChangeEvent<HTMLTextAreaElement>) => { setReleased(false); setJ({ ...j, [k]: e.target.value }); };
  const release = () => {
    if (!j.release.trim()) return;
    setBurning(true);
    setTimeout(() => { setJ((p) => ({ ...p, release: "" })); setBurning(false); setReleased(true); }, 1600);
  };
  const field = "field min-h-[7.5rem] resize-y leading-relaxed";
  return (
    <div className="card border-gold/30">
      <p className="font-display text-2xl">✦ {fc.ui.journalTitle}</p>
      <p className="mt-2 text-sm text-muted">{fc.ui.journalIntro}</p>
      <div className="mt-6 grid gap-5">
        <label className="label">{fc.ui.gratitudeL}<textarea className={field} value={j.gratitude} onChange={set("gratitude")} placeholder={fc.ui.gratitudePh} /></label>
        <div className="label">
          <span>{fc.ui.releaseJL}</span>
          <div className="relative">
            <motion.textarea aria-label={fc.ui.releaseJL} className={field + " w-full"} value={j.release} onChange={set("release")} placeholder={fc.ui.releasePh} disabled={burning}
              animate={burning ? { opacity: 0, y: -18, filter: "blur(6px)" } : { opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: burning ? 1.5 : 0.3 }} />
            {burning && <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-amber-500/40 via-rose/20 to-transparent" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5 }} />}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <button type="button" className="btn-ghost px-5 py-2 text-sm" data-track="fullmoon_release" onClick={release} disabled={burning || !j.release.trim()}>☾ {fc.ui.releaseBtn}</button>
            <AnimatePresence>{released && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-gold">{fc.ui.releasedMsg}</motion.span>}</AnimatePresence>
          </div>
        </div>
        <label className="label">{fc.ui.intentL}<textarea className={field} value={j.intent} onChange={set("intent")} placeholder={fc.ui.intentPh} /></label>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span>{fc.ui.savedNote}</span>
        <button type="button" className="text-gold hover:text-ivory" onClick={() => { setJ(EMPTY); setReleased(false); }}>{fc.ui.clearBtn}</button>
      </div>
    </div>
  );
}

export default function FullMoonPage() {
  const lang = useLang();
  const fc = getFullMoonContent(lang);
  const c = getContent(lang);
  const [now] = useState(() => new Date());
  const fm = useMemo(() => nearestFullMoon(now), [now]);
  const days = calendarDays(now, fm.date);
  const past = fm.date.getTime() < now.getTime();
  const signIn = c.signIn[fm.sign];
  const headline = days === 0 ? fc.ui.tonight(signIn) : past ? fc.ui.justPassed(signIn) : fc.ui.upcoming(signIn);
  const theme = fc.signs[fm.sign];

  return (
    <div className="mx-auto max-w-4xl px-5 pt-8 sm:px-8 lg:pt-14">
      <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="text-center">
        <p className="eyebrow">{fc.ui.eyebrow}</p>
        <h1 className="mt-4 text-5xl sm:text-6xl">{fc.ui.title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-muted">{fc.ui.intro}</p>
      </motion.header>

      {/* This Full Moon */}
      <section className="card mt-10 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="mx-auto h-28 w-28 rounded-full bg-[radial-gradient(circle_at_38%_35%,#fffaf0,#EFE3C8_45%,#cbb994)] shadow-[0_0_60px_rgba(239,227,200,.45)]" aria-hidden />
        <div className="text-center sm:text-left">
          <p className="font-display text-3xl sm:text-4xl">{headline} <span className="glyph text-gold">{SIGN_GLYPHS[fm.sign]}</span></p>
          <p className="mt-2 text-sm text-muted">{fc.ui.exact(formatDate(iso(fm.date), lang), hhmm(fm.date))}{!past && days > 0 ? ` · ${fc.ui.inDays(days)}` : ""}</p>
          <p className="mt-3 text-sm leading-relaxed text-ivory/80">{fc.ui.windowNote}</p>
        </div>
        <div className="border-t border-gold/10 pt-5 sm:col-span-2">
          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-gold">{fc.ui.themeTitle(signIn)}</p>
          <p className="mt-2 font-display text-xl leading-snug">{theme.theme}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><p className="text-[0.68rem] uppercase tracking-[0.16em] text-rose">✕ {fc.ui.releaseL}</p><p className="mt-2 text-sm leading-relaxed text-ivory/90">{theme.release}</p></div>
            <div><p className="text-[0.68rem] uppercase tracking-[0.16em] text-emerald-300">✓ {fc.ui.callL}</p><p className="mt-2 text-sm leading-relaxed text-ivory/90">{theme.call}</p></div>
          </div>
          <p className="mt-5 rounded-2xl border border-gold/20 bg-gold/[0.06] px-5 py-4 text-center font-display text-xl italic text-ivory">
            <span className="mr-2 not-italic text-[0.62rem] uppercase tracking-[0.16em] text-gold">{fc.ui.affirmL}</span>{lang === "en" ? `“${theme.affirmation}”` : `«${theme.affirmation}»`}
          </p>
        </div>
      </section>

      {/* Ritual */}
      <section className="mt-16">
        <Reveal className="text-center"><h2 className="text-4xl sm:text-5xl">{fc.ui.ritualTitle}</h2><p className="mx-auto mt-4 max-w-2xl text-sm text-muted">{fc.ui.ritualIntro}</p></Reveal>
        <ol className="mt-8 grid gap-3">
          {fc.steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.04}>
              <li className="card flex gap-5 py-5">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-full border border-gold/30 font-display text-xl text-gold">{i + 1}</span>
                <div><p className="font-display text-xl">{s.title}</p><p className="mt-1 text-sm leading-relaxed text-ivory/85">{s.text}</p></div>
              </li>
            </Reveal>
          ))}
        </ol>
        <p className="mt-4 text-center text-xs text-muted">{fc.ui.safety}</p>
      </section>

      <section className="mt-12"><FullMoonJournal storageKey={`ulduz.fullmoon.${iso(fm.date)}`} /></section>

      <CarpetDivider className="my-16" />

      {/* Methods */}
      <section>
        <Reveal className="text-center"><h2 className="text-4xl sm:text-5xl">{fc.ui.methodsTitle}</h2><p className="mx-auto mt-4 max-w-2xl text-sm text-muted">{fc.ui.methodsIntro}</p></Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {fc.methods.map((m, i) => (
            <Reveal key={m.title} delay={(i % 2) * 0.06} className="h-full">
              <div className="card h-full">
                <div className="flex items-center gap-4">
                  <span aria-hidden className="grid h-11 w-11 flex-none place-items-center rounded-full border border-gold/25 font-display text-xl text-gold">{m.icon}</span>
                  <div><p className="font-display text-xl leading-tight">{m.title}</p><p className="mt-1 text-xs text-muted">{fc.ui.whenL}: {m.when}</p></div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ivory/85">{m.text}</p>
                <ul className="mt-4 grid gap-2">{m.steps.map((s) => <li key={s} className="flex gap-3 text-sm text-ivory/90"><span className="text-gold">✦</span>{s}</li>)}</ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Do / avoid */}
      <section className="card mt-12 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-emerald-300">{fc.ui.doTitle}</p>
          <ul className="mt-3 grid gap-2">{fc.do.map((x) => <li key={x} className="flex gap-3 text-sm text-ivory/90"><span className="text-emerald-300">✓</span>{x}</li>)}</ul>
        </div>
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-rose">{fc.ui.avoidTitle}</p>
          <ul className="mt-3 grid gap-2">{fc.avoid.map((x) => <li key={x} className="flex gap-3 text-sm text-ivory/90"><span className="text-rose">✕</span>{x}</li>)}</ul>
        </div>
      </section>

      <div className="mt-10 text-center"><Link to={`/${lang}/moon`} data-track="fullmoon_to_calendar" className="btn-ghost">{fc.ui.toCalendar} <span aria-hidden>→</span></Link></div>
      <p className="mx-auto mt-10 max-w-xl text-center text-xs text-muted/70">{fc.ui.disclaimer}</p>
    </div>
  );
}
