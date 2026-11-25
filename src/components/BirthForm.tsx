import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { encodeBirth, type BirthParams } from "@/lib/birth";
import { countryName, loadCities, searchCities, type City } from "@/lib/cities";
import { useLang } from "./Layout";
import { track } from "@/lib/analytics";

const ALL_ZONES: string[] = (() => { try { return Intl.supportedValuesOf("timeZone"); } catch { return ["Asia/Baku", "Europe/Istanbul", "Europe/Moscow", "Europe/London", "UTC"]; } })();
const DEFAULT_TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Baku"; } catch { return "Asia/Baku"; } })();

export interface PersonState {
  name: string; date: string; time: string; noTime: boolean;
  q: string; city: City | null; manual: boolean; lat: string; lon: string; tz: string;
}
export const emptyPerson = (): PersonState => ({ name: "", date: "", time: "", noTime: false, q: "", city: null, manual: false, lat: "", lon: "", tz: DEFAULT_TZ });

/** Validates a person's fields. Returns birth params, or an i18n error key. */
export function personToBirth(p: PersonState, cityLabel: (c: City) => string): BirthParams | { error: string } {
  if (!p.name.trim()) return { error: "form.err.name" };
  if (!p.date) return { error: "form.err.date" };
  const hasTime = !p.noTime && !!p.time;
  let place: { lat: number; lon: number; tz: string; label: string } | null = null;
  if (p.manual) {
    const la = parseFloat(p.lat), lo = parseFloat(p.lon);
    if (isNaN(la) || isNaN(lo) || Math.abs(la) > 66 || Math.abs(lo) > 180) return { error: "form.err.coords" };
    place = { lat: la, lon: lo, tz: p.tz, label: p.q.trim() || `${la.toFixed(2)}, ${lo.toFixed(2)}` };
  } else if (p.city) {
    place = { lat: p.city.lat, lon: p.city.lon, tz: p.city.tz, label: cityLabel(p.city) };
  }
  if (hasTime && !place) return { error: "form.err.place" };
  return { fullName: p.name.trim(), date: p.date, time: hasTime ? p.time : null, lat: place?.lat ?? null, lon: place?.lon ?? null, tz: place?.tz ?? "UTC", place: place?.label ?? null };
}

export function useCityLabel() {
  const lang = useLang();
  return (c: City) => (c.country ? `${c.name}, ${countryName(c.country, lang)}` : c.name);
}

/** The fields for one person (name, date, time, birthplace). Controlled. */
export function PersonFields({ value: p, onChange, idPrefix }: { value: PersonState; onChange: (p: PersonState) => void; idPrefix: string }) {
  const { t } = useTranslation();
  const lang = useLang();
  const label = useCityLabel();
  const [cities, setCities] = useState<City[]>([]);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const set = (patch: Partial<PersonState>) => onChange({ ...p, ...patch });

  useEffect(() => { loadCities().then(setCities).catch(() => setCities([])); }, []);
  const results = useMemo(() => (p.city && p.q === label(p.city) ? [] : searchCities(cities, p.q)), [cities, p.q, p.city]); // eslint-disable-line react-hooks/exhaustive-deps
  const pick = (c: City) => { set({ city: c, q: label(c), manual: false }); setOpen(false); };
  const listId = `${idPrefix}-place-list`;

  return (
    <div className="grid gap-5">
      <label className="label">{t("form.name")}
        <input className="field" value={p.name} onChange={(e) => set({ name: e.target.value })} maxLength={100} placeholder={t("form.namePh")} autoComplete="off" data-field="name" />
        <span className="hint">{t("form.nameHint")}</span>
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="label">{t("form.date")}
          <input className="field" type="date" min="1900-01-01" max="2099-12-31" value={p.date} onChange={(e) => set({ date: e.target.value })} data-field="date" />
        </label>
        <label className="label">{t("form.time")}
          <input className="field disabled:opacity-40" type="time" value={p.time} disabled={p.noTime} onChange={(e) => set({ time: e.target.value })} data-field="time" />
        </label>
      </div>
      <label className="-mt-1 flex cursor-pointer items-center gap-2.5 text-sm text-muted">
        <input type="checkbox" className="h-4 w-4 accent-[#D6B47C]" checked={p.noTime} onChange={(e) => set({ noTime: e.target.checked })} /> {t("form.noTime")}
      </label>
      <div className="label relative">
        <label htmlFor={`${idPrefix}-place`}>{t("form.place")}</label>
        <input id={`${idPrefix}-place`} className="field" value={p.q} placeholder={t("form.placePh")} autoComplete="off" role="combobox" aria-expanded={open && results.length > 0} aria-controls={listId} data-field="place"
          onChange={(e) => { set({ q: e.target.value, city: null }); setOpen(true); setHi(0); }}
          onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (!open || !results.length) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, results.length)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
            if (e.key === "Enter") { e.preventDefault(); if (hi < results.length) pick(results[hi]); else { set({ manual: true }); setOpen(false); } }
          }} />
        {open && p.q.trim().length >= 2 && (
          <ul id={listId} role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-xl border border-gold/20 bg-night-2/95 p-1 shadow-glow backdrop-blur">
            {results.map((c, i) => (
              <li key={`${c.name}-${c.country}-${c.lat}`} role="option" aria-selected={i === hi}
                onMouseDown={(e) => { e.preventDefault(); pick(c); }} onMouseEnter={() => setHi(i)}
                className={`cursor-pointer rounded-lg px-3 py-2 text-sm ${i === hi ? "bg-gold/10 text-ivory" : "text-muted"}`}>
                <span className="text-ivory">{c.name}</span>, {countryName(c.country, lang)}
              </li>
            ))}
            <li role="option" aria-selected={hi === results.length} onMouseDown={(e) => { e.preventDefault(); set({ manual: true, city: null }); setOpen(false); }}
              className={`cursor-pointer rounded-lg px-3 py-2 text-sm text-gold ${hi === results.length ? "bg-gold/10" : ""}`}>{t("form.other")}</li>
          </ul>
        )}
        <span className="hint">{t("form.placeHint")}</span>
      </div>
      {p.manual && (
        <div className="grid gap-4 rounded-2xl border border-dashed border-gold/20 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="label">{t("form.lat")}<input className="field" type="number" step="0.01" value={p.lat} onChange={(e) => set({ lat: e.target.value })} placeholder="40.41" /></label>
            <label className="label">{t("form.lon")}<input className="field" type="number" step="0.01" value={p.lon} onChange={(e) => set({ lon: e.target.value })} placeholder="49.87" /></label>
          </div>
          <label className="label">{t("form.tz")}
            <select className="field" value={p.tz} onChange={(e) => set({ tz: e.target.value })}>{ALL_ZONES.map((z) => <option key={z} value={z} className="bg-night">{z}</option>)}</select>
          </label>
          <span className="hint">{t("form.coordsHint")}</span>
        </div>
      )}
    </div>
  );
}

