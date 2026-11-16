import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { decodeNum, encodeNum, fullNumerology, type CoreKey, type FullNumerology } from "@shared/numerology-full";
import { CarpetDivider, Reveal } from "@/components/Decor";
import { useLang } from "@/components/Layout";
import { getContent } from "@/content";
import { getNumContent, type NumContent } from "@/content/numerology";
import { formatDate } from "@/lib/date";
import { track } from "@/lib/analytics";

const CORE: CoreKey[] = ["lifePath", "expression", "soul", "personality", "birthday", "maturity"];
const MASTER = [11, 22, 33];
const lvl = (n: number) => Math.min(n, 3) as 0 | 1 | 2 | 3;
type Nine = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export function NumFormPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const nc = getNumContent(lang);
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErr(t("form.err.name"));
    if (!date || !decodeNum(encodeNum(name, date))) return setErr(t("form.err.date"));
    track("numerology_create");
    nav(`/${lang}/numerology/${encodeNum(name, date)}`);
  };
  return (
    <div className="mx-auto max-w-6xl px-5 pt-8 sm:px-8 lg:pt-14">
      <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">{nc.ui.eyebrow}</p>
        <h1 className="mt-5 text-5xl leading-[1.05] sm:text-6xl">{nc.ui.title1} <em className="text-gold">{nc.ui.title2}</em></h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">{nc.ui.sub}</p>
      </motion.header>
      <motion.form onSubmit={submit} noValidate initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 }} className="card mx-auto mt-12 grid max-w-xl grid-cols-1 gap-5">
        <label className="label">{t("form.name")}
          <input className="field" value={name} onChange={(e) => { setName(e.target.value); setErr(null); }} maxLength={100} placeholder={t("form.namePh")} autoComplete="off" data-field="name" />
          <span className="text-xs text-muted/80">{t("form.nameHint")}</span>
        </label>
        <label className="label">{t("form.date")}
          <input className="field" type="date" min="1900-01-01" max="2099-12-31" value={date} onChange={(e) => { setDate(e.target.value); setErr(null); }} data-field="date" />
        </label>
        <p className="text-xs text-muted/80">{nc.ui.dateOnly}</p>
        {err && <p role="alert" className="text-sm text-rose">{err}</p>}
        <button type="submit" className="btn">{nc.ui.submit} <span aria-hidden>→</span></button>
        <p className="text-center text-xs text-muted/70">{nc.ui.trust}</p>
      </motion.form>
    </div>
  );
}

function Badge({ on, label }: { on: boolean; label: string }) {
  return <span className={`flex-none rounded-full px-3 py-1 text-xs uppercase tracking-[0.12em] ${on ? "bg-rose/15 text-rose" : "bg-gold/15 text-gold"}`}>{label}</span>;
}

function Section({ id, eyebrow, title, intro, children }: { id: string; eyebrow: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-24 scroll-mt-28">
      <Reveal><p className="eyebrow">{eyebrow}</p><h2 className="mt-3 text-4xl sm:text-[2.6rem]">{title}</h2>{intro && <p className="mt-3 max-w-2xl text-muted">{intro}</p>}</Reveal>
      <div className="mt-7">{children}</div>
    </section>
  );
}

function CoreCard({ k, v, nc, i }: { k: CoreKey; v: number; nc: NumContent; i: number }) {
  const [open, setOpen] = useState(false);
  const n = nc.numbers[v];
  const [pos, what] = nc.positions[k];
  return (
    <Reveal delay={(i % 2) * 0.08} className={`card ${MASTER.includes(v) ? "border-gold/40" : ""}`}>
      <div className="flex items-start gap-5">
        <div className="font-display text-6xl leading-none text-gold">{v}</div>
        <div className="min-w-0">
          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-muted">{pos}</p>
          <h3 className="mt-1 font-display text-2xl font-normal">{n.title}</h3>
          <p className="mt-1 text-xs text-muted/80">{what}</p>
        </div>
      </div>
      <p className="mt-4 leading-relaxed text-ivory/90">{n.essence}</p>
      {open && (
        <dl className="mt-4 grid gap-3 border-t border-gold/10 pt-4 text-sm leading-relaxed">
          <div><dt className="text-gold">{nc.ui.loveL}</dt><dd className="text-ivory/85">{n.love}</dd></div>
          <div><dt className="text-gold">{nc.ui.workL}</dt><dd className="text-ivory/85">{n.work}</dd></div>
          <div><dt className="text-gold">{nc.ui.adviceL}</dt><dd className="text-ivory/85">{n.advice}</dd></div>
        </dl>
      )}
      <button type="button" data-track="numerology_expand" data-track-label={k} onClick={() => setOpen(!open)} className="mt-4 text-sm text-gold hover:text-ivory" aria-expanded={open}>{open ? nc.ui.less : nc.ui.more} {open ? "↑" : "↓"}</button>
    </Reveal>
  );
}

