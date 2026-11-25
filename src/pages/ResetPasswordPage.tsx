import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import AuthShell from "@/components/AuthShell";
import { useLang } from "@/components/Layout";
import { track } from "@/lib/analytics";
import { useAuth } from "@/lib/auth";
import { authErrorKey } from "@/lib/authErrors";
import { supabase } from "@/lib/supabase";

/** Opened from the reset email: the link signs the person in (PKCE ?code=), then they choose a new password. */
export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const { ready, user } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setErr(t("auth.err.password"));
    if (password !== confirm) return setErr(t("auth.reset.mismatch"));
    setBusy(true); setErr("");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setErr(t(`auth.err.${authErrorKey(error)}`));
    track("password_reset_done");
    setDone(true);
  }

  if (!ready) return <AuthShell eyebrow={t("auth.reset.eyebrow")} title={t("auth.reset.title")}><p className="text-muted">{t("auth.account.loading")}</p></AuthShell>;

  if (!user) {
    return (
      <AuthShell eyebrow={t("auth.reset.eyebrow")} title={t("auth.reset.title")}>
        <p role="alert" className="text-ivory/90">{t("auth.reset.invalid")}</p>
        <Link to={`/${lang}/login?mode=forgot`} className="btn justify-self-start">{t("auth.reset.again")} <span aria-hidden>→</span></Link>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell eyebrow={t("auth.reset.eyebrow")} title={t("auth.reset.title")}>
        <p role="status" className="text-gold">{t("auth.reset.done")}</p>
        <Link to={`/${lang}/account`} className="btn justify-self-start">{t("auth.reset.toAccount")} <span aria-hidden>→</span></Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow={t("auth.reset.eyebrow")} title={t("auth.reset.title")}>
      <form onSubmit={submit} noValidate className="grid gap-5">
        <input type="email" value={user.email ?? ""} autoComplete="username" readOnly hidden />
        <label className="label">{t("auth.reset.password")}
          <input className="field" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setErr(""); }} minLength={8} autoComplete="new-password" required />
          <span className="hint">{t("auth.login.passwordHint")}</span>
        </label>
        <label className="label">{t("auth.reset.confirm")}
          <input className="field" type="password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setErr(""); }} minLength={8} autoComplete="new-password" required />
        </label>
        {err && <p role="alert" className="text-sm text-rose">{err}</p>}
        <button type="submit" className="btn w-full" disabled={busy}>{t("auth.reset.submit")} <span aria-hidden>→</span></button>
      </form>
    </AuthShell>
  );
}
