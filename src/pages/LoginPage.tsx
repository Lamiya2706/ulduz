import { useState, type FormEvent } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import AuthShell, { GoogleIcon } from "@/components/AuthShell";
import { emptyPerson, PersonFields, personToBirth, useCityLabel } from "@/components/BirthForm";
import { useLang } from "@/components/Layout";
import { track } from "@/lib/analytics";
import { useAuth } from "@/lib/auth";
import { authErrorKey, urlAuthError } from "@/lib/authErrors";
import { birthToProfile } from "@/lib/profileBirth";
import { siteUrl, supabase } from "@/lib/supabase";

type Mode = "in" | "up" | "forgot";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const { search, hash } = useLocation();
  const [params] = useSearchParams();
  const { ready, user, linkFailed } = useAuth();
  const [mode, setMode] = useState<Mode>(params.get("mode") === "signup" ? "up" : params.get("mode") === "forgot" ? "forgot" : "in");
  const label = useCityLabel();
  const [person, setPerson] = useState(emptyPerson);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  // Holds an i18n key, so the message follows a language switch.
  const [err, setErr] = useState(() => { const k = urlAuthError(search, hash); return k ? `auth.err.${k}` : ""; });
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [sent, setSent] = useState<null | "signup" | "forgot">(null);
  const [resent, setResent] = useState(false);

  if (ready && user) return <Navigate to={`/${lang}/account?from=login`} replace />;

  const accountUrl = siteUrl(`/${lang}/account?from=login`);
  const fail = (e: unknown) => {
    const k = authErrorKey(e);
    setUnconfirmed(k === "email_not_confirmed");
    setErr(`auth.err.${k}`);
  };
  const switchMode = (m: Mode) => { setMode(m); setErr(""); setUnconfirmed(false); setSent(null); };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const mail = email.trim();
    if (!EMAIL_RE.test(mail)) return setErr("auth.err.email");
    if ((mode === "up" && password.length < 8) || (mode === "in" && !password)) return setErr("auth.err.password");
    const birth = mode === "up" ? personToBirth(person, label) : null;
    if (birth && "error" in birth) return setErr(birth.error);
    setBusy(true); setErr(""); setUnconfirmed(false);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
        if (error) throw error;
        track("login", { method: "email" });
      } else if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({
          email: mail, password,
          // The birth moment rides along in the user's metadata; the first signed-in visit copies it to the profile.
          options: { emailRedirectTo: accountUrl, data: { full_name: person.name.trim(), lang, birth: birth ? birthToProfile(birth) : undefined } },
        });
        if (error) throw error;
        // With email confirmation on, Supabase answers an existing address with a user that has no identities.
        if (data.user && data.user.identities?.length === 0) throw { code: "user_already_exists" };
        track("sign_up", { method: "email" });
        if (!data.session) setSent("signup");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(mail, { redirectTo: siteUrl(`/${lang}/reset-password`) });
        if (error) throw error;
        track("password_reset_request");
        setSent("forgot");
      }
    } catch (e) { fail(e); } finally { setBusy(false); }
  }

  async function google() {
    setBusy(true); setErr("");
    track("login", { method: "google" });
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: accountUrl } });
    if (error) { fail(error); setBusy(false); }
  }

  async function resend() {
    setBusy(true); setErr("");
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: accountUrl } });
    setBusy(false);
    if (error) fail(error); else { setResent(true); setUnconfirmed(false); }
  }

  const title = mode === "in" ? t("auth.login.titleIn") : mode === "up" ? t("auth.login.titleUp") : t("auth.login.titleForgot");

  if (sent) {
    return (
      <AuthShell eyebrow={t("auth.login.eyebrow")} title={sent === "signup" ? t("auth.login.checkTitle") : title}>
        <p className="text-ivory/90" role="status">{sent === "signup" ? t("auth.login.checkText", { email: email.trim() }) : t("auth.login.forgotSent", { email: email.trim() })}</p>
        {sent === "signup" && (resent
          ? <p className="text-sm text-gold">{t("auth.login.resent")}</p>
          : <button type="button" className="btn-ghost justify-self-start" disabled={busy} onClick={resend} data-track="auth_resend">{t("auth.login.resend")}</button>)}
        {err && <p role="alert" className="text-sm text-rose">{t(err)}</p>}
        <button type="button" className="justify-self-start text-sm text-gold hover:underline" onClick={() => { switchMode("in"); setResent(false); }}>← {t("auth.login.back")}</button>
      </AuthShell>
    );
  }

  return (
    <AuthShell wide={mode === "up"} eyebrow={t("auth.login.eyebrow")} title={title} sub={mode === "forgot" ? undefined : t("auth.login.sub")}>
      {mode !== "forgot" ? (
        <>
          <div role="tablist" className="grid grid-cols-2 rounded-full border border-gold/20 p-1 text-sm">
            {(["in", "up"] as const).map((m) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => switchMode(m)} data-track="auth_tab" data-track-label={m}
                className={`rounded-full px-4 py-2 transition ${mode === m ? "bg-gold text-night" : "text-muted hover:text-ivory"}`}>
                {m === "in" ? t("auth.login.tabIn") : t("auth.login.tabUp")}
              </button>
            ))}
          </div>
          <button type="button" onClick={google} disabled={busy} className="btn-ghost w-full">
            <GoogleIcon /> {t("auth.login.google")}
          </button>
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted"><span className="hairline flex-1" />{t("auth.login.or")}<span className="hairline flex-1" /></div>
        </>
      ) : <p className="text-muted">{t("auth.login.forgotText")}</p>}

      {linkFailed && mode === "in" && !err && <p role="status" className="rounded-xl border border-gold/20 bg-gold/5 p-3 text-sm text-ivory/90">{t("auth.login.linkFailed")}</p>}

      <form onSubmit={submit} noValidate className="grid gap-5">
        <label className="label">{t("auth.login.email")}
          <input className="field" type="email" inputMode="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} placeholder={t("auth.login.emailPh")} autoComplete="email" required />
        </label>
        {mode !== "forgot" && (
          <label className="label">{t("auth.login.password")}
            <input className="field" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setErr(""); }} minLength={8} required
              autoComplete={mode === "up" ? "new-password" : "current-password"} />
            {mode === "up" && <span className="hint">{t("auth.login.passwordHint")}</span>}
          </label>
        )}
        {mode === "up" && (
          <fieldset className="grid gap-4 border-t border-gold/15 pt-5">
            <legend className="sr-only">{t("auth.login.birthTitle")}</legend>
            <div>
              <p className="font-display text-xl text-ivory">✦ {t("auth.login.birthTitle")}</p>
              <p className="mt-1 text-sm text-muted">{t("auth.login.birthText")}</p>
            </div>
            <PersonFields value={person} onChange={(v) => { setPerson(v); setErr(""); }} idPrefix="signup" />
          </fieldset>
        )}
        {err && <p role="alert" className="text-sm text-rose">{t(err)}</p>}
        {unconfirmed && <button type="button" className="btn-ghost justify-self-start" disabled={busy} onClick={resend} data-track="auth_resend">{t("auth.login.resend")}</button>}
        {resent && !sent && <p className="text-sm text-gold">{t("auth.login.resent")}</p>}
        <button type="submit" className="btn w-full" disabled={busy}>
          {mode === "in" ? t("auth.login.submitIn") : mode === "up" ? t("auth.login.submitUp") : t("auth.login.forgotSubmit")} <span aria-hidden>→</span>
        </button>
      </form>

      {mode === "in" && <button type="button" className="justify-self-center text-sm text-gold hover:underline" onClick={() => switchMode("forgot")}>{t("auth.login.forgot")}</button>}
      {mode === "forgot" && <button type="button" className="justify-self-center text-sm text-gold hover:underline" onClick={() => switchMode("in")}>← {t("auth.login.back")}</button>}
      {mode === "up" && (
        <p className="text-center text-xs text-muted">
          <Trans i18nKey="auth.login.terms" components={{
            terms: <Link to={`/${lang}/page/terms`} className="text-gold hover:underline" />,
            privacy: <Link to={`/${lang}/page/privacy`} className="text-gold hover:underline" />,
          }} />
        </p>
      )}
    </AuthShell>
  );
}
