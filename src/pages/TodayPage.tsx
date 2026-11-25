import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { computeChart, PLANETS, ASPECTS, type PlanetKey } from "@shared/astro";
import { personalDay, type DailyTransit, type NatalPoint } from "@shared/daily";
import { SPHERES } from "@shared/sky";
import { SIGN_GLYPHS } from "@shared/zodiac";
import { useLang } from "@/components/Layout";
import { MoonIcon } from "@/components/Sky";
import TransitAlerts from "@/components/TransitAlerts";
import { getContent } from "@/content";
import { getDailyContent, type Tone } from "@/content/daily";
import { getSkyMore } from "@/content/sky";
import { useAuth } from "@/lib/auth";
import { encodeBirth, type BirthParams } from "@/lib/birth";
import { formatDate } from "@/lib/date";
import { profileBirth } from "@/lib/profileBirth";

const glyph = (k: PlanetKey) => PLANETS.find((p) => p.key === k)!.glyph;
const pointGlyph = (k: NatalPoint) => (k === "Asc" ? "↑" : glyph(k));
const aspectSymbol = (t: DailyTransit["type"]) => ASPECTS.find((a) => a.type === t)!.symbol;
const tone = (t: DailyTransit): Tone => (t.soft === true ? "soft" : t.soft === false ? "hard" : "conj");
const TONE_STYLE: Record<Tone, string> = { soft: "text-emerald-300", hard: "text-rose", conj: "text-gold" };

function Dots({ n }: { n: number }) {
  return <span className="flex gap-1" aria-hidden>{[1, 2, 3, 4, 5].map((i) => <span key={i} className={`h-2 w-2 rounded-full ${i <= n ? "bg-gold" : "bg-white/10"}`} />)}</span>;
}

