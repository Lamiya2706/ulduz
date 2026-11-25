// "Ulduz on your phone" card on the signed-in home: add to home screen, and the daily horoscope notification.
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useLang } from "@/components/Layout";
import { track } from "@/lib/analytics";
import { installMode, onInstallChange, promptInstall, type InstallMode } from "@/lib/install";
import { disablePush, enablePush, pushState, syncPush, type PushState } from "@/lib/push";

export default function AppCard({ hasBirth }: { hasBirth: boolean }) {
  const { t } = useTranslation();
  const lang = useLang();
  const [mode, setMode] = useState<InstallMode>(installMode);
  const [push, setPush] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => onInstallChange(() => setMode(installMode())), []);
  useEffect(() => {
    let alive = true;
    pushState().then((s) => { if (alive) setPush(s); if (s === "on") syncPush(lang); }).catch(() => alive && setPush("unsupported"));
    return () => { alive = false; };
  }, [lang]);

  const showInstall = mode === "prompt" || mode === "ios";
  const showPush = push !== null && push !== "unsupported";
  if (!showInstall && !showPush) return null;

  const toggle = async () => {
    setBusy(true); setError(false);
    try {
      const next = push === "on" ? await disablePush() : await enablePush(lang);
      setPush(next);
      track(next === "on" ? "push_on" : "push_off");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card mt-6 grid gap-8 md:grid-cols-2">
      {(showInstall || mode === "installed") && (
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-gold">{t("app.eyebrow")}</p>
          <h2 className="mt-2 text-2xl">{t("app.title")}</h2>
          {mode === "installed" ? <p className="mt-2 text-sm text-muted">{t("app.installed")}</p> : <p className="mt-2 text-sm leading-relaxed text-muted">{t("app.text")}</p>}
          {mode === "prompt" && (
            <button type="button" className="btn mt-5" data-track="app_install" onClick={() => promptInstall().then((ok) => track(ok ? "app_installed" : "app_install_dismissed"))}>
              {t("app.install")} <span aria-hidden>↓</span>
            </button>
          )}
          {mode === "ios" && (
            <p className="mt-4 rounded-xl border border-gold/20 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed">
              <span className="text-gold">{t("app.iosTitle")}: </span>
              <Trans i18nKey="app.iosSteps" components={{ b: <b className="font-medium text-ivory" /> }} />
            </p>
          )}
        </div>
      )}
      {showPush && (
        <div className={showInstall || mode === "installed" ? "md:border-l md:border-gold/15 md:pl-8" : ""}>
          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-gold">☉ {t("daily.teaser.eyebrow")}</p>
          <h2 className="mt-2 text-2xl">{t("app.pushTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {push === "on" ? t("app.pushIsOn") : push === "denied" ? t("app.pushDenied") : push === "needs-install" ? t("app.pushNeedsInstall") : hasBirth ? t("app.pushText") : t("app.pushNeedsBirth")}
          </p>
          {(push === "on" || (push === "off" && hasBirth)) && (
            <button type="button" className={`${push === "on" ? "btn-ghost" : "btn"} mt-5`} disabled={busy} aria-pressed={push === "on"} data-track="push_toggle" onClick={toggle}>
              {push === "on" ? t("app.pushOff") : t("app.pushOn")}
            </button>
          )}
          {push === "off" && !hasBirth && <Link to={`/${lang}/account`} className="btn mt-5">{t("auth.home.addBirth")} <span aria-hidden>→</span></Link>}
          {error && <p className="mt-3 text-sm text-rose" role="alert">{t("app.pushError")}</p>}
        </div>
      )}
    </div>
  );
}