function Square({ n, nc }: { n: FullNumerology; nc: NumContent }) {
  const order: Nine[] = [1, 4, 7, 2, 5, 8, 3, 6, 9]; // classic layout: columns 1-2-3, 4-5-6, 7-8-9
  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,20rem)_1fr]">
      <Reveal>
        <div className="grid grid-cols-3 gap-2">
          {order.map((d) => {
            const count = n.square.cells[d];
            return (
              <div key={d} className={`flex aspect-square flex-col items-center justify-center rounded-2xl border p-2 text-center ${count ? "border-gold/30 bg-gold/[0.05]" : "border-gold/10"}`}>
                <span className="font-display text-xl leading-tight text-gold break-all sm:text-2xl">{count ? String(d).repeat(count) : "—"}</span>
                <span className="mt-1 w-full hyphens-auto break-words text-[0.55rem] uppercase leading-tight tracking-[0.04em] text-muted sm:text-[0.62rem] sm:tracking-[0.08em]">{nc.square[d].name}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted">{nc.ui.workingNumbers}: <span className="text-ivory/85">{n.square.working.join(" · ")}</span></p>
      </Reveal>
      <div className="grid gap-3">
        {([1, 2, 3, 4, 5, 6, 7, 8, 9] as Nine[]).map((d) => (
          <Reveal key={d} className="flex gap-4 rounded-2xl border border-gold/10 px-4 py-3">
            <span className="w-12 flex-none font-display text-xl text-gold">{n.square.cells[d] ? String(d).repeat(Math.min(n.square.cells[d], 4)) : nc.ui.empty}</span>
            <p className="text-sm leading-relaxed text-ivory/85"><span className="text-ivory">{nc.square[d].name}.</span> {nc.square[d].levels[lvl(n.square.cells[d])]}</p>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

export function NumResultPage() {
  const { code = "" } = useParams();
  const lang = useLang();
  const nc = getNumContent(lang);
  const c = getContent(lang);
  const input = useMemo(() => decodeNum(code), [code]);
  const n = useMemo(() => (input ? fullNumerology(input.name, input.date) : null), [input]);
  const [copied, setCopied] = useState(false);
  if (!input || !n) return <Navigate to={`/${lang}/numerology`} replace />;

  const navKeys = ["core", "name", "karma", "square", "cycles", "now"] as const;
  const periodNow = n.pinnacles.findIndex((p) => n.age >= p.from && (p.to === null || n.age <= p.to));
  const maxI = Math.max(1, ...n.intensity.slice(1));

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8">
      <header className="pt-8 text-center">
        <p className="eyebrow">{nc.ui.eyebrow}</p>
        <h1 className="mt-4 text-5xl sm:text-6xl">{input.name}</h1>
        <p className="mt-3 text-muted">{formatDate(input.date, lang)}</p>
        <Reveal className="mt-10 flex flex-col items-center">
          <div className="grid h-40 w-40 place-items-center rounded-full border border-gold/30 shadow-glow"><span className="font-display text-7xl text-gold">{n.core.lifePath}</span></div>
          <p className="mt-4 text-[0.7rem] uppercase tracking-[0.18em] text-gold">{nc.positions.lifePath[0]}</p>
          <p className="mt-2 font-display text-3xl italic">{nc.numbers[n.core.lifePath!].title}</p>
        </Reveal>
      </header>

      <nav className="no-print sticky top-0 z-30 -mx-5 mt-12 flex gap-1 overflow-x-auto border-y border-gold/10 bg-night/85 px-5 py-3 backdrop-blur-md [scrollbar-width:none] sm:-mx-8 sm:px-8">
        {navKeys.map((k) => <a key={k} href={`#${k}`} className="flex-none rounded-full px-3.5 py-1.5 text-xs text-muted transition hover:bg-gold/10 hover:text-ivory">{nc.ui.nav[k]}</a>)}
      </nav>

      <Section id="core" eyebrow="I" title={nc.ui.coreTitle} intro={nc.ui.coreIntro}>
        <div className="grid gap-4 md:grid-cols-2">
          {CORE.map((k, i) => (n.core[k] == null ? null : <CoreCard key={k} k={k} v={n.core[k]!} nc={nc} i={i} />))}
        </div>
      </Section>

      <Section id="name" eyebrow="II" title={nc.ui.nameTitle} intro={nc.ui.nameIntro}>
        <Reveal className="card">
          <div className="flex flex-wrap gap-x-8 gap-y-5">
            {n.letters.map((w, wi) => (
              <div key={wi} className="flex flex-wrap gap-1">
                {w.map((l, li) => (
                  <div key={li} className="flex w-9 flex-col items-center rounded-lg border border-gold/10 py-1.5">
                    <span className={`font-display text-xl uppercase ${l.vowel ? "text-gold" : "text-ivory"}`}>{l.ch}</span>
                    <span className="text-xs text-muted">{l.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted">{nc.ui.vowelsNote}</p>
        </Reveal>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Reveal className="card">
            <h3 className="font-display text-xl font-normal">{nc.ui.intensityTitle}</h3>
            <div className="mt-4 grid gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                <div key={d} className="flex items-center gap-3 text-sm">
                  <span className="w-4 text-gold">{d}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                    <motion.div className="h-1.5 rounded-full bg-gradient-to-r from-rose to-gold" initial={{ width: 0 }} whileInView={{ width: `${(n.intensity[d] / maxI) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1.1 }} />
                  </div>
                  <span className="w-5 text-right text-muted">{n.intensity[d]}</span>
                </div>
              ))}
            </div>
          </Reveal>
          {n.passion.length > 0 && (
            <Reveal delay={0.08} className="card border-gold/30">
              <p className="text-[0.68rem] uppercase tracking-[0.16em] text-muted">{nc.ui.passionTitle}</p>
              <div className="mt-2 font-display text-5xl text-gold">{n.passion.join(" · ")}</div>
              <p className="mt-2 font-display text-xl">{n.passion.map((p) => nc.numbers[p].title).join(" · ")}</p>
              <p className="mt-3 text-sm leading-relaxed text-ivory/85">{nc.ui.passionText(n.passion.join(", "))}</p>
            </Reveal>
          )}
        </div>
      </Section>

      <Section id="karma" eyebrow="III" title={nc.ui.karmaTitle} intro={nc.ui.karmaIntro}>
        <div className="grid gap-4 md:grid-cols-2">
          <Reveal className="card">
            <div className="flex items-center justify-between gap-3"><h3 className="font-display text-2xl font-normal">{nc.ui.debtTitle}</h3><Badge on={n.debts.length > 0} label={n.debts.length ? `${nc.ui.yes} · ${[...new Set(n.debts.map((d) => d.debt))].join(", ")}` : nc.ui.no} /></div>
            {n.debts.length === 0 ? <p className="mt-3 text-sm text-ivory/85">{nc.ui.noDebt}</p> : (
              <ul className="mt-3 grid gap-4">
                {[...new Set(n.debts.map((d) => d.debt))].map((debt) => (
                  <li key={debt} className="text-sm leading-relaxed">
                    <p className="text-ivory/90">{nc.debts[debt as 13 | 14 | 16 | 19]}</p>
                    <p className="mt-1 text-xs text-muted">{nc.ui.debtIn(n.debts.filter((d) => d.debt === debt).map((d) => nc.positions[d.key][0]).join(", "))}</p>
                  </li>
                ))}
              </ul>
            )}
          </Reveal>
          <Reveal delay={0.08} className="card">
            <div className="flex items-center justify-between gap-3"><h3 className="font-display text-2xl font-normal">{nc.ui.lessonsTitle}</h3><Badge on={n.lessons.length > 0} label={n.lessons.length ? `${nc.ui.missing} · ${n.lessons.join(", ")}` : nc.ui.no} /></div>
            {n.lessons.length === 0 ? <p className="mt-3 text-sm text-ivory/85">{nc.ui.noLessons}</p> : (
              <ul className="mt-3 grid gap-3">{n.lessons.map((l) => <li key={l} className="flex gap-3 text-sm leading-relaxed text-ivory/90"><span className="text-gold">✦</span>{nc.lessons[l as Nine]}</li>)}</ul>
            )}
          </Reveal>
        </div>
      </Section>

      <Section id="square" eyebrow="IV" title={nc.ui.squareTitle} intro={nc.ui.squareIntro}>
        <Square n={n} nc={nc} />
      </Section>

      <Section id="cycles" eyebrow="V" title={nc.ui.cyclesTitle} intro={nc.ui.cyclesIntro}>
        <ol className="relative grid gap-4 border-l border-gold/20 pl-6">
          {n.pinnacles.map((p, i) => {
            const ch = n.challenges[i];
            const now = i === periodNow;
            return (
              <Reveal key={i} className={`card relative ${now ? "border-gold/45" : ""}`}>
                <span aria-hidden className={`absolute -left-[1.95rem] top-8 h-3 w-3 rounded-full ${now ? "bg-gold" : "border border-gold/50 bg-night"}`} />
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-display text-xl">{nc.ui.ages(p.from, p.to)}</span>
                  {now && <span className="rounded-full bg-gold px-2.5 py-0.5 text-[0.65rem] uppercase tracking-[0.14em] text-night">{nc.ui.nowBadge}</span>}
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[0.68rem] uppercase tracking-[0.16em] text-muted">{nc.ui.pinnacles} · <span className="text-gold">{p.value}</span></p>
                    <p className="mt-1 text-sm leading-relaxed text-ivory/90"><span className="text-ivory">{nc.numbers[p.value].title}.</span> {nc.numbers[p.value].pinnacle}</p>
                  </div>
                  <div>
                    <p className="text-[0.68rem] uppercase tracking-[0.16em] text-muted">{nc.ui.challenges} · <span className="text-rose">{ch.value}</span></p>
                    <p className="mt-1 text-sm leading-relaxed text-ivory/90">{nc.challenges[ch.value as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8]}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </Section>

      <Section id="now" eyebrow="VI" title={nc.ui.nowTitle}>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: nc.ui.yearL(n.year), v: n.personalYear, text: c.personalYear[n.personalYear] },
            { label: nc.ui.monthL, v: n.personalMonth, text: nc.months[n.personalMonth as Nine] },
            { label: nc.ui.dayL, v: n.personalDay, text: nc.days[n.personalDay as Nine] },
          ].map((x, i) => (
            <Reveal key={x.label} delay={i * 0.06} className={`card text-center ${i === 0 ? "border-gold/35" : ""}`}>
              <div className="font-display text-6xl leading-none text-gold">{x.v}</div>
              <p className="mt-3 text-[0.68rem] uppercase tracking-[0.16em] text-muted">{x.label}</p>
              <p className="mt-3 text-sm leading-relaxed text-ivory/85">{x.text}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      <CarpetDivider className="mt-24" />
      <Reveal className="mt-14 text-center">
        <h2 className="text-4xl">{nc.ui.ctaTitle}</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted">{nc.ui.ctaText}</p>
        <Link to={`/${lang}#start`} className="btn mt-8">{nc.ui.ctaBtn} <span aria-hidden>→</span></Link>
      </Reveal>
      <div className="no-print mt-12 flex flex-wrap justify-center gap-3">
        <button className="btn-ghost" data-track="share_link" data-track-type="numerology" onClick={async () => { try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* ignore */ } }}>
          {copied ? nc.ui.copied : nc.ui.copy}
        </button>
        <Link to={`/${lang}/numerology`} className="btn-ghost">{nc.ui.another}</Link>
      </div>
      <p className="mx-auto mt-10 max-w-xl text-center text-xs text-muted/70">{nc.ui.disclaimer}</p>
    </div>
  );
}
