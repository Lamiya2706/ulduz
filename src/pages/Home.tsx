import { motion } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";
import type { SkyDay } from "@shared/sky";
import type { Lang } from "@/i18n";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useLang } from "@/components/Layout";
import BirthForm from "@/components/BirthForm";
import { CarpetDivider, HeroWheel, Reveal } from "@/components/Decor";
import { Markdown } from "@/lib/md";
import { useAuth } from "@/lib/auth";
import { encodeBirth } from "@/lib/birth";
import { profileBirth } from "@/lib/profileBirth";

type Step = { t: string; d: string };
type QA = { q: string; a: string };

const TodaySection = lazy(() => import("@/components/Sky"));
function TodayBlock({ lang }: { lang: Lang }) {
  const [day, setDay] = useState<SkyDay | null>(null);
  useEffect(() => {
    let alive = true;
    import("@shared/sky").then(({ skyDay }) => { const d = new Date(); if (alive) setDay(skyDay(d.getFullYear(), d.getMonth() + 1, d.getDate())); });
    return () => { alive = false; };
  }, []);
  if (!day) return <div className="mx-auto h-72 max-w-4xl" />;
  return <Suspense fallback={<div className="mx-auto h-72 max-w-4xl" />}><TodaySection lang={lang} day={day} /></Suspense>;
}

/** The tools that open up after sign-in. Their pages stay public by URL (and in the footer) for search engines. */
const TOOLS = [
  { to: "today", icon: "☉", key: "daily" },
  { to: "moon", icon: "☾", key: "sky" },
  { to: "full-moon", icon: "○", key: "fullmoon" },
  { to: "year", icon: "✦", key: "year" },
  { to: "numerology", icon: "9", key: "numerology" },
  { to: "couple", icon: "♡", key: "couple" },
];

