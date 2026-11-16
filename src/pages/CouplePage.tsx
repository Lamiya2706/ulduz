import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useParams } from "react-router-dom";
import { computeChart, PLANETS, SIGN_ELEMENT, signOf, type Chart, type PlanetKey } from "@shared/astro";
import { numerology } from "@shared/numerology";
import { SYN_CATEGORIES, synastry, type SynPoint } from "@shared/synastry";
import { CoupleForm } from "@/components/BirthForm";
import { CarpetDivider, Reveal } from "@/components/Decor";
import { useLang } from "@/components/Layout";
import { getCompat, getContent, type CompatContent, type Content } from "@/content";
import { decodeBirth } from "@/lib/birth";
import { motion } from "framer-motion";

const tier = (v: number) => (v >= 72 ? "high" : v >= 55 ? "mid" : "low") as "high" | "mid" | "low";
const firstName = (n: string) => n.trim().split(/\s+/)[0];
const glyphOf = (p: SynPoint) => (p === "Ascendant" ? "↑" : PLANETS.find((x) => x.key === p)!.glyph);
const pointName = (p: SynPoint, c: Content, cc: CompatContent) => (p === "Ascendant" ? cc.ascendant : c.planetNames[p as PlanetKey]);

export function CoupleFormPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-6xl px-5 pt-8 sm:px-8 lg:pt-14">
      <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">{t("couple.form.eyebrow")}</p>
        <h1 className="mt-5 text-5xl leading-[1.05] sm:text-6xl">{t("couple.form.title1")} <em className="text-gold">{t("couple.form.title2")}</em></h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">{t("couple.form.sub")}</p>
      </motion.header>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 }} className="mt-12"><CoupleForm /></motion.div>
    </div>
  );
}

function Gauge({ value }: { value: number }) {
  const r = 70, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 180 180" className="h-44 w-44" role="img" aria-label={`${value}%`}>
      <circle cx="90" cy="90" r={r} fill="none" stroke="rgba(214,180,124,.12)" strokeWidth="6" />
      <motion.circle cx="90" cy="90" r={r} fill="none" stroke="#D6B47C" strokeWidth="6" strokeLinecap="round" transform="rotate(-90 90 90)"
        strokeDasharray={c} initial={{ strokeDashoffset: c }} whileInView={{ strokeDashoffset: c * (1 - value / 100) }} viewport={{ once: true }} transition={{ duration: 1.8, ease: [0.2, 0.8, 0.2, 1] }} />
      <text x="90" y="96" textAnchor="middle" fontFamily="Cormorant Garamond, Georgia, serif" fontSize="46" fill="#F4EDE2">{value}<tspan fontSize="22" fill="#D6B47C">%</tspan></text>
    </svg>
  );
}

function Section({ id, eyebrow, title, intro, children }: { id: string; eyebrow: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-24 scroll-mt-28">
      <Reveal><p className="eyebrow">{eyebrow}</p><h2 className="mt-3 text-4xl sm:text-[2.6rem]">{title}</h2>{intro && <p className="mt-3 max-w-2xl text-muted">{intro}</p>}</Reveal>
      <div className="mt-7">{children}</div>
    </section>
  );
}

function PersonCard({ name, chart, c }: { name: string; chart: Chart; c: Content }) {
  const asc = chart.angles ? signOf(chart.angles.asc) : null;
  return (
    <div className="card flex-1 text-center">
      <p className="font-display text-3xl">{name}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-muted">
        <span><span className="glyph text-gold">☉︎</span> {c.signNames[chart.pos.Sun.sign]}</span>
        <span><span className="glyph text-gold">☽︎</span> {c.signNames[chart.pos.Moon.sign]}</span>
        {asc !== null && <span><span className="text-gold">↑</span> {c.signNames[asc]}</span>}
        <span><span className="glyph text-gold">♀︎</span> {c.signNames[chart.pos.Venus.sign]}</span>
      </div>
    </div>
  );
}

