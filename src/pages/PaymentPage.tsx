import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useLang } from "@/components/Layout";
import { api } from "@/lib/api";
import { tokenFor } from "./ReadingPage";

export function PaymentSuccess() {
  const [sp] = useSearchParams();
  const orderId = sp.get("order") ?? "";
  const token = tokenFor(orderId, sp.get("t"));
  const lang = useLang();
  const nav = useNavigate();
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!orderId || !token) return;
    let alive = true, tries = 0;
    const loop = async () => {
      while (alive && tries < 30) {
        tries++;
        try {
          // check-status asks Epoint directly when our callback hasn't arrived yet
          const { status } = tries % 3 === 0 ? await api.checkStatus(orderId, token) : await api.order(orderId, token);
          if (status === "paid") { track("purchase", { transaction_id: orderId, value: 2, currency: "AZN" }); nav(`/${lang}/reading/${orderId}?t=${token}`, { replace: true }); return; }
          if (status === "failed") { track("payment_failed", { transaction_id: orderId }); nav(`/${lang}/payment/failed?order=${orderId}`, { replace: true }); return; }
        } catch { /* keep polling */ }
        if (tries > 12) setPending(true);
        await new Promise((r) => setTimeout(r, 2500));
      }
      setPending(true);
    };
    loop();
    return () => { alive = false; };
  }, [orderId, token, lang, nav, tick]);

  return (
    <div className="mx-auto max-w-xl px-5 pt-24 text-center">
      <p className="eyebrow">Ulduz</p>
      <h1 className="mt-4 text-5xl">{t("payment.successTitle")}</h1>
      <p className="mt-5 text-muted">{pending ? t("payment.pending") : t("payment.successText")}</p>
      {!pending ? <div className="mx-auto mt-10 h-12 w-12 animate-spin rounded-full border border-gold/20 border-t-gold" aria-label={t("payment.waiting")} />
        : <button className="btn mt-8" onClick={() => { setPending(false); setTick((x) => x + 1); }}>{t("payment.refresh")}</button>}
    </div>
  );
}

export function PaymentFailed() {
  const [sp] = useSearchParams();
  const orderId = sp.get("order") ?? "";
  const token = tokenFor(orderId, sp.get("t"));
  const lang = useLang();
  const { t } = useTranslation();
  const [back, setBack] = useState<string | null>(null);
  useEffect(() => { if (orderId && token) api.order(orderId, token).then((o) => setBack(o.kind === "couple" && o.partnerCode ? `couple/${o.chartCode}/${o.partnerCode}` : `chart/${o.chartCode}`)).catch(() => {}); }, [orderId, token]);
  return (
    <div className="mx-auto max-w-xl px-5 pt-24 text-center">
      <p className="eyebrow">Ulduz</p>
      <h1 className="mt-4 text-5xl">{t("payment.failedTitle")}</h1>
      <p className="mt-5 text-muted">{t("payment.failedText")}</p>
      <div className="mt-8 flex justify-center gap-3">
        {back && <Link to={`/${lang}/${back}#reading`} className="btn">{t("payment.retry")}</Link>}
        <Link to={`/${lang}`} className="btn-ghost">{t("pages.home")}</Link>
      </div>
    </div>
  );
}
