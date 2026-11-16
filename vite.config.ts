import react from "@vitejs/plugin-react";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";
import { pageMeta, PUBLIC_ROUTES, SEO_LANGS } from "./src/lib/seo";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * Build-time SEO for a static host (GitHub Pages):
 * - one real HTML file per public route and language, with its own title, description, canonical and hreflang,
 *   so search engines get a 200 page with the right metadata instead of the SPA 404 fallback;
 * - sitemap.xml and robots.txt;
 * - Google Analytics and Search Console verification, only when their IDs are provided as env vars.
 */
function seo(): Plugin {
  let outDir = "dist", base = "/";
  const site = (process.env.SITE_URL || "https://ulduz.space").replace(/\/$/, "");
  const ga = process.env.VITE_GA_ID?.trim();
  const gsc = process.env.VITE_GSC_VERIFICATION?.trim();
  return {
    name: "ulduz-seo",
    apply: "build",
    configResolved(c) { outDir = resolve(c.root, c.build.outDir); base = c.base; },
    transformIndexHtml(html) {
      let head = "";
      if (gsc && /^[\w-]+$/.test(gsc)) head += `<meta name="google-site-verification" content="${gsc}" />\n`;
      if (ga && /^G-[A-Z0-9]+$/.test(ga)) {
        head += `<script async src="https://www.googletagmanager.com/gtag/js?id=${ga}"></script>\n` +
          `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","${ga}");</script>\n`;
      }
      return head ? html.replace("</head>", `${head}</head>`) : html;
    },
    closeBundle() {
      const root = `${site}${base}`.replace(/\/$/, "");
      const url = (lang: string, route: string) => `${root}/${lang}/${route ? `${route}/` : ""}`;
      const template = readFileSync(join(outDir, "index.html"), "utf8");
      const urls: string[] = [];
      for (const route of PUBLIC_ROUTES) {
        const alternates = SEO_LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${url(l, route)}" />`).join("\n") +
          `\n<link rel="alternate" hreflang="x-default" href="${url("az", route)}" />`;
        for (const lang of SEO_LANGS) {
          const m = pageMeta(lang, route);
          const html = template
            .replace(/<html lang="[^"]*">/, `<html lang="${lang}">`)
            .replace(/<title>[^<]*<\/title>/, `<title>${esc(m.title)}</title>`)
            .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(m.description)}" />`)
            .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(m.title)}" />`)
            .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(m.description)}" />`)
            .replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${root}/og.png" />`)
            .replace("</head>", `<link rel="canonical" href="${url(lang, route)}" />\n${alternates}\n<meta property="og:url" content="${url(lang, route)}" />\n<meta property="og:type" content="website" />\n<meta property="og:locale" content="${{ az: "az_AZ", en: "en_US", ru: "ru_RU" }[lang]}" />\n</head>`);
          const file = join(outDir, lang, route, "index.html");
          mkdirSync(dirname(file), { recursive: true });
          writeFileSync(file, html);
          urls.push(`  <url>\n    <loc>${url(lang, route)}</loc>\n${SEO_LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${url(l, route)}" />`).join("\n")}\n    <changefreq>${route.startsWith("page/") ? "monthly" : "weekly"}</changefreq>\n    <priority>${route === "" ? "1.0" : route.startsWith("page/") ? "0.3" : "0.8"}</priority>\n  </url>`);
        }
      }
      writeFileSync(join(outDir, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`);
      writeFileSync(join(outDir, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: ${base}*/chart/\nDisallow: ${base}*/reading/\nDisallow: ${base}*/payment/\n\nSitemap: ${root}/sitemap.xml\n`);
    },
  };
}

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  // Served from the custom domain root (ulduz.space). Set VITE_BASE=/ulduz/ only for a github.io/<repo>/ build.
  base: process.env.VITE_BASE ?? "/",
  plugins: [react(), seo()],
  resolve: {
    alias: {
      "@shared": r("./supabase/functions/_shared"),
      "@": r("./src"),
      // Edge functions (Deno) import npm packages with the npm: specifier; map it for the browser build.
      "npm:astronomy-engine@2.1.19": "astronomy-engine",
    },
  },
  test: { environment: "node" },
  build: { chunkSizeWarningLimit: 700 },
});
