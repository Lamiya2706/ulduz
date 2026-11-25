import { useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { computeChart, PLANETS, ASPECTS, type PlanetKey } from "@shared/astro";
import { personalDay, type DailyTransit, type NatalPoint } from "@shared/daily";
import { SPHERES } from "@shared/sky";
import { SIGN_GLYPHS } from "@shared/zodiac";
import { emptyPerson, PersonFields, personToBirth, useCityLabel, type PersonState } from "@/components/BirthForm";
import { useLang } from "@/components/Layout";
import { MoonIcon } from "@/components/Sky";
import { getContent } from "@/content";
import { getDailyContent, type Tone } from "@/content/daily";
import { getSkyMore } from "@/content/sky";
import { track } from "@/lib/analytics";
import { useAuth } from "@/lib/auth";
import { decodeBirth, encodeBirth, type BirthParams } from "@/lib/birth";
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

function Horoscope({ birth, own }: { birth: BirthParams; own: boolean }) {
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

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to={`/${lang}/chart/${encodeBirth(birth)}`} className="btn-ghost" data-track="today_open_chart">{dc.ui.openChart} <span aria-hidden>→</span></Link>
        <Link to={own ? `/${lang}/account` : `/${lang}/today?edit=1`} className="btn-ghost" data-track="today_change">{dc.ui.change}</Link>
      </div>
    </>
  );
}

function DailyForm({ signedIn }: { signedIn: boolean }) {
  const lang = useLang();
  const dc = getDailyContent(lang);
  const label = useCityLabel();
  const nav = useNavigate();
  const [p, setP] = useState<PersonState>(emptyPerson);
  const [err, setErr] = useState("");
  const { t } = useTranslation();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = personToBirth(p, label);
    if ("error" in r) return setErr(t(r.error));
    track("today_create", { has_time: !!r.time });
    nav(`/${lang}/today/${encodeBirth(r)}`);
  };
  return (
    <>
      <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="text-center">
        <p className="eyebrow">{dc.ui.eyebrow}</p>
        <h1 className="mt-4 text-5xl sm:text-6xl">{dc.ui.title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-muted">{dc.ui.intro}</p>
      </motion.header>
      {signedIn ? (
        <section className="card mx-auto mt-10 max-w-xl text-center">
          <p className="font-display text-2xl">{dc.ui.saveTitle}</p>
          <p className="mt-2 text-sm text-muted">{dc.ui.saveText}</p>
          <Link to={`/${lang}/account`} className="btn mt-5" data-track="today_add_details">{dc.ui.saveBtn} <span aria-hidden>→</span></Link>
        </section>
      ) : (
        <>
          <form onSubmit={submit} noValidate className="card mx-auto mt-10 grid max-w-xl gap-5">
            <div><p className="font-display text-2xl">{dc.ui.formTitle}</p><p className="mt-1 text-sm text-muted">{dc.ui.formText}</p></div>
            <PersonFields value={p} onChange={(v) => { setP(v); setErr(""); }} idPrefix="today" />
            {err && <p role="alert" className="text-sm text-rose">{err}</p>}
            <button type="submit" className="btn justify-self-start">{dc.ui.formBtn} <span aria-hidden>→</span></button>
          </form>
          <section className="mx-auto mt-4 flex max-w-xl flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold/25 bg-gold/[0.06] px-5 py-4">
            <div><p className="text-ivory">{dc.ui.signInTitle}</p><p className="text-sm text-muted">{dc.ui.signInText}</p></div>
            <Link to={`/${lang}/login?mode=signup`} className="btn-ghost" data-track="today_signup">{dc.ui.signInBtn}</Link>
          </section>
        </>
      )}
    </>
  );
}

export default function TodayPage() {
  const { code } = useParams();
  const lang = useLang();
  const dc = getDailyContent(lang);
  const { ready, user, profile, profileLoaded } = useAuth();
  const [params] = useSearchParams();
  const editing = params.get("edit") === "1";
  const fromCode = useMemo(() => (code ? decodeBirth(code) : null), [code]);
  const own = profileBirth(profile);
  const birth = fromCode ?? (editing ? null : own);
  const waiting = !fromCode && !editing && (!ready || (user && !profileLoaded));

  return (
    <div className="mx-auto max-w-4xl px-5 pt-8 sm:px-8 lg:pt-14">
      {waiting ? <div className="h-96" /> : birth ? <Horoscope birth={birth} own={!fromCode && !!own} /> : <DailyForm signedIn={!!user && !editing} />}
      <p className="mx-auto mt-10 max-w-xl text-center text-xs text-muted/70">{dc.ui.disclaimer}</p>
    </div>
  );
}
