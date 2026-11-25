import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "@/components/AuthShell";
import { emptyPerson, PersonFields, personToBirth, profileToPerson, useCityLabel, type PersonState } from "@/components/BirthForm";
import { useLang } from "@/components/Layout";
import { track } from "@/lib/analytics";
import { useAuth } from "@/lib/auth";
import { authErrorKey } from "@/lib/authErrors";
import { encodeBirth } from "@/lib/birth";
import { birthToProfile, profileBirth } from "@/lib/profileBirth";
import { computeChart } from "@shared/astro";
import { useTransitAlerts } from "@/components/TransitAlerts";
import { getTransitContent } from "@/content/transits";
import TelegramConnect from "@/components/TelegramConnect";

/** Opt-in switch for reminder emails (New and Full Moon, birthday, transits). */
function Reminders() {
  const { t } = useTranslation();
  const { profile, saveProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const on = !!profile?.email_reminders;
  async function toggle() {
    setBusy(true); setErr(false);
    try { await saveProfile({ email_reminders: !on }); track("reminders_toggle", { on: !on }); } catch { setErr(true); } finally { setBusy(false); }
  }
  return (
    <div className="flex items-start justify-between gap-5 rounded-2xl border border-gold/15 px-5 py-4">
      <div>
        <p id="reminders-title" className="text-ivory">✉ {t("auth.account.reminders.title")}</p>
        <p className="mt-1 text-sm text-muted">{t("auth.account.reminders.text")}</p>
        {err && <p role="alert" className="mt-2 text-sm text-rose">{t("auth.account.reminders.error")}</p>}
      </div>
      <button type="button" role="switch" aria-checked={on} aria-labelledby="reminders-title" disabled={busy} onClick={toggle}
        title={on ? t("auth.account.reminders.on") : t("auth.account.reminders.off")}
        className={`relative mt-1 h-7 w-12 flex-none rounded-full border transition disabled:opacity-60 ${on ? "border-gold bg-gold" : "border-gold/30 bg-white/5"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full transition-all ${on ? "left-6 bg-night" : "left-0.5 bg-ivory/70"}`} />
      </button>
    </div>
  );
}

export default function AccountPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const label = useCityLabel();
  const { ready, user, profile, profileLoaded, saveProfile, signOut } = useAuth();
  const [params] = useSearchParams();
  const fromLogin = params.get("from") === "login";
  const nav = useNavigate();
  const [p, setP] = useState<PersonState>(emptyPerson);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const loadedFor = useRef<string | null>(null);

  // Fill the form once, when the profile first arrives.
  useEffect(() => {
    if (profile && loadedFor.current !== profile.id) { loadedFor.current = profile.id; setP(profileToPerson(profile)); }
  }, [profile]);

  const chart = useMemo(() => { const b = profileBirth(profile); return b ? computeChart(b) : null; }, [profile]);
  const alerts = useTransitAlerts(chart);
  const tc = getTransitContent(lang);

  if (ready && !user) return <Navigate to={`/${lang}/login`} replace />;
  const birth = profileBirth(profile);
  // Right after logging in: with a saved birth moment, go straight to the chart.
  if (fromLogin && profileLoaded && birth) return <Navigate to={`/${lang}/chart/${encodeBirth(birth)}`} replace />;
  if (!ready || !user || (fromLogin && !profileLoaded)) return <AuthShell eyebrow={t("auth.account.eyebrow")} title={t("auth.account.titleNoName")}><p className="text-muted">{t("auth.account.loading")}</p></AuthShell>;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const r = personToBirth(p, label);
    if ("error" in r) return setErr(t(r.error));
    setBusy(true); setErr(""); setSaved(false);
    try {
      const first = !profile?.birth_date;
      await saveProfile({ ...birthToProfile(r), lang });
      track("profile_save", { has_time: !!r.time, has_place: r.lat != null, first });
      setSaved(true);
      // First time: the chart is the reason they gave us the data, so open it.
      if (first) nav(`/${lang}/chart/${encodeBirth(r)}`);
    } catch (e) { setErr(t(`auth.err.${authErrorKey(e)}`)); } finally { setBusy(false); }
  }

  const name = profile?.full_name?.split(/\s+/)[0];
  const needsBirth = profileLoaded && !profile?.birth_date;
  return (
    <AuthShell wide eyebrow={t("auth.account.eyebrow")} title={name ? t("auth.account.title", { name }) : t("auth.account.titleNoName")} sub={t("auth.account.signedInAs", { email: user.email ?? "" })}>
      <div>
        {needsBirth && <p className="eyebrow mb-2">{t("auth.account.welcomeEyebrow")}</p>}
        <h2 className="text-2xl text-ivory">{needsBirth ? t("auth.account.welcomeTitle") : t("auth.account.birthTitle")}</h2>
        <p className="mt-2 text-sm text-muted">{needsBirth ? t("auth.account.welcomeText") : t("auth.account.birthText")}</p>
      </div>
      <form onSubmit={submit} noValidate className="grid gap-5">
        <PersonFields value={p} onChange={(v) => { setP(v); setErr(""); setSaved(false); }} idPrefix="acc" />
        {err && <p role="alert" className="text-sm text-rose">{err}</p>}
        {saved && <p role="status" className="text-sm text-gold">{t("auth.account.saved")}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn" disabled={busy}>{t("auth.account.save")}</button>
          {birth && <Link to={`/${lang}/chart/${encodeBirth(birth)}`} className="btn-ghost" data-track="account_open_chart">{t("auth.account.openChart")} <span aria-hidden>→</span></Link>}
          {birth && <Link to={`/${lang}/today`} className="btn-ghost" data-track="account_open_today">✦ {t("daily.nav")}</Link>}
        </div>
      </form>
      {chart && (
        <Link to={`/${lang}/today#transits`} data-track="account_transits" className="flex items-center justify-between gap-4 rounded-2xl border border-gold/25 bg-gold/[0.06] px-5 py-4 transition hover:border-gold">
          <span><span className="block text-ivory">✦ {tc.ui.accountTitle}</span><span className="text-sm text-muted">{alerts.some((a) => a.active) ? tc.ui.accountActive(alerts.filter((a) => a.active).length) : tc.ui.accountNone}</span></span>
          <span className="flex-none text-sm text-gold">{tc.ui.accountOpen} →</span>
        </Link>
      )}
      {birth && <Reminders />}
      <TelegramConnect lang={lang} highlight={params.get("telegram") === "1"} />
      <div className="hairline" />
      <button type="button" className="justify-self-start text-sm text-muted hover:text-rose" data-track="logout" onClick={() => { void signOut(); }}>{t("auth.account.signOut")}</button>
    </AuthShell>
  );
}
