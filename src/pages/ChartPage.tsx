import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  attachment, computeChart, dominantElement, dominantModality, fmtDeg, isHard, isSoft, jungianType, pairKey,
  PLANETS, SIGN_ELEMENT, SIGN_MODALITY, signOf, weakElement, type Aspect, type Chart, type PlanetKey,
} from "@shared/astro";
import { numerology } from "@shared/numerology";
import { encodeNum } from "@shared/numerology-full";
import ChartWheel from "@/components/ChartWheel";
import ShareCard from "@/components/ShareCard";
import { CarpetDivider, Reveal } from "@/components/Decor";
import { useLang } from "@/components/Layout";
import { getContent, type Content } from "@/content";
import { decodeBirth } from "@/lib/birth";
import { formatDate } from "@/lib/date";

const EL_COLOR = { Fire: "#D6B47C", Earth: "#8FAE96", Air: "#9FB3D1", Water: "#B79CC9" } as const;

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-24 scroll-mt-28">
      <Reveal><p className="eyebrow">{eyebrow}</p><h2 className="mb-7 mt-3 text-4xl sm:text-[2.6rem]">{title}</h2></Reveal>
      {children}
    </section>
  );
}
function Card({ sub, title, children, className = "" }: { sub?: string; title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Reveal className={`card ${className}`}>
      {sub && <p className="mb-2 text-[0.7rem] uppercase tracking-[0.16em] text-gold">{sub}</p>}
      {title && <h3 className="mb-3 text-[1.75rem] leading-tight">{title}</h3>}
      <div className="grid gap-3 leading-relaxed text-ivory/90">{children}</div>
    </Reveal>
  );
}
function Bar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="grid grid-cols-[92px_1fr_42px] items-center gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
        <Reveal><div className="h-1.5 rounded-full transition-[width] duration-[1400ms]" style={{ width: `${Math.max(3, pct)}%`, background: color }} /></Reveal>
      </div>
      <span className="text-right text-muted">{pct}%</span>
    </div>
  );
}

function aspectSentence(a: Aspect, c: Content) {
  const sp = (isSoft(a.type) && c.specialSoft[pairKey(a.a, a.b)]) || c.special[pairKey(a.a, a.b)];
  return `${c.tpl.aspectLine(c.planetDomain[a.a], c.planetDomain[a.b], c.aspectText[a.type])}${sp ? " " + sp : ""}`;
}
const specialFor = (a: Aspect, c: Content) => (isSoft(a.type) && c.specialSoft[pairKey(a.a, a.b)]) || c.special[pairKey(a.a, a.b)] || null;

