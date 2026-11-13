import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { encodeBirth } from "@/lib/birth";
import { countryName, loadCities, searchCities, type City } from "@/lib/cities";
import { useLang } from "./Layout";

const ALL_ZONES: string[] = (() => { try { return Intl.supportedValuesOf("timeZone"); } catch { return ["Asia/Baku", "Europe/Istanbul", "Europe/Moscow", "Europe/London", "UTC"]; } })();

export default function BirthForm({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const lang = useLang();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [noTime, setNoTime] = useState(false);
  const [q, setQ] = useState("");
  const [city, setCity] = useState<City | null>(null);
  const [manual, setManual] = useState(false);
  const [lat, setLat] = useState(""), [lon, setLon] = useState("");
  const [tz, setTz] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Baku");
  const [cities, setCities] = useState<City[]>([]);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const [err, setErr] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadCities().then(setCities).catch(() => setCities([])); }, []);
  const results = useMemo(() => (city && q === label(city) ? [] : searchCities(cities, q)), [cities, q, city]);
  function label(c: City) { return `${c.name}, ${countryName(c.country, lang)}`; }

  function pick(c: City) { setCity(c); setQ(label(c)); setOpen(false); setManual(false); setErr(""); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!name.trim()) return setErr(t("form.err.name"));
    if (!date) return setErr(t("form.err.date"));
    const hasTime = !noTime && !!time;
    let place: { lat: number; lon: number; tz: string; label: string } | null = null;
    if (manual) {
      const la = parseFloat(lat), lo = parseFloat(lon);
      if (isNaN(la) || isNaN(lo) || Math.abs(la) > 66 || Math.abs(lo) > 180) return setErr(t("form.err.coords"));
      place = { lat: la, lon: lo, tz, label: q.trim() || `${la.toFixed(2)}, ${lo.toFixed(2)}` };
    } else if (city) {
      place = { lat: city.lat, lon: city.lon, tz: city.tz, label: label(city) };
    }
    if (hasTime && !place) return setErr(t("form.err.place"));
    const code = encodeBirth({ fullName: name.trim(), date, time: hasTime ? time : null, lat: place?.lat ?? null, lon: place?.lon ?? null, tz: place?.tz ?? "UTC", place: place?.label ?? null });
    nav(`/${lang}/chart/${code}`);
  }

  return (
    <form onSubmit={submit} noValidate className={`card grid gap-5 bg-night-2/85 backdrop-blur-md ${compact ? "" : "sm:p-9"}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl text-ivory">{t("form.title")}</h2>
        <span className="eyebrow hidden sm:inline">✦</span>
      </div>
      <label className="label">{t("form.name")}
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder={t("form.namePh")} autoComplete="name" />
        <span className="hint">{t("form.nameHint")}</span>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="label">{t("form.date")}
          <input className="field" type="date" min="1900-01-01" max="2099-12-31" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="label">{t("form.time")}
          <input className="field disabled:opacity-40" type="time" value={time} disabled={noTime} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>
      <label className="-mt-1 flex cursor-pointer items-center gap-2.5 text-sm text-muted">
        <input type="checkbox" className="h-4 w-4 accent-[#D6B47C]" checked={noTime} onChange={(e) => setNoTime(e.target.checked)} /> {t("form.noTime")}
      </label>
      <div className="label relative" ref={boxRef}>
        <label htmlFor="place">{t("form.place")}</label>
        <input id="place" className="field" value={q} placeholder={t("form.placePh")} autoComplete="off" role="combobox" aria-expanded={open && results.length > 0} aria-controls="place-list"
          onChange={(e) => { setQ(e.target.value); setCity(null); setOpen(true); setHi(0); }}
          onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (!open || !results.length) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, results.length)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
            if (e.key === "Enter") { e.preventDefault(); if (hi < results.length) pick(results[hi]); else { setManual(true); setOpen(false); } }
          }} />
        {open && q.trim().length >= 2 && (
          <ul id="place-list" role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-xl border border-gold/20 bg-night-2/95 p-1 shadow-glow backdrop-blur">
            {results.map((c, i) => (
              <li key={`${c.name}-${c.country}-${c.lat}`} role="option" aria-selected={i === hi}
                onMouseDown={(e) => { e.preventDefault(); pick(c); }} onMouseEnter={() => setHi(i)}
                className={`cursor-pointer rounded-lg px-3 py-2 text-sm ${i === hi ? "bg-gold/10 text-ivory" : "text-muted"}`}>
                <span className="text-ivory">{c.name}</span>, {countryName(c.country, lang)}
              </li>
            ))}
            <li role="option" aria-selected={hi === results.length} onMouseDown={(e) => { e.preventDefault(); setManual(true); setCity(null); setOpen(false); }}
              className={`cursor-pointer rounded-lg px-3 py-2 text-sm text-gold ${hi === results.length ? "bg-gold/10" : ""}`}>{t("form.other")}</li>
          </ul>
        )}
        <span className="hint">{t("form.placeHint")}</span>
      </div>
      {manual && (
        <div className="grid gap-4 rounded-2xl border border-dashed border-gold/20 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="label">{t("form.lat")}<input className="field" type="number" step="0.01" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="40.41" /></label>
            <label className="label">{t("form.lon")}<input className="field" type="number" step="0.01" value={lon} onChange={(e) => setLon(e.target.value)} placeholder="49.87" /></label>
          </div>
          <label className="label">{t("form.tz")}
            <select className="field" value={tz} onChange={(e) => setTz(e.target.value)}>{ALL_ZONES.map((z) => <option key={z} value={z} className="bg-night">{z}</option>)}</select>
          </label>
          <span className="hint">{t("form.coordsHint")}</span>
        </div>
      )}
      <p role="alert" className="min-h-[1.25rem] text-sm text-rose">{err}</p>
      <button type="submit" className="btn w-full sm:w-auto sm:justify-self-start">{t("form.submit")} <span aria-hidden>→</span></button>
    </form>
  );
}
