import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { Reveal } from "@/components/Decor";
import { useLang } from "@/components/Layout";
import { Markdown } from "@/lib/md";
import { getPage } from "./staticContent";

export default function StaticPage() {
  const { slug = "" } = useParams();
  const lang = useLang();
  const { t } = useTranslation();
  const page = getPage(lang, slug);
  if (!page) return <NotFound />;
  return (
    <div className="mx-auto max-w-2xl px-5 pt-10 sm:px-8">
      <Reveal>
        <p className="eyebrow">Ulduz</p>
        <h1 className="mt-4 text-5xl">{page.title}</h1>
        {page.draft && <p className="mt-4 inline-block rounded-full border border-rose/40 px-3 py-1 text-xs text-rose">{t("pages.draft")}</p>}
      </Reveal>
      <div className="mt-10 leading-relaxed text-ivory/85 [&_h3]:mb-2 [&_h3]:mt-10 [&_h3]:text-2xl [&_h3]:text-ivory [&_p]:mb-4">
        <Markdown text={page.body.join("\n\n")} />
      </div>
    </div>
  );
}

export function NotFound() {
  const lang = useLang();
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-xl px-5 pt-28 text-center">
      <p className="font-display text-8xl italic text-gold/70">404</p>
      <h1 className="mt-4 text-4xl">{t("pages.notFound")}</h1>
      <Link to={`/${lang}`} className="btn mt-8">{t("pages.home")}</Link>
    </div>
  );
}
