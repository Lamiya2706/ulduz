// "Connect Telegram" on the account page: a one-time code opens the bot with t.me/<bot>?start=<code>,
// and the bot links that chat to this account (see supabase/functions/telegram-bot).
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/i18n";
import { track } from "@/lib/analytics";
import { supabase } from "@/lib/supabase";

/** The bot's username, without the @. */
const TELEGRAM_BOT = (import.meta.env.VITE_TELEGRAM_BOT as string | undefined) || "UlduzSpaceBot";

const TEXT: Record<Lang, { title: string; text: string; connect: string; linked: string; linkedText: string; open: string; unlink: string; failed: string }> = {
  az: {
    title: "Telegram", text: "Hər səhər gündəlik horoskopun, Ay qeydləri və böyük tranzitlər haqqında xəbərdarlıqlar Telegram-a gəlsin.",
    connect: "Telegram-ı qoş", linked: "Telegram qoşulub ✓", linkedText: "Səhər mesajlarını botda /settings ilə idarə edə bilərsən.",
    open: "Botu aç", unlink: "Ayır", failed: "Alınmadı. Bir az sonra yenidən yoxla.",
  },
  en: {
    title: "Telegram", text: "Get your daily horoscope, moon notes and alerts about big transits in Telegram every morning.",
    connect: "Connect Telegram", linked: "Telegram connected ✓", linkedText: "Manage the morning message with /settings in the bot.",
    open: "Open the bot", unlink: "Disconnect", failed: "That didn't work. Please try again in a moment.",
  },
  ru: {
    title: "Telegram", text: "Получай гороскоп на день, заметки о Луне и предупреждения о больших транзитах в Telegram каждое утро.",
    connect: "Подключить Telegram", linked: "Telegram подключён ✓", linkedText: "Утренними сообщениями можно управлять в боте через /settings.",
    open: "Открыть бота", unlink: "Отключить", failed: "Не получилось. Попробуй чуть позже.",
  },
};

export default function TelegramConnect({ lang, highlight }: { lang: Lang; highlight?: boolean }) {
  const tx = TEXT[lang];
  const [linked, setLinked] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const ref = useRef<HTMLElement>(null);

  const refresh = () => supabase.rpc("telegram_linked").then(({ data, error }) => setLinked(error ? false : data === true));
  useEffect(() => { void refresh(); }, []);
  // Coming back from the bot: check again.
  useEffect(() => {
    const on = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  useEffect(() => { if (highlight) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [highlight, linked]);

  async function connect() {
    setBusy(true); setErr(false);
    // Open the tab now (inside the click), so popup blockers allow it; point it at the bot once the code is ready.
    const w = window.open("", "_blank");
    const { data, error } = await supabase.rpc("telegram_link_code");
    setBusy(false);
    if (error || typeof data !== "string") { w?.close(); setErr(true); return; }
    const url = `https://t.me/${TELEGRAM_BOT}?start=${data}`;
    track("telegram_connect");
    if (w) w.location.href = url; else location.href = url;
  }
  async function unlink() {
    setBusy(true);
    await supabase.rpc("telegram_unlink");
    setBusy(false);
    track("telegram_unlink");
    void refresh();
  }

  if (linked === null) return null;
  return (
    <section ref={ref} className={`rounded-2xl border px-5 py-4 ${highlight && !linked ? "border-gold" : "border-gold/25"} bg-gold/[0.06]`}>
      <p className="text-ivory">{linked ? tx.linked : `✈︎ ${tx.title}`}</p>
      <p className="mt-1 text-sm text-muted">{linked ? tx.linkedText : tx.text}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {linked ? (
          <>
            <a href={`https://t.me/${TELEGRAM_BOT}`} target="_blank" rel="noreferrer" className="btn-ghost" data-track="telegram_open">{tx.open} <span aria-hidden>→</span></a>
            <button type="button" className="text-sm text-muted hover:text-rose" disabled={busy} onClick={() => { void unlink(); }}>{tx.unlink}</button>
          </>
        ) : (
          <button type="button" className="btn" disabled={busy} onClick={() => { void connect(); }}>{tx.connect} <span aria-hidden>→</span></button>
        )}
      </div>
      {err && <p role="alert" className="mt-2 text-sm text-rose">{tx.failed}</p>}
    </section>
  );
}