function ToolTiles() {
  const { t } = useTranslation();
  const lang = useLang();
  const { profile } = useAuth();
  const saved = profileBirth(profile);
  // With a saved birth moment, the chart card opens straight from here.
  const tools = saved ? [...TOOLS.slice(0, 1), { to: `chart/${encodeBirth(saved)}?share=1`, icon: "✧", key: "chart.share" }, ...TOOLS.slice(1)] : TOOLS;
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
      {tools.map((x, i) => (
        <Reveal key={x.to} delay={i * 0.08} className="h-full">
          <Link to={`/${lang}/${x.to}`} data-track="explore_tile" data-track-label={x.key} className="card group flex h-full flex-col transition hover:border-gold/40">
            <span aria-hidden className="grid h-12 w-12 place-items-center rounded-full border border-gold/25 font-display text-2xl text-gold">{x.icon}</span>
            <p className="mt-5 text-[0.68rem] uppercase tracking-[0.16em] text-muted">{t(`${x.key}.teaser.eyebrow`)}</p>
            <h3 className="mt-2 font-display text-2xl font-normal">{t(`${x.key}.teaser.title`)}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{t(`${x.key}.teaser.text`)}</p>
            <span className="mt-5 text-sm text-gold transition group-hover:text-ivory">{t(`${x.key}.teaser.cta`)} →</span>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}

/** Home for signed-in people: their chart, today's sky and every tool. */
function SignedInHome() {
  const { t } = useTranslation();
  const lang = useLang();
  const { profile, profileLoaded } = useAuth();
  const saved = profileBirth(profile);
  const name = (profile?.full_name || "").trim().split(/\s+/)[0];
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pt-8 sm:px-8 lg:pt-14">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}>
          <p className="eyebrow">{t("auth.home.eyebrow")}</p>
          <h1 className="mt-4 text-5xl sm:text-6xl">{name ? t("auth.account.title", { name }) : t("auth.account.titleNoName")}</h1>
          <p className="mt-4 max-w-xl text-lg text-muted">{t("auth.home.sub")}</p>
        </motion.div>
        {profileLoaded && (
          <div className="card mt-10 flex flex-wrap items-center justify-between gap-5 border-gold/30 bg-gradient-to-br from-gold/[0.08] to-transparent">
            <div>
              <h2 className="text-3xl">{saved ? t("auth.home.chartTitle") : t("auth.account.welcomeTitle")}</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{saved ? t("auth.home.chartText") : t("auth.account.welcomeText")}</p>
            </div>
            {saved
              ? <Link to={`/${lang}/chart/${encodeBirth(saved)}`} className="btn" data-track="home_open_chart">{t("auth.account.openChart")} <span aria-hidden>→</span></Link>
              : <Link to={`/${lang}/account`} className="btn" data-track="home_add_birth">{t("auth.home.addBirth")} <span aria-hidden>→</span></Link>}
          </div>
        )}
      </section>

      <div className="mt-14"><TodayBlock lang={lang} /></div>

      <section className="mx-auto mt-20 max-w-6xl px-5 sm:px-8">
        <Reveal><p className="eyebrow">Ulduz</p><h2 className="mt-3 text-4xl sm:text-5xl">{t("sky.exploreTitle")}</h2></Reveal>
        <ToolTiles />
      </section>
    </>
  );
}

export default function Home() {
  const { ready, user } = useAuth();
  if (!ready) return <div className="min-h-screen" />;
  return user ? <SignedInHome /> : <Landing />;
}

/** Landing page for visitors: hero + free chart, how it works, a sample, FAQ and sign-up. */
function Landing() {
  const { t } = useTranslation();
  const lang = useLang();
  const steps = t("how.steps", { returnObjects: true }) as Step[];
  const faq = t("faq.items", { returnObjects: true }) as QA[];
  const sample = (t("sample.text", { returnObjects: true }) as string[]).join("\n\n");
  const [openQ, setOpenQ] = useState<number | null>(0);

  return (
    <>
      {/* HERO */}
      <section className="relative mx-auto max-w-6xl px-5 pb-10 pt-8 sm:px-8 lg:pt-16">
        <div className="pointer-events-none absolute -right-40 top-0 w-[620px] opacity-60 max-lg:left-1/2 max-lg:-translate-x-1/2 max-lg:opacity-25 lg:-right-24 lg:top-6 lg:w-[560px]">
          <HeroWheel />
        </div>
        <div className="relative grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-start">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }} className="pt-4 lg:pt-10">
            <p className="eyebrow">{t("hero.eyebrow")}</p>
            <h1 className="mt-6 text-[2.9rem] leading-[1.02] sm:text-6xl lg:text-[4.6rem]">
              {t("hero.title1")}<br /><em className="text-gold">{t("hero.title2")}</em>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted">{t("hero.sub")}</p>
          </motion.div>
          <motion.div id="start" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.25, ease: [0.2, 0.8, 0.2, 1] }} className="scroll-mt-24 lg:mt-6">
            <BirthForm />
          </motion.div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 sm:px-8">
        <Reveal><p className="eyebrow">{t("how.eyebrow")}</p><h2 className="mt-3 text-4xl sm:text-5xl">{t("how.title")}</h2></Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={i} delay={i * 0.12} className="card">
              <span className="font-display text-5xl italic text-gold/80">{["I", "II", "III"][i]}</span>
              <h3 className="mt-4 text-2xl">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* SAMPLE */}
      <section className="mx-auto mt-28 max-w-4xl px-5 sm:px-8">
        <Reveal className="text-center"><p className="eyebrow">{t("sample.eyebrow")}</p><h2 className="mt-3 text-4xl sm:text-5xl">{t("sample.title")}</h2></Reveal>
        <Reveal delay={0.15}>
          <div className="paper paper-text mx-auto mt-10 max-w-2xl -rotate-[0.4deg] px-8 py-10 sm:px-12 sm:py-14">
            <Markdown text={sample} />
          </div>
        </Reveal>
      </section>

      <div className="mx-auto max-w-6xl px-5 sm:px-8"><CarpetDivider className="my-20" /></div>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 sm:px-8">
        <Reveal><p className="eyebrow">{t("faq.eyebrow")}</p><h2 className="mt-3 text-4xl sm:text-5xl">{t("faq.title")}</h2></Reveal>
        <div className="mt-8 divide-y divide-gold/10 border-y border-gold/10">
          {faq.map((f, i) => (
            <div key={i}>
              <button className="flex w-full items-center justify-between gap-6 py-5 text-left" aria-expanded={openQ === i} onClick={() => setOpenQ(openQ === i ? null : i)}>
                <span className="font-display text-xl">{f.q}</span>
                <span className={`text-gold transition ${openQ === i ? "rotate-45" : ""}`} aria-hidden>+</span>
              </button>
              <motion.div initial={false} animate={{ height: openQ === i ? "auto" : 0, opacity: openQ === i ? 1 : 0 }} className="overflow-hidden">
                <p className="pb-6 text-sm leading-relaxed text-muted">{f.a}</p>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL */}
      <section className="mx-auto mt-28 max-w-3xl px-5 text-center sm:px-8">
        <Reveal>
          <h2 className="text-4xl italic sm:text-5xl">{t("final.title")}</h2>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted">{t("auth.home.joinText")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to={`/${lang}/login?mode=signup`} className="btn" data-track="landing_signup">{t("auth.home.join")} <span aria-hidden>→</span></Link>
            <a href="#start" className="btn-ghost">{t("final.cta")}</a>
          </div>
        </Reveal>
      </section>
    </>
  );
}
