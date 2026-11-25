// "Get the app" for every visitor: opens the browser's install dialog where there is one (Chrome, Edge, Samsung Internet),
// and otherwise shows the steps for this device. Hidden once Ulduz runs as an installed app.
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { track } from "@/lib/analytics";
import { installMode, isIOS, onInstallChange, promptInstall, type InstallMode } from "@/lib/install";

const platform = () => (isIOS() ? "Ios" : /Android/i.test(navigator.userAgent) ? "Android" : "Desktop");

export function useInstallMode() {
  const [mode, setMode] = useState<InstallMode>(installMode);
  useEffect(() => onInstallChange(() => setMode(installMode())), []);
  return mode;
}

export default function InstallButton({ place, className, children }: { place: string; className: string; children?: React.ReactNode }) {
  const { t } = useTranslation();
  const mode = useInstallMode();
  const [open, setOpen] = useState(false);
  if (mode === "installed") return null;

  const onClick = async () => {
    if (mode === "prompt") {
      const ok = await promptInstall();
      track(ok ? "app_installed" : "app_install_dismissed", { place });
    } else {
      setOpen(true);
    }
  };

  return (
    <>
      <button type="button" className={className} data-track="app_install" data-track-place={place} onClick={onClick}>
        {children ?? <><span aria-hidden>↓</span><span className="max-[359px]:sr-only">{t("app.headerBtn")}</span></>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-night/80 p-4 backdrop-blur-sm sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={(e) => e.stopPropagation()}
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
              className="card w-full max-w-sm border-gold/30 bg-night-2 p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 id="install-title" className="text-2xl">{t("app.dialogTitle")}</h2>
                <button type="button" onClick={() => setOpen(false)} aria-label={t("app.close")} className="-mr-1 grid h-9 w-9 flex-none place-items-center rounded-full text-ivory hover:bg-gold/10">✕</button>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t("app.dialogText")}</p>
              <p className="mt-5 rounded-xl border border-gold/20 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed">
                <Trans i18nKey={`app.steps${platform()}`} components={{ b: <b className="font-medium text-ivory" /> }} />
              </p>
              <button type="button" className="btn mt-6 w-full justify-center" onClick={() => setOpen(false)}>{t("app.close")}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