export function CoupleResultPage() {
  const { a: codeA = "", b: codeB = "" } = useParams();
  const lang = useLang();
  const { t } = useTranslation();
  const c = getContent(lang), cc = getCompat(lang);
  const A = useMemo(() => decodeBirth(codeA), [codeA]);
  const B = useMemo(() => decodeBirth(codeB), [codeB]);
  const data = useMemo(() => {
    if (!A || !B) return null;
    const ca = computeChart(A), cb = computeChart(B);
    const na = numerology(A.fullName, A.date), nb = numerology(B.fullName, B.date);
    return { ca, cb, na, nb, syn: synastry(ca, cb, na.lifePath, nb.lifePath) };
  }, [A, B]);
  if (!A || !B || !data) return <Navigate to={`/${lang}/couple`} replace />;
  const { ca, cb, na, nb, syn } = data;
  const nameA = firstName(A.fullName), nameB = firstName(B.fullName);
  const lockedSections = t("couple.locked.sections", { returnObjects: true }) as string[];
  const navKeys = ["scores", "contacts", "elements", "numbers", ...(syn.overlays ? ["overlays"] : []), "reading"];

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8">
      <header className="pt-8 text-center">
        <p className="eyebrow">{t("couple.result.eyebrow")}</p>
        <h1 className="mt-4 text-5xl sm:text-6xl">{nameA} <span className="text-gold">&</span> {nameB}</h1>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row"><PersonCard name={nameA} chart={ca} c={c} /><PersonCard name={nameB} chart={cb} c={c} /></div>
        <Reveal className="mt-12 flex flex-col items-center">
          <Gauge value={syn.overall} />
          <p className="mt-2 text-[0.7rem] uppercase tracking-[0.18em] text-gold">{t("couple.result.overall")}</p>
          <p className="mt-3 max-w-xl font-display text-2xl italic text-ivory/90">{cc.overall[tier(syn.overall)]}</p>
        </Reveal>
        {(!ca.angles || !cb.angles) && <p className="mx-auto mt-8 max-w-2xl rounded-2xl border border-gold/25 bg-gold/[0.06] px-5 py-4 text-sm text-ivory/85">{t("couple.result.noTimeNote")}</p>}
      </header>

      <nav className="no-print sticky top-0 z-30 -mx-5 mt-12 flex gap-1 overflow-x-auto border-y border-gold/10 bg-night/85 px-5 py-3 backdrop-blur-md [scrollbar-width:none] sm:-mx-8 sm:px-8">
        {navKeys.map((k) => <a key={k} href={`#${k}`} className={`flex-none rounded-full px-3.5 py-1.5 text-xs transition hover:bg-gold/10 hover:text-ivory ${k === "reading" ? "text-gold" : "text-muted"}`}>{t(`couple.result.nav.${k}`)}</a>)}
      </nav>

      <Section id="scores" eyebrow="I" title={t("couple.result.scoresTitle")} intro={t("couple.result.scoresIntro")}>
        <Reveal className="card grid gap-7">
          {SYN_CATEGORIES.map((k) => (
            <div key={k}>
              <div className="flex items-baseline justify-between gap-4"><h3 className="font-display text-xl font-normal">{cc.categories[k].name}</h3><span className="font-display text-2xl text-gold">{syn.scores[k]}%</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <motion.div className="h-1.5 rounded-full bg-gradient-to-r from-rose to-gold" initial={{ width: 0 }} whileInView={{ width: `${syn.scores[k]}%` }} viewport={{ once: true }} transition={{ duration: 1.4 }} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ivory/80">{cc.categories[k][tier(syn.scores[k])]}</p>
            </div>
          ))}
        </Reveal>
      </Section>

      <Section id="contacts" eyebrow={`II · ${t("couple.result.contactsEyebrow")}`} title={t("couple.result.contactsTitle")} intro={t("couple.result.contactsIntro")}>
        <Reveal className="card py-2 sm:py-2">
          {syn.aspects.slice(0, 8).map((x, i) => (
            <div key={i} className="border-b border-gold/10 py-5 last:border-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-lg">{nameA} <span className="glyph text-gold">{glyphOf(x.a)}</span> {pointName(x.a, c, cc)}
                  <span className="glyph mx-2 text-gold">{["☌", "⚹", "□", "△", "☍"][["conjunction", "sextile", "square", "trine", "opposition"].indexOf(x.type)]}</span>
                  {nameB} <span className="glyph text-gold">{glyphOf(x.b)}</span> {pointName(x.b, c, cc)}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[0.68rem] uppercase tracking-wider ${x.flow ? "bg-sage/15 text-sage" : "bg-rose/15 text-rose"}`}>{x.flow ? t("couple.result.flow") : t("couple.result.tension")}</span>
                <span className="text-xs text-muted">{c.aspectNames[x.type]} · {t("couple.result.orb")} {x.orb.toFixed(1)}°</span>
              </div>
              <p className="mt-1.5 leading-relaxed text-ivory/85">{cc.pairs[x.pair]?.[x.flow ? 0 : 1]}</p>
            </div>
          ))}
        </Reveal>
      </Section>

      <Section id="elements" eyebrow={`III · ${t("couple.result.elementsEyebrow")}`} title={t("couple.result.elementsTitle")}>
        <div className="grid gap-4 md:grid-cols-3">
          {([["sun", "Sun", "Sun", syn.elements.sun], ["moon", "Moon", "Moon", syn.elements.moon], ["venusMars", "Venus", "Mars", syn.elements.venusMars]] as const).map(([k, pa, pb, rel], i) => (
            <Reveal key={k} delay={i * 0.08} className="card">
              <p className="text-[0.7rem] uppercase tracking-[0.16em] text-gold">{c.planetNames[pa]} × {c.planetNames[pb]}</p>
              <p className="mt-2 text-sm text-muted">{nameA}: {c.elementNames[SIGN_ELEMENT[ca.pos[pa].sign]]} · {nameB}: {c.elementNames[SIGN_ELEMENT[cb.pos[pb].sign]]}</p>
              <p className="mt-3 leading-relaxed text-ivory/85">{cc.elements[k][rel]}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section id="numbers" eyebrow={`IV · ${t("couple.result.numbersEyebrow")}`} title={t("couple.result.numbersTitle")}>
        <Reveal className="card text-center">
          <div className="flex items-center justify-center gap-8 sm:gap-14">
            {[[nameA, na.lifePath], [nameB, nb.lifePath]].map(([n, v], i) => (
              <div key={i}><div className="font-display text-6xl text-gold">{v}</div><div className="mt-2 font-display text-lg">{c.numbers[v as number][0]}</div><div className="text-xs uppercase tracking-[0.14em] text-muted">{n} · {t("couple.result.lifePath")}</div></div>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-xl leading-relaxed text-ivory/85">{cc.lifePath[syn.lifePath]}</p>
        </Reveal>
      </Section>

      {syn.overlays && (
        <Section id="overlays" eyebrow={`V · ${t("couple.result.overlaysEyebrow")}`} title={t("couple.result.overlaysTitle")} intro={t("couple.result.overlaysIntro")}>
          <div className="grid gap-4 md:grid-cols-2">
            {([[nameA, nameB, syn.overlays.aInB], [nameB, nameA, syn.overlays.bInA]] as const).map(([from, to, map], i) => (
              <Reveal key={i} delay={i * 0.08} className="card">
                <ul className="grid gap-4">
                  {(Object.entries(map) as [SynPoint, number][]).map(([pt, h]) => (
                    <li key={pt}>
                      <p className="text-sm"><span className="text-ivory">{from}</span> · <span className="glyph text-gold">{glyphOf(pt)}</span> {pointName(pt, c, cc)} <span className="text-gold">→</span> <span className="text-ivory">{to}</span> · {c.ordinal(h)}</p>
                      <p className="mt-0.5 text-sm text-muted">{c.houses[h]}</p>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      <CarpetDivider className="mt-24" />

      <section id="reading" className="mt-16 scroll-mt-28">
        <Reveal className="text-center">
          <p className="eyebrow">{t("couple.locked.eyebrow")}</p>
          <h2 className="mt-3 text-4xl sm:text-5xl">{t("couple.locked.title")}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-muted">{t("couple.locked.intro")}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="relative mx-auto mt-10 max-w-2xl">
            <div className="paper paper-text max-h-[560px] overflow-hidden px-8 py-10 sm:px-12" aria-hidden>
              {lockedSections.map((s, i) => (
                <div key={i}><h3>{s}</h3><p className="select-none blur-[5px]">{nameA} & {nameB}, {cc.pairs[syn.aspects[i % Math.max(1, syn.aspects.length)]?.pair ?? "Sun-Moon"]?.[0]}</p></div>
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-end rounded-md bg-gradient-to-t from-night via-night/80 to-transparent pb-10">
              <span data-track="reading_coming_soon" className="rounded-full border border-gold/40 bg-gold/10 px-7 py-3.5 text-base font-medium text-gold">{t("chart.locked.soon")} ✦</span>
              <p className="mt-4 max-w-sm text-center text-xs text-muted">{t("chart.locked.soonNote")}</p>
            </div>
          </div>
        </Reveal>
      </section>

      <div className="no-print mt-16 flex flex-wrap items-center justify-center gap-3">
        <Link to={`/${lang}/chart/${codeA}`} className="btn-ghost">{t("couple.result.openChart", { name: nameA })}</Link>
        <Link to={`/${lang}/chart/${codeB}`} className="btn-ghost">{t("couple.result.openChart", { name: nameB })}</Link>
      </div>
      <p className="mx-auto mt-14 max-w-2xl text-center text-xs leading-relaxed text-muted/70">{t("footer.disclaimer")}</p>

    </div>
  );
}
