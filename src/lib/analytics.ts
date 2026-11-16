// Thin wrapper over Google Analytics 4 (gtag is injected at build time only when VITE_GA_ID is set).
type Params = Record<string, string | number | boolean | undefined>;
const gtag = () => (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;

export function track(event: string, params: Params = {}) {
  try { gtag()?.("event", event, { page_path: location.pathname, language: document.documentElement.lang, ...params }); } catch { /* never break the UI */ }
}

/**
 * One delegated listener for all clicks:
 * - elements with data-track="event_name" (optional data-track-label / data-track-*) send that event;
 * - any other .btn / .btn-ghost sends a generic "button_click" with its text, so no button goes untracked.
 */
export function installClickTracking() {
  const onClick = (e: MouseEvent) => {
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-track], a.btn, button.btn, a.btn-ghost, button.btn-ghost");
    if (!el) return;
    const label = (el.dataset.trackLabel ?? el.innerText ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
    const extra: Params = {};
    for (const [k, v] of Object.entries(el.dataset)) if (k.startsWith("track") && k !== "track" && k !== "trackLabel") extra[k.slice(5).toLowerCase()] = v;
    const href = el instanceof HTMLAnchorElement ? el.getAttribute("href") ?? undefined : undefined;
    track(el.dataset.track ?? "button_click", { label, link_url: href, ...extra });
  };
  document.addEventListener("click", onClick, { capture: true });
  return () => document.removeEventListener("click", onClick, { capture: true });
}
