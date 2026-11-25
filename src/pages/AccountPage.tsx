import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import AuthShell from "@/components/AuthShell";
import { emptyPerson, PersonFields, personToBirth, useCityLabel, type PersonState } from "@/components/BirthForm";
import { useLang } from "@/components/Layout";
import { track } from "@/lib/analytics";
import { useAuth } from "@/lib/auth";
import { authErrorKey } from "@/lib/authErrors";
import { encodeBirth, type BirthParams } from "@/lib/birth";
import type { Profile } from "@/lib/supabase";

/** Profile row → birth form state. A saved place comes back as a ready "city" so it needs no new search. */
function toPerson(p: Profile): PersonState {
  return {
    ...emptyPerson(),
    name: p.full_name ?? "",
    date: p.birth_date ?? "",
    time: p.birth_time ?? "",
    noTime: !!p.birth_date && !p.birth_time,
    q: p.birth_place ?? "",
    city: p.lat != null && p.lon != null ? { name: p.birth_place ?? "", country: "", lat: p.lat, lon: p.lon, tz: p.tz ?? "UTC", aliases: [] } : null,
  };
}

/** Profile row → chart link code, when the profile has enough to draw a chart. */
function profileBirth(p: Profile | null): BirthParams | null {
  if (!p?.full_name || !p.birth_date) return null;
  const hasPlace = p.lat != null && p.lon != null;
  return { fullName: p.full_name, date: p.birth_date, time: hasPlace ? p.birth_time : null, lat: hasPlace ? p.lat : null, lon: hasPlace ? p.lon : null, tz: hasPlace ? p.tz ?? "UTC" : "UTC", place: hasPlace ? p.birth_place : null };
}

export default function AccountPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const label = useCityLabel();
  const { ready, user, profile, saveProfile, signOut } = useAuth();
  const [p, setP] = useState<PersonState>(emptyPerson);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const loadedFor = useRef<string | null>(null);

  // Fill the form once, when the profile first arrives.
  useEffect(() => {
    if (profile && loadedFor.current !== profile.id) { loadedFor.current = profile.id; setP(toPerson(profile)); }
  }, [profile]);

  if (ready && !user) return <Navigate to={`/${lang}/login`} replace />;
  if (!ready || !user) return <AuthShell eyebrow={t("auth.account.eyebrow")} title={t("auth.account.titleNoName")}><p className="text-muted">{t("auth.account.loading")}</p></AuthShell>;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const r = personToBirth(p, label);
    if ("error" in r) return setErr(t(r.error));
    setBusy(true); setErr(""); setSaved(false);
    try {
      const hasPlace = r.lat != null && r.lon != null;
      await saveProfile({
        full_name: r.fullName, birth_date: r.date, birth_time: r.time,
        birth_place: hasPlace ? r.place : null, lat: hasPlace ? r.lat : null, lon: hasPlace ? r.lon : null, tz: hasPlace ? r.tz : null, lang,
      });
      track("profile_save", { has_time: !!r.time, has_place: hasPlace });
      setSaved(true);
    } catch (e) { setErr(t(`auth.err.${authErrorKey(e)}`)); } finally { setBusy(false); }
  }

  const name = profile?.full_name?.split(/\s+/)[0];
  const birth = profileBirth(profile);
  return (
    <AuthShell wide eyebrow={t("auth.account.eyebrow")} title={name ? t("auth.account.title", { name }) : t("auth.account.titleNoName")} sub={t("auth.account.signedInAs", { email: user.email ?? "" })}>
      <div>
        <h2 className="text-2xl text-ivory">{t("auth.account.birthTitle")}</h2>
        <p className="mt-2 text-sm text-muted">{t("auth.account.birthText")}</p>
      </div>
      <form onSubmit={submit} noValidate className="grid gap-5">
        <PersonFields value={p} onChange={(v) => { setP(v); setErr(""); setSaved(false); }} idPrefix="acc" />
        {err && <p role="alert" className="text-sm text-rose">{err}</p>}
        {saved && <p role="status" className="text-sm text-gold">{t("auth.account.saved")}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn" disabled={busy}>{t("auth.account.save")}</button>
          {birth && <Link to={`/${lang}/chart/${encodeBirth(birth)}`} className="btn-ghost" data-track="account_open_chart">{t("auth.account.openChart")} <span aria-hidden>→</span></Link>}
        </div>
      </form>
      <div className="hairline" />
      <button type="button" className="justify-self-start text-sm text-muted hover:text-rose" data-track="logout" onClick={() => { void signOut(); }}>{t("auth.account.signOut")}</button>
    </AuthShell>
  );
}
