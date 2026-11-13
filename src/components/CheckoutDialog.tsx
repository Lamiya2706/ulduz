import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { LANG_NAME, LANGS, type Lang } from "@/i18n";
import { api, ApiError } from "@/lib/api";
import type { BirthParams } from "@/lib/birth";
import { useLang } from "./Layout";

export default function CheckoutDialog({ open, onClose, input }: { open: boolean; onClose: () => void; input: BirthParams }) {
  const { t } = useTranslation();
  const lang = useLang();
  const [readingLang, setReadingLang] = useState<Lang>(lang);
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const includes = t("checkout.includes", { returnObjects: true }) as string[];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose(); };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  async function pay() {
    setBusy(true); setErr("");
    try {
      const { redirectUrl, orderId, token } = await api.createPayment(input, readingLang, email.trim() || null);
      try { localStorage.setItem(`ulduz.order.${orderId}`, token); } catch { /* ignore */ }
      location.href = redirectUrl;
    } catch (e) {
      setErr(e instanceof ApiError && e.code === "not_configured" ? t("checkout.notConfigured") : t("checkout.error"));
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-night/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !busy && onClose()}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="checkout-title" onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", damping: 26, stiffness: 260 }}
            className="card w-full max-w-lg rounded-b-none border-gold/30 bg-night-2 sm:rounded-[24px] sm:p-9">
            <div className="flex items-start justify-between gap-4">
              <h2 id="checkout-title" className="text-3xl">{t("checkout.title")}</h2>
              <span className="font-display text-3xl text-gold">1 ₼</span>
            </div>
            <ul className="mt-5 grid gap-2.5">{includes.map((x) => <li key={x} className="flex gap-3 text-sm text-ivory/90"><span className="text-gold">✦</span>{x}</li>)}</ul>
            <div className="mt-6 grid gap-4">
              <label className="label">{t("checkout.lang")}
                <div className="grid grid-cols-3 gap-2">
                  {LANGS.map((l) => (
                    <button key={l} type="button" onClick={() => setReadingLang(l)} aria-pressed={readingLang === l}
                      className={`rounded-xl border px-3 py-2.5 text-sm transition ${readingLang === l ? "border-gold bg-gold/10 text-gold" : "border-gold/15 text-muted hover:text-ivory"}`}>{LANG_NAME[l]}</button>
                  ))}
                </div>
              </label>
              <label className="label">{t("checkout.email")}
                <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                <span className="hint">{t("checkout.emailHint")}</span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-muted">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#D6B47C]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <span><Trans i18nKey="checkout.agree" components={{
                  terms: <Link to={`/${lang}/page/terms`} target="_blank" className="text-gold underline underline-offset-4" />,
                  refund: <Link to={`/${lang}/page/refund`} target="_blank" className="text-gold underline underline-offset-4" />,
                }} /></span>
              </label>
            </div>
            <p role="alert" className="mt-3 min-h-[1.25rem] text-sm text-rose">{err}</p>
            <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" className="text-sm text-muted hover:text-ivory" onClick={onClose} disabled={busy}>{t("checkout.cancel")}</button>
              <button type="button" className="btn" disabled={!agree || busy} onClick={pay}>{busy ? t("checkout.processing") : t("checkout.pay")}</button>
            </div>
            <p className="mt-5 text-center text-xs text-muted/70">{t("checkout.secure")}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