export default function ChartPage() {
  const { code } = useParams();
  const lang = useLang();
  const { t } = useTranslation();
  const c = getContent(lang);
  const input = useMemo(() => (code ? decodeBirth(code) : null), [code]);
  const chart = useMemo<Chart | null>(() => (input ? computeChart(input) : null), [input]);
  const nm = useMemo(() => (input ? numerology(input.fullName, input.date) : null), [input]);
  const [copied, setCopied] = useState(false);
  if (!input || !chart || !nm) return <Navigate to={`/${lang}`} replace />;

  const p = chart.pos, sun = p.Sun.sign, moon = p.Moon.sign;
  const asc = chart.angles ? signOf(chart.angles.asc) : null, mc = chart.angles ? signOf(chart.angles.mc) : null;
  const S = c.signs;
  const code4 = jungianType(chart);
  const [aName, aText] = c.archetypes[code4];
  const att = c.attachment[attachment(chart)];
  const domEl = dominantElement(chart), lowEl = weakElement(chart), domMo = dominantModality(chart);
  const node = p.Node.sign, opp = (node + 6) % 12;
  const dsc = asc !== null ? (asc + 6) % 12 : null;
  const first = input.fullName.trim().split(/\s+/)[0];
  const keyAsp = chart.aspects.filter((a) => !(a.a === "Node" || a.b === "Node") || a.type === "conjunction").slice(0, 6);
  const loveAsp = chart.aspects.filter((a) => (["Venus", "Moon"].includes(a.a) || ["Venus", "Moon"].includes(a.b)) && specialFor(a, c)).slice(0, 2);
  const inHouse = (h: number) => PLANETS.filter((x) => x.key !== "Node" && p[x.key].house === h).map((x) => c.planetNames[x.key]);
  const soft = chart.aspects.find((a) => isSoft(a.type) && a.a !== "Node" && a.b !== "Node");
  const hard = chart.aspects.find((a) => isHard(a.type) && a.a !== "Node" && a.b !== "Node");
  const lp = c.numbers[nm.lifePath];
  const houseLine = (k: PlanetKey) => (p[k].house ? " " + c.tpl.houseLine(c.ordinal(p[k].house!), c.houses[p[k].house!]) : "");
  const dateStr = formatDate(input.date, lang);

  const planetRow = (k: PlanetKey, text: string) => {
    const P0 = PLANETS.find((x) => x.key === k)!, ps = p[k];
    return (
      <div key={k} className="grid grid-cols-[28px_1fr] gap-3 border-b border-gold/10 py-5 last:border-0 sm:grid-cols-[44px_1fr] sm:gap-4">
        <span className="glyph pt-0.5 text-center text-xl text-gold sm:text-2xl">{P0.glyph}</span>
        <div>
          <h3 className="font-display text-xl font-normal">{c.planetNames[k]} {c.signIn[ps.sign]}
            <span className="block font-sans text-xs text-muted sm:ml-2 sm:inline">{fmtDeg(ps.lon)}{ps.retro ? ` · ${t("chart.planets.retrograde")}` : ""}{ps.house ? ` · ${c.ordinal(ps.house)} ${t("chart.planets.house")}` : ""}{ps.dignity ? ` · ${c.dignityNames[ps.dignity]}` : ""}</span>
          </h3>
          <p className="mt-1.5 leading-relaxed text-ivory/85">{text}{houseLine(k)}{ps.retro && c.retro[k] ? " " + c.retro[k] : ""}</p>
        </div>
      </div>
    );
  };

  const navItems = ["core", "planets", "temper", "aspects", "love", "attach", "calling", "numbers", "light", "reading"] as const;
  const gifts = [S[sun].shine, c.tpl.giftElement(c.elementText[domEl].gift), c.tpl.giftsJupiter(S[p.Jupiter.sign].grow),
    soft ? c.tpl.giftSoft(c.planetDomain[soft.a], c.planetDomain[soft.b]) : null, c.tpl.giftLifePath(nm.lifePath, lp[1])].filter(Boolean) as string[];
  const shadows = [c.tpl.shadowSun(S[sun].shadow), S[moon].stress, c.tpl.shadowSaturn(S[p.Saturn.sign].lesson),
    hard ? c.tpl.shadowHard(c.planetDomain[hard.a], c.planetDomain[hard.b]) : null, c.tpl.shadowLifePath(lp[0], lp[2])].filter(Boolean) as string[];
  const posKeys = ["lifePath", "expression", "soul", "personality", "birthday"] as const;
  const lockedSections = t("chart.locked.sections", { returnObjects: true }) as string[];

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8">
      {/* HEADER */}
      <header className="pt-8 text-center">
        <p className="eyebrow">{t("chart.eyebrow")}</p>
        <h1 className="mt-4 text-5xl sm:text-6xl">{input.fullName}</h1>
        <p className="mt-3 text-sm text-muted">{dateStr} · {input.time ?? t("chart.timeUnknown")}{input.place ? ` · ${input.place}` : ""}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
          <Chip glyph="☉">{c.planetNames.Sun} <b>{c.signNames[sun]}</b></Chip>
          <Chip glyph="☽">{c.planetNames.Moon} <b>{c.signNames[moon]}</b>{chart.moonAlt !== null ? "*" : ""}</Chip>
          {asc !== null && <Chip glyph="↑">{t("chart.rising")} <b>{c.signNames[asc]}</b></Chip>}
          <Chip>{t("chart.lifePathChip")} <b>{nm.lifePath}</b></Chip>
          <Chip>{t("chart.typeChip")} <b>{code4}</b></Chip>
        </div>
        {(!chart.timeKnown || chart.moonAlt !== null) && (
          <p className="mx-auto mt-6 max-w-2xl rounded-2xl border border-gold/25 bg-gold/[0.06] px-5 py-4 text-sm text-ivory/85">
            {!chart.timeKnown && t("chart.noTimeNotice")} {chart.moonAlt !== null && c.tpl.moonAlt(c.signNames[moon], c.signNames[chart.moonAlt])}
          </p>
        )}
      </header>
      <div className="mt-8"><ChartWheel chart={chart} content={c} noonLabel={t("chart.noonChart")} /></div>

      <nav className="no-print sticky top-0 z-30 -mx-5 mt-10 flex gap-1 overflow-x-auto border-y border-gold/10 bg-night/85 px-5 py-3 backdrop-blur-md [scrollbar-width:none] sm:-mx-8 sm:px-8">
        {navItems.map((k) => (
          <a key={k} href={`#${k}`} className={`flex-none rounded-full px-3.5 py-1.5 text-xs transition hover:bg-gold/10 hover:text-ivory ${k === "reading" ? "text-gold" : "text-muted"}`}>{t(`chart.nav.${k}`)}</a>
        ))}
      </nav>

      {/* I. CORE */}
      <Section id="core" eyebrow={t("chart.core.eyebrow")} title={t("chart.core.title")}>
        <div className="grid gap-4">
          <Card sub={t("chart.core.sunSub", { sign: c.signIn[sun] })} title={t("chart.core.sunTitle", { sign: c.signNames[sun] })}>
            <p>{S[sun].core} {S[sun].shine}{houseLine("Sun")}</p>
            <p className="text-sm text-muted">{t("chart.core.sunNote", { sign: c.signNames[sun], mode: c.modalityNames[SIGN_MODALITY[sun]].toLowerCase(), element: c.elementNames[SIGN_ELEMENT[sun]].toLowerCase() })}</p>
          </Card>
          <Card sub={t("chart.core.moonSub", { sign: c.signIn[moon] })} title={t("chart.core.moonTitle", { sign: c.signNames[moon] })}>
            <p>{S[moon].need} {S[moon].stress}{houseLine("Moon")}</p>
            <p className="text-sm text-muted">{t("chart.core.moonNote")}</p>
          </Card>
          <Card sub={t("chart.core.risingSub")} title={asc !== null ? <>{t("chart.core.risingTitle", { sign: c.signNames[asc] })} <span className="font-sans text-sm text-muted">{fmtDeg(chart.angles!.asc)}</span></> : t("chart.core.risingHiddenTitle")}>
            {asc !== null ? <>
              <p>{S[asc].first} {t("chart.core.risingNote")}</p>
              <p className="text-sm text-muted">{asc === sun ? c.tpl.risingSame : c.tpl.risingDiff(c.signNames[asc], c.signNames[sun])}</p>
            </> : <p>{t("chart.core.risingHidden")}</p>}
          </Card>
        </div>
      </Section>

      {/* II. PLANETS */}
      <Section id="planets" eyebrow={t("chart.planets.eyebrow")} title={t("chart.planets.title")}>
        <Reveal className="card py-2 sm:py-2">
          {planetRow("Mercury", S[p.Mercury.sign].mind)}
          {planetRow("Venus", S[p.Venus.sign].love)}
          {planetRow("Mars", S[p.Mars.sign].drive)}
          {planetRow("Jupiter", c.tpl.jupiter(S[p.Jupiter.sign].grow))}
          {planetRow("Saturn", c.tpl.saturn(S[p.Saturn.sign].lesson))}
          {planetRow("Node", c.tpl.node(S[node].grow, S[opp].grow))}
        </Reveal>
        <Reveal className="card mt-4 py-2 sm:py-2">
          <p className="pt-5 text-[0.7rem] uppercase tracking-[0.16em] text-gold">{t("chart.planets.generational")}</p>
          {(["Uranus", "Neptune", "Pluto"] as const).map((k) => planetRow(k, c.tpl.outerLine(c.outer[k], S[p[k].sign].grow, !!p[k].house)))}
        </Reveal>
      </Section>

      {/* III. TEMPERAMENT */}
      <Section id="temper" eyebrow={t("chart.temper.eyebrow")} title={t("chart.temper.title")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card sub={t("chart.temper.elements")}>
            <div className="grid gap-3">{(["Fire", "Earth", "Air", "Water"] as const).map((e) => <Bar key={e} label={c.elementNames[e]} pct={chart.elements[e]} color={EL_COLOR[e]} />)}</div>
            <p className="mt-2">{c.elementText[domEl].dom}</p>
            {lowEl && <p className="text-sm text-muted">{c.elementText[lowEl].low}</p>}
          </Card>
          <Card sub={t("chart.temper.modalities")}>
            <div className="grid gap-3">{(["Cardinal", "Fixed", "Mutable"] as const).map((m) => <Bar key={m} label={c.modalityNames[m]} pct={chart.modalities[m]} color="#C98B84" />)}</div>
            <p className="mt-2">{c.modalityText[domMo]}</p>
          </Card>
        </div>
        <Card className="mt-4" sub={t("chart.temper.typeSub", { code: code4 })} title={aName}>
          <p>{aText}</p><p className="text-sm text-muted">{t("chart.temper.typeNote")}</p>
        </Card>
      </Section>

      {/* IV. ASPECTS */}
      <Section id="aspects" eyebrow={t("chart.aspects.eyebrow")} title={t("chart.aspects.title")}>
        <p className="-mt-3 mb-6 text-muted">{t("chart.aspects.intro")}</p>
        <Reveal className="card py-2 sm:py-2">
          {keyAsp.length ? keyAsp.map((a, i) => {
            const cls = a.type === "conjunction" ? "bg-gold/15 text-gold" : isSoft(a.type) ? "bg-sage/15 text-sage" : "bg-rose/15 text-rose";
            return (
              <div key={i} className="border-b border-gold/10 py-5 last:border-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-lg">{c.planetNames[a.a]} <span className="glyph text-gold">{["☌", "⚹", "□", "△", "☍"][["conjunction", "sextile", "square", "trine", "opposition"].indexOf(a.type)]}</span> {c.planetNames[a.b]}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[0.68rem] uppercase tracking-wider ${cls}`}>{c.aspectNames[a.type]}</span>
                  <span className="text-xs text-muted">{t("chart.aspects.orb")} {a.orb.toFixed(1)}°</span>
                </div>
                <p className="mt-1.5 leading-relaxed text-ivory/85">{aspectSentence(a, c)}</p>
              </div>
            );
          }) : <p className="py-5">{t("chart.aspects.none")}</p>}
        </Reveal>
      </Section>

      {/* V. LOVE */}
      <Section id="love" eyebrow={t("chart.love.eyebrow")} title={t("chart.love.title")}>
        <div className="grid gap-4">
          <Card sub={t("chart.love.venus", { sign: c.signIn[p.Venus.sign] })}><p>{S[p.Venus.sign].love}</p></Card>
          <Card sub={t("chart.love.mars", { sign: c.signIn[p.Mars.sign] })}>
            <p>{S[p.Mars.sign].drive} {SIGN_ELEMENT[p.Venus.sign] === SIGN_ELEMENT[p.Mars.sign] ? c.tpl.elementsShared : c.tpl.elementsDiffer}</p>
          </Card>
          <Card sub={dsc !== null ? t("chart.love.drawnDsc", { sign: c.signIn[dsc] }) : t("chart.love.drawn")}>
            <p>{dsc !== null ? c.tpl.descendant(c.signNames[dsc], S[dsc].partner) : c.tpl.drawnTo(S[p.Venus.sign].partner)}{inHouse(7).length ? ` (${inHouse(7).join(", ")} · ${c.ordinal(7)})` : ""}</p>
            {loveAsp.map((a, i) => <p key={i}>{specialFor(a, c)}</p>)}
          </Card>
          <Card sub={t("chart.love.know")}>
            <ul className="grid gap-2.5">{[S[moon].need, S[moon].stress, S[p.Venus.sign].love, att.need].map((x, i) => <li key={i} className="flex gap-3"><span className="text-gold">✦</span><span>{x}</span></li>)}</ul>
          </Card>
        </div>
      </Section>

      {/* VI. ATTACHMENT */}
      <Section id="attach" eyebrow={t("chart.attach.eyebrow")} title={t("chart.attach.title")}>
        <Card className="border-l-2 border-l-gold" title={att.name}>
          <p>{att.sum}</p>
          <dl className="mt-2 grid gap-4 sm:grid-cols-3">
            {([["need", att.need], ["trig", att.trig], ["grow", att.grow]] as const).map(([k, v]) => (
              <div key={k}><dt className="text-[0.68rem] uppercase tracking-[0.14em] text-muted">{t(`chart.attach.${k}`)}</dt><dd className="mt-1 text-sm">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-muted">{t("chart.attach.note")}</p>
        </Card>
      </Section>

      {/* VII. CALLING */}
      <Section id="calling" eyebrow={t("chart.calling.eyebrow")} title={t("chart.calling.title")}>
        <Card sub={mc !== null ? t("chart.calling.mcSub", { sign: c.signIn[mc] }) : t("chart.calling.noMcSub")}>
          <p>{mc !== null ? c.tpl.mc(c.signNames[mc], S[mc].shine) : c.tpl.noMc(S[sun].shine, S[p.Saturn.sign].grow)}{inHouse(10).length ? ` (${inHouse(10).join(", ")} · ${c.ordinal(10)})` : ""}</p>
          <p>{c.tpl.careerGrow(S[p.Jupiter.sign].grow, c.signNames[node], S[node].grow)}</p>
          <p>{c.tpl.lifePathEcho(nm.lifePath, lp[1])}</p>
        </Card>
      </Section>

      {/* VIII. NUMBERS */}
      <Section id="numbers" eyebrow={t("chart.numbers.eyebrow")} title={t("chart.numbers.title")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posKeys.map((k, i) => {
            const v = nm[k]; if (v == null) return null;
            const [title, themes] = c.numbers[v];
            const [pos, why] = t(`chart.numbers.pos.${k}`, { returnObjects: true }) as [string, string];
            return (
              <Reveal key={k} delay={i * 0.06} className="card text-center">
                <div className="font-display text-6xl leading-none text-gold">{v}</div>
                <div className="mt-3 font-display text-xl">{title}</div>
                <div className="mt-1 text-[0.68rem] uppercase tracking-[0.16em] text-muted">{pos}</div>
                <p className="mt-3 text-sm leading-relaxed text-ivory/80">{c.tpl.numberCard(why, themes)}</p>
              </Reveal>
            );
          })}
          <Reveal delay={0.3} className="card border-gold/35 text-center">
            <div className="font-display text-6xl leading-none text-gold">{nm.personalYear}</div>
            <div className="mt-3 font-display text-xl">{t("chart.numbers.personalYear", { year: nm.year })}</div>
            <div className="mt-1 text-[0.68rem] uppercase tracking-[0.16em] text-muted">{t("chart.numbers.yearTheme")}</div>
            <p className="mt-3 text-sm leading-relaxed text-ivory/80">{c.personalYear[nm.personalYear]}</p>
          </Reveal>
        </div>
        <div className="mt-6 text-center"><Link to={`/${lang}/numerology/${encodeNum(input.fullName, input.date)}`} className="btn-ghost">{t("numerology.fromChart")} <span aria-hidden>→</span></Link></div>
      </Section>

      {/* IX. LIGHT & SHADOW */}
      <Section id="light" eyebrow={t("chart.light.eyebrow")} title={t("chart.light.title")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card sub={t("chart.light.strengths")}><ul className="grid gap-3">{gifts.map((g, i) => <li key={i} className="flex gap-3"><span className="text-gold">✦</span><span>{g}</span></li>)}</ul></Card>
          <Card sub={t("chart.light.edges")}><ul className="grid gap-3">{shadows.map((g, i) => <li key={i} className="flex gap-3"><span className="text-rose">◐</span><span>{g}</span></li>)}</ul></Card>
        </div>
      </Section>

      <CarpetDivider className="mt-24" />

      {/* X. LOCKED READING */}
      <section id="reading" className="mt-16 scroll-mt-28">
        <Reveal className="text-center">
          <p className="eyebrow">{t("chart.locked.eyebrow")}</p>
          <h2 className="mt-3 text-4xl sm:text-5xl">{t("chart.locked.title")}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-muted">{t("chart.locked.intro")}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="relative mx-auto mt-10 max-w-2xl">
            <div className="paper paper-text max-h-[560px] overflow-hidden px-8 py-10 sm:px-12" aria-hidden>
              {lockedSections.map((s, i) => (
                <div key={i}>
                  <h3>{s}</h3>
                  <p className="select-none blur-[5px]">{first}, {S[[sun, moon, p.Venus.sign, sun, p.Saturn.sign, mc ?? sun, sun, sun, moon][i]].core}</p>
                </div>
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
        <ShareCard chart={chart} content={c} name={input.fullName} lifePath={nm.lifePath} />
        <button className="btn-ghost" data-track="share_link" data-track-type="chart" onClick={async () => { try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* ignore */ } }}>
          {copied ? t("chart.actions.copied") : t("chart.actions.copy")}
        </button>
        <Link to={`/${lang}#start`} className="btn-ghost">{t("chart.actions.another")}</Link>
      </div>
      <p className="mx-auto mt-14 max-w-2xl text-center text-xs leading-relaxed text-muted/70">{t("footer.disclaimer")}</p>

    </div>
  );
}

function Chip({ glyph, children }: { glyph?: string; children: ReactNode }) {
  return (
    <span className="rounded-full border border-gold/20 bg-white/[0.03] px-4 py-1.5 text-ivory/90 [&_b]:font-medium [&_b]:text-gold">
      {glyph && <span className="glyph mr-1.5 text-gold">{glyph}</span>}{children}
    </span>
  );
}
