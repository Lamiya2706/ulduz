import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import i18n, { isLang, LANG_LABEL, LANGS, type Lang } from "@/i18n";
import { Star, Starfield } from "./Decor";

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
  return (
    <header className="no-print relative z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to={`/${lang}`} className="group flex items-center gap-2.5" aria-label="Ulduz">
          <Star className="h-5 w-5 text-gold transition group-hover:rotate-45" />
          <span className="font-display text-2xl tracking-[0.08em] text-ivory">Ulduz</span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to={`/${lang}/couple`} className="text-xs text-gold md:hidden">♡ {t("couple.nav")}</Link>
          <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
            <Link to={`/${lang}/couple`} className="hover:text-ivory">{t("couple.nav")}</Link>
            <Link to={`/${lang}#how`} className="hover:text-ivory">{t("nav.how")}</Link>
            <Link to={`/${lang}#faq`} className="hover:text-ivory">{t("nav.faq")}</Link>
            <Link to={`/${lang}/page/about`} className="hover:text-ivory">{t("nav.about")}</Link>
          </nav>
          <LangSwitch />
        </div>
      </div>
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
    document.title = i18n.t("meta.title");
    document.querySelector('meta[name="description"]')?.setAttribute("content", i18n.t("meta.description"));
    for (const l of LANGS) {
      let el = document.querySelector(`link[hreflang="${l}"]`);
      if (!el) { el = document.createElement("link"); el.setAttribute("rel", "alternate"); el.setAttribute("hreflang", l); document.head.appendChild(el); }
      el.setAttribute("href", `${location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}${pathname.replace(/^\/(az|en|ru)/, `/${l}`)}`);
    }
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