function Horoscope({ birth }: { birth: BirthParams }) {
  const lang = useLang();
  const dc = getDailyContent(lang), c = getContent(lang), sm = getSkyMore(lang);
  const [offset, setOffset] = useState(0);
  const chart = useMemo(() => computeChart(birth), [birth]);
  const day = useMemo(() => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    return personalDay(chart, d.getFullYear(), d.getMonth() + 1, d.getDate());
  }, [chart, offset]);
  const house = dc.houses[day.moonHouse - 1];
  const first = birth.fullName.trim().split(/\s+/)[0];
  const pointName = (k: NatalPoint) => (k === "Asc" ? dc.ui.asc : c.planetNames[k]);

  return (
    <>
      <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="text-center">
        <p className="eyebrow">{dc.ui.eyebrow}</p>
        <h1 className="mt-4 text-4xl sm:text-6xl">{first ? dc.ui.titleFor(first) : dc.ui.title}</h1>
        <p className="mt-3 text-sm text-muted">{formatDate(day.date, lang)}</p>
        <div className="mt-5 inline-flex rounded-full border border-gold/25 p-1 text-sm" role="tablist">
          {[dc.ui.today, dc.ui.tomorrow].map((label, i) => (
            <button key={label} type="button" role="tab" aria-selected={offset === i} data-track="today_day_switch" data-track-label={i ? "tomorrow" : "today"}
              onClick={() => setOffset(i)} className={`rounded-full px-5 py-1.5 transition ${offset === i ? "bg-gold text-night" : "text-muted hover:text-ivory"}`}>{label}</button>
          ))}
        </div>
      </motion.header>

      <section className="card mt-10 border-gold/30">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-gold">{dc.ui.overallTitle}</p>
          <Dots n={day.overall} />
        </div>
        <p className="mt-3 font-display text-2xl leading-snug sm:text-3xl">{dc.ui.overall[day.overall - 1]}</p>
      </section>

      <section className="card mt-4 grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
        <MoonIcon illumination={day.sky.illumination} phase={day.sky.phase} className="h-16 w-16 flex-none" />
        <div>
          <p className="text-lg"><span className="glyph text-gold">{SIGN_GLYPHS[day.moonSign]}</span> {dc.ui.moonTitle(c.ordinal(day.moonHouse), c.signIn[day.moonSign])}</p>
          <p className="mt-2 leading-relaxed text-ivory/90">{house.focus}</p>
          <p className="mt-4 text-[0.68rem] uppercase tracking-[0.16em] text-gold">{dc.ui.tipTitle}</p>
          <p className="mt-1.5 leading-relaxed text-ivory/90">{house.tip}</p>
          {day.houseFrom === "sun" && <p className="mt-4 text-xs text-muted">{dc.ui.sunHouses}</p>}
        </div>
      </section>

      <div className="mt-4 grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <section className="card">
          <p className="font-display text-xl">{dc.ui.transitsTitle}</p>
          {day.transits.length ? (
            <>
              <p className="mt-1 text-sm text-muted">{dc.ui.transitsIntro}</p>
              <ul className="mt-4 grid gap-4">
                {day.transits.map((t) => (
                  <li key={`${t.body}-${t.point}-${t.type}`} className="border-t border-gold/10 pt-4 first:border-0 first:pt-0">
                    <p className="text-sm text-ivory">
                      <span className="glyph text-gold">{glyph(t.body)}</span> {c.planetNames[t.body]} <span className={`glyph ${TONE_STYLE[tone(t)]}`}>{aspectSymbol(t.type)}</span> <span className="glyph text-gold">{pointGlyph(t.point)}</span> {pointName(t.point)}
                    </p>
                    <p className="mt-1 text-xs text-muted">{dc.ui.touches}: {dc.points[t.point]}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ivory/90">{dc.bodies[t.body][tone(t)]}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : <p className="mt-3 text-sm leading-relaxed text-ivory/85">{dc.ui.noTransits}</p>}
        </section>
        <section className="card">
          <p className="font-display text-xl">{dc.ui.spheresTitle}</p>
          <div className="mt-4 grid gap-3">
            {SPHERES.map((k) => (
              <div key={k} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ivory/90">{sm.ui.sphereNames[k]}</span>
                <span className="flex items-center gap-3"><span className="text-xs text-muted">{sm.ui.sphereLevels[day.spheres[k] - 1]}</span><Dots n={day.spheres[k]} /></span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <TransitAlerts chart={chart} lang={lang} />

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link to={`/${lang}/chart/${encodeBirth(birth)}`} className="btn-ghost" data-track="today_open_chart">{dc.ui.openChart} <span aria-hidden>→</span></Link>
        <Link to={`/${lang}/account`} className="btn-ghost" data-track="today_change">{dc.ui.change}</Link>
      </div>
    </>
  );
}

/** Shown instead of the horoscope: sign in first, or add birth details to the account. */
function Gate({ signedIn }: { signedIn: boolean }) {
  const lang = useLang();
  const dc = getDailyContent(lang);
  return (
    <>
      <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="text-center">
        <p className="eyebrow">{dc.ui.eyebrow}</p>
        <h1 className="mt-4 text-5xl sm:text-6xl">{dc.ui.title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-muted">{dc.ui.intro}</p>
      </motion.header>
      <section className="card mx-auto mt-10 max-w-xl text-center">
        <p className="font-display text-2xl">{signedIn ? dc.ui.saveTitle : dc.ui.signInTitle}</p>
        <p className="mt-2 text-sm text-muted">{signedIn ? dc.ui.saveText : dc.ui.signInText}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {signedIn
            ? <Link to={`/${lang}/account`} className="btn" data-track="today_add_details">{dc.ui.saveBtn} <span aria-hidden>→</span></Link>
            : <>
              <Link to={`/${lang}/login?mode=signup`} className="btn" data-track="today_signup">{dc.ui.signInBtn} <span aria-hidden>→</span></Link>
              <Link to={`/${lang}/login`} className="btn-ghost" data-track="today_login">{dc.ui.logIn}</Link>
            </>}
        </div>
      </section>
    </>
  );
}

export default function TodayPage() {
  const lang = useLang();
  const dc = getDailyContent(lang);
  const { ready, user, profile, profileLoaded } = useAuth();
  const birth = useMemo(() => profileBirth(profile), [profile]);
  const waiting = !ready || (!!user && !profileLoaded);

  return (
    <div className="mx-auto max-w-4xl px-5 pt-8 sm:px-8 lg:pt-14">
      {waiting ? <div className="h-96" /> : user && birth ? <Horoscope birth={birth} /> : <Gate signedIn={!!user} />}
      <p className="mx-auto mt-10 max-w-xl text-center text-xs text-muted/70">{dc.ui.disclaimer}</p>
    </div>
  );
}
