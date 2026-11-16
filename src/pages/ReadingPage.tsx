import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CarpetDivider } from "@/components/Decor";
import { useLang } from "@/components/Layout";
import { api, ApiError, type OrderView } from "@/lib/api";
import { Markdown } from "@/lib/md";

export function tokenFor(orderId: string, fromUrl: string | null) {
  if (fromUrl) return fromUrl;
  try { return localStorage.getItem(`ulduz.order.${orderId}`); } catch { return null; }
}

export default function ReadingPage() {
  const { orderId = "" } = useParams();
  const [sp] = useSearchParams();
  const token = tokenFor(orderId, sp.get("t"));
  const lang = useLang();
  const { t } = useTranslation();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [text, setText] = useState("");
  const [state, setState] = useState<"loading" | "writing" | "done" | "error" | "notfound" | "notpaid" | "busy">("loading");
  const [qa, setQa] = useState<{ question: string; answer: string; live?: boolean }[]>([]);
  const [q, setQ] = useState("");
  const [asking, setAsking] = useState(false);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);

  const generate = useCallback(async () => {
    if (!token) return;
    setState("writing"); setText("");
    try {
      const full = await api.generate(orderId, token, setText);
      setText(full); setState("done");
    } catch (e) {
      setState(e instanceof ApiError && e.code === "rate_limited" ? "busy" : "error");
    }
  }, [orderId, token]);

  useEffect(() => {
    if (!token) { setState("notfound"); return; }
    if (started.current) return;
    started.current = true;
    api.order(orderId, token).then((o) => {
      setOrder(o); setQa(o.questions);
      if (o.status !== "paid") return setState("notpaid");
      if (o.reading?.status === "done") { setText(o.reading.content); setState("done"); }
      else generate();
    }).catch(() => setState("notfound"));
  }, [orderId, token, generate]);

  async function ask(question: string) {
    if (!token || asking || !question.trim()) return;
    setAsking(true); setQ("");
    setQa((x) => [...x, { question, answer: "", live: true }]);
    try {
      const full = await api.ask(orderId, token, question.trim(), (ans) => setQa((x) => x.map((it, i) => (i === x.length - 1 ? { ...it, answer: ans } : it))));
      setQa((x) => x.map((it, i) => (i === x.length - 1 ? { question, answer: full } : it)));
    } catch (e) {
      setQa((x) => x.slice(0, -1));
      alertMsg(e instanceof ApiError && e.code === "rate_limited" ? t("reading.busy") : t("reading.error"));
    } finally { setAsking(false); }
  }
  const [msg, alertMsg] = useState("");
  const left = Math.max(0, 3 - qa.filter((x) => !x.live || x.answer).length);
  const chips = t(order?.kind === "couple" ? "couple.reading.chips" : "reading.chips", { returnObjects: true }) as string[];
  const link = `${location.origin}/${lang}/reading/${orderId}?t=${token}`;

  if (state === "notfound" || state === "notpaid") {
    return (
      <div className="mx-auto max-w-xl px-5 pt-24 text-center">
        <h1 className="text-4xl">{state === "notfound" ? t("reading.notFound") : t("reading.notPaid")}</h1>
        <Link to={`/${lang}`} className="btn-ghost mt-8">{t("pages.home")}</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pt-6 sm:px-8">
      <header className="no-print text-center">
        <p className="eyebrow">{t("reading.eyebrow")}</p>
        {order && <h1 className="mt-4 text-4xl sm:text-5xl">{order.kind === "couple" ? t("couple.reading.writtenFor", { a: order.name, b: order.partnerName }) : t("reading.writtenFor", { name: order.name })}</h1>}
      </header>

      <article className={`paper paper-text mt-10 px-7 py-10 sm:px-14 sm:py-16 ${state === "writing" && text ? "[&>*:last-child]:caret" : ""}`}>
        {state === "loading" && <p className="text-center italic text-ink/60">{t("reading.loading")}</p>}
        {state === "writing" && !text && (
          <div className="py-10 text-center">
            <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border border-ink/15 border-t-copper" />
            <p className="italic">{t("reading.writing")}</p>
            <p className="mt-2 font-sans text-sm text-ink/60">{t("reading.writingSub")}</p>
          </div>
        )}
        {text && <Markdown text={text} />}
        {(state === "error" || state === "busy") && (
          <div className="mt-6 text-center font-sans">
            <p className="text-sm text-[#a2483b]">{state === "busy" ? t("reading.busy") : t("reading.error")}</p>
            <button className="btn mt-4" onClick={generate}>{t("reading.retry")}</button>
          </div>
        )}
      </article>

      {state === "done" && (
        <>
          <div className="no-print mt-8 flex flex-wrap justify-center gap-3">
            <button className="btn-ghost" onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* ignore */ } }}>{copied ? t("reading.copied") : t("reading.copy")}</button>
            <button className="btn-ghost" onClick={() => print()}>{t("reading.pdf")}</button>
            {order && <Link to={order.kind === "couple" && order.partnerCode ? `/${lang}/couple/${order.chartCode}/${order.partnerCode}` : `/${lang}/chart/${order.chartCode}`} className="btn-ghost">{t("reading.back")}</Link>}
          </div>

          <CarpetDivider className="no-print mt-16" />

          <section className="no-print card mt-12">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-3xl">{t("reading.askTitle")}</h2>
              <span className="text-xs text-muted">{left > 0 ? t("reading.left", { count: left }) : t("reading.noneLeft")}</span>
            </div>
            <div className="mt-6 grid gap-6">
              {qa.map((x, i) => (
                <div key={i}>
                  <p className="font-display text-xl italic text-gold">{x.question}</p>
                  <div className="mt-2 text-ivory/90 [&_p]:mb-3 [&_p]:leading-relaxed">{x.answer ? <Markdown text={x.answer} /> : <span className="text-muted">…</span>}</div>
                </div>
              ))}
            </div>
            {left > 0 && (
              <>
                <form className="mt-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
                  <input className="field" value={q} maxLength={300} onChange={(e) => setQ(e.target.value)} placeholder={t("reading.askPh")} disabled={asking} />
                  <button className="btn px-6" disabled={asking || !q.trim()}>{t("reading.ask")}</button>
                </form>
                <div className="mt-4 flex flex-wrap gap-2">
                  {chips.map((c) => <button key={c} type="button" disabled={asking} onClick={() => ask(c)} className="rounded-full border border-gold/20 px-3.5 py-1.5 text-xs text-ivory/80 transition hover:border-gold hover:text-gold disabled:opacity-50">{c}</button>)}
                </div>
              </>
            )}
            {msg && <p role="alert" className="mt-3 text-sm text-rose">{msg}</p>}
          </section>
        </>
      )}
      <p className="no-print mx-auto mt-14 max-w-2xl text-center text-xs leading-relaxed text-muted/70">{t("footer.disclaimer")}</p>
    </div>
  );
}
