import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import i18n, { isLang, LANG_LABEL, LANGS, type Lang } from "@/i18n";
import { Star, Starfield } from "./Decor";
import { isPrivatePath, pageMeta } from "@/lib/seo";

export function useLang(): Lang {
  const { lang } = useParams();
  return isLang(lang) ? lang : "az";
}

function LangSwitch() {
  const lang = useLang();
  const { pathname, search, hash } = useLocation();
  const rest = pathname.replace(/^\/(az|en|ru)/, "");
  return (
    <nav aria-label="Language" className="flex items-center gap-1 text-xs tracking-[0.18em]">
      {LANGS.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span className="text-gold/30">·</span>}
          <Link to={`/${l}${rest}${search}${hash}`} onClick={() => { try { localStorage.setItem("ulduz.lang", l); } catch { /* ignore */ } }}
            aria-current={l === lang ? "true" : undefined}
            className={`rounded px-1.5 py-1 transition ${l === lang ? "text-gold" : "text-muted hover:text-ivory"}`}>{LANG_LABEL[l]}</Link>
        </span>
      ))}
    </nav>
  );
}

function Header() {
  const { t } = useTranslation();
  const lang = useLang();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  const links = [
    { to: `/${lang}/numerology`, label: t("numerology.nav") },
    { to: `/${lang}/couple`, label: t("couple.nav") },
    { to: `/${lang}#how`, label: t("nav.how") },
    { to: `/${lang}#faq`, label: t("nav.faq") },
    { to: `/${lang}/page/about`, label: t("nav.about") },
  ];
  return (
    <header className="no-print relative z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link to={`/${lang}`} className="group flex flex-none items-center gap-2.5" aria-label="Ulduz">
          <Star className="h-5 w-5 text-gold transition group-hover:rotate-45" />
          <span className="font-display text-2xl tracking-[0.08em] text-ivory">Ulduz</span>
        </Link>
        <div className="flex items-center gap-6">
          <nav className="hidden items-center gap-6 text-sm text-muted lg:flex">
            {links.map((l) => <Link key={l.to} to={l.to} className="hover:text-ivory">{l.label}</Link>)}
          </nav>
          <div className="hidden sm:block"><LangSwitch /></div>
          <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"}
            className="-mr-2 grid h-10 w-10 place-items-center rounded-full text-ivory transition hover:bg-gold/10 lg:hidden">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden>
              {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h9" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-[76px] z-40 overflow-y-auto border-t border-gold/10 bg-night/95 px-5 pb-10 pt-6 backdrop-blur-md lg:hidden">
          <nav className="grid">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="flex items-center justify-between border-b border-gold/10 py-4 font-display text-2xl text-ivory">
                {l.label}<span aria-hidden className="text-base text-gold">→</span>
              </Link>
            ))}
          </nav>
          <div className="mt-8 flex justify-center"><LangSwitch /></div>
          <div className="mt-8 flex justify-center"><Link to={`/${lang}#start`} onClick={() => setOpen(false)} className="btn">{t("nav.start")} <span aria-hidden>→</span></Link></div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const { t } = useTranslation();
  const lang = useLang();
  const links = ["about", "terms", "privacy", "refund", "contact"] as const;
  return (
    <footer className="no-print relative z-10 mt-28 border-t border-gold/10">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5"><Star className="h-4 w-4 text-gold" /><span className="font-display text-xl">Ulduz</span></div>
          <p className="mt-3 max-w-sm text-sm text-muted">{t("footer.tagline")}</p>
          <p className="mt-6 max-w-md text-xs leading-relaxed text-muted/70">{t("footer.disclaimer")}</p>
        </div>
        <div className="flex flex-wrap content-start gap-x-6 gap-y-3 text-sm text-muted md:justify-end">
          <Link to={`/${lang}/numerology`} className="hover:text-gold">{t("numerology.nav")}</Link>
          <Link to={`/${lang}/couple`} className="hover:text-gold">{t("couple.nav")}</Link>
          <Link to={`/${lang}#faq`} className="hover:text-gold">{t("footer.links.faq")}</Link>
          {links.map((l) => <Link key={l} to={`/${lang}/page/${l}`} className="hover:text-gold">{t(`footer.links.${l}`)}</Link>)}
        </div>
      </div>
      <div className="border-t border-gold/10 py-5 text-center text-xs text-muted/60">© {new Date().getFullYear()} Ulduz. {t("footer.rights")}</div>
    </footer>
  );
}

export default function Layout() {
  const { lang } = useParams();
  const { hash, pathname } = useLocation();
  const valid = isLang(lang);

  useEffect(() => {
    if (!valid) return;
    if (i18n.language !== lang) i18n.changeLanguage(lang);
    document.documentElement.lang = lang!;
    const rest = pathname.replace(/^\/(az|en|ru)/, "");
    const meta = pageMeta(lang as Lang, rest);
    const base = `${location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}`;
    const setMeta = (sel: string, make: () => Element, attr: string, value: string) => {
      let el = document.head.querySelector(sel);
      if (!el) { el = make(); document.head.appendChild(el); }
      el.setAttribute(attr, value);
    };
    const tag = (name: string, attrs: Record<string, string>) => () => { const e = document.createElement(name); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
    document.title = meta.title;
    setMeta('meta[name="description"]', tag("meta", { name: "description" }), "content", meta.description);
    setMeta('meta[property="og:title"]', tag("meta", { property: "og:title" }), "content", meta.title);
    setMeta('meta[property="og:description"]', tag("meta", { property: "og:description" }), "content", meta.description);
    setMeta('meta[name="robots"]', tag("meta", { name: "robots" }), "content", isPrivatePath(rest) ? "noindex, follow" : "index, follow");
    setMeta('link[rel="canonical"]', tag("link", { rel: "canonical" }), "href", `${base}/${lang}${rest.replace(/\/$/, "")}/`);
    for (const l of LANGS) setMeta(`link[hreflang="${l}"]`, tag("link", { rel: "alternate", hreflang: l }), "href", `${base}/${l}${rest.replace(/\/$/, "")}/`);
    // Page views (including SPA route changes) are tracked by GA4 enhanced measurement — no manual events needed.
  }, [lang, valid, pathname]);

  useEffect(() => {
    if (hash) { const el = document.getElementById(hash.slice(1)); if (el) { setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50); return; } }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);

  if (!valid) return <Navigate to={`/az${pathname}`} replace />;
  return (
    <>
      <Starfield />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <main className="flex-1"><Outlet /></main>
        <Footer />
      </div>
    </>
  );
}
