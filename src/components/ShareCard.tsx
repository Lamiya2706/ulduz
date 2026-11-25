import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { dominantElement, type Chart } from "@shared/astro";
import type { Content } from "@/content";
import { track } from "@/lib/analytics";
import { canvasToBlob, drawChartCard } from "@/lib/chartCard";

/** "Share my chart" button: draws a story-sized image of the chart and offers to share or save it. */
export default function ShareCard({ chart, content: c, name, lifePath }: { chart: Chart; content: Content; name: string; lifePath: number }) {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [open, setOpen] = useState(() => params.get("share") === "1");
  const [img, setImg] = useState<{ url: string; blob: Blob } | null>(null);
  const [failed, setFailed] = useState(false);
  const first = name.trim().split(/\s+/)[0];
  const file = `ulduz-${first.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-") || "chart"}.png`;

  useEffect(() => {
    if (!open || img) return;
    let alive = true;
    const el = dominantElement(chart);
    drawChartCard(chart, {
      name: first,
      sunLabel: c.planetNames.Sun, moonLabel: c.planetNames.Moon, risingLabel: t("chart.rising"),
      signNames: c.signNames,
      elementLabel: t("chart.share.element"), elementName: c.elementNames[el],
      lifePathLabel: t("chart.lifePathChip"), lifePath,
      quote: c.signs[chart.pos.Sun.sign].shine,
      cta: t("chart.share.cta"), site: location.host.replace(/^www\./, "") || "ulduz.space",
    }).then(canvasToBlob).then((blob) => { if (alive) setImg({ url: URL.createObjectURL(blob), blob }); }).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [open, img, chart, c, first, lifePath, t]);
  useEffect(() => () => { if (img) URL.revokeObjectURL(img.url); }, [img]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open]);

  const shareFile = img ? new File([img.blob], file, { type: "image/png" }) : null;
  const canShare = !!shareFile && typeof navigator.canShare === "function" && navigator.canShare({ files: [shareFile] });

  async function share() {
    if (!shareFile) return;
    track("share_card", { method: "native" });
    try { await navigator.share({ files: [shareFile], title: "Ulduz" }); } catch { /* cancelled */ }
  }
  function download() {
    if (!img) return;
    track("share_card", { method: "download" });
    const a = document.createElement("a");
    a.href = img.url; a.download = file; a.click();
  }

  return (
    <>
      <button type="button" className="btn" data-track="share_card_open" onClick={() => setOpen(true)}>✦ {t("chart.share.button")}</button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div role="dialog" aria-modal="true" aria-labelledby="share-title" onClick={(e) => e.stopPropagation()}
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
              className="card grid max-h-full w-full max-w-sm gap-4 overflow-y-auto border-gold/30 bg-night-2 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div><h2 id="share-title" className="text-2xl">{t("chart.share.title")}</h2><p className="mt-1 text-sm text-muted">{t("chart.share.text")}</p></div>
                <button type="button" onClick={() => setOpen(false)} aria-label={t("chart.share.close")} className="-mr-1 grid h-9 w-9 flex-none place-items-center rounded-full text-ivory hover:bg-gold/10">✕</button>
              </div>
              <div className="mx-auto aspect-[9/16] w-full max-w-[16rem] overflow-hidden rounded-xl border border-gold/20 bg-night">
                {img ? <img src={img.url} alt={t("chart.share.alt", { name: first })} className="h-full w-full" /> : <p className="grid h-full place-items-center px-4 text-center text-sm text-muted">{failed ? t("chart.share.error") : t("chart.share.drawing")}</p>}
              </div>
              <div className="grid gap-2">
                {canShare && <button type="button" className="btn justify-center" onClick={share}>{t("chart.share.share")}</button>}
                <button type="button" className={`${canShare ? "btn-ghost" : "btn"} justify-center`} onClick={download} disabled={!img}>{t("chart.share.download")}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