/** Single-person form (home page). */
export default function BirthForm() {
  const { t } = useTranslation();
  const lang = useLang();
  const nav = useNavigate();
  const label = useCityLabel();
  const [p, setP] = useState(emptyPerson);
  const [err, setErr] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = personToBirth(p, label);
    if ("error" in r) return setErr(t(r.error));
    track("chart_create", { has_time: !!r.time, has_place: !!r.place });
    nav(`/${lang}/chart/${encodeBirth(r)}`);
  }
  return (
    <form onSubmit={submit} noValidate className="card grid gap-5 bg-night-2/85 backdrop-blur-md sm:p-9">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl text-ivory">{t("form.title")}</h2>
        <span className="eyebrow hidden sm:inline">✦</span>
      </div>
      <PersonFields value={p} onChange={(v) => { setP(v); setErr(""); }} idPrefix="me" />
      <p role="alert" className="min-h-[1.25rem] text-sm text-rose">{err}</p>
      <button type="submit" className="btn w-full sm:w-auto sm:justify-self-start">{t("form.submit")} <span aria-hidden>→</span></button>
    </form>
  );
}

/** Two-person form (compatibility page). */
export function CoupleForm() {
  const { t } = useTranslation();
  const lang = useLang();
  const nav = useNavigate();
  const label = useCityLabel();
  const [a, setA] = useState(emptyPerson);
  const [b, setB] = useState(emptyPerson);
  const [err, setErr] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const ra = personToBirth(a, label);
    if ("error" in ra) return setErr(`${t("couple.form.first")}: ${t(ra.error)}`);
    const rb = personToBirth(b, label);
    if ("error" in rb) return setErr(`${t("couple.form.second")}: ${t(rb.error)}`);
    track("couple_create", { has_time: !!(ra.time && rb.time) });
    nav(`/${lang}/couple/${encodeBirth(ra)}/${encodeBirth(rb)}`);
  }
  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        {([[a, setA, "first", "p1"], [b, setB, "second", "p2"]] as const).map(([v, set, key, id]) => (
          <fieldset key={id} className="card grid gap-5 bg-night-2/85 backdrop-blur-md sm:p-8" data-person={id}>
            <legend className="sr-only">{t(`couple.form.${key}`)}</legend>
            <div className="flex items-center gap-3"><span className="font-display text-3xl italic text-gold">{id === "p1" ? "I" : "II"}</span><h2 className="text-2xl">{t(`couple.form.${key}`)}</h2></div>
            <PersonFields value={v} onChange={(x) => { set(x); setErr(""); }} idPrefix={id} />
          </fieldset>
        ))}
      </div>
      <p role="alert" className="min-h-[1.25rem] text-center text-sm text-rose">{err}</p>
      <button type="submit" className="btn justify-self-center px-9">{t("couple.form.submit")} <span aria-hidden>→</span></button>
    </form>
  );
}
