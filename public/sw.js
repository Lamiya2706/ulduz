/* Ulduz service worker: offline app shell, cached static files, and daily horoscope push notifications.
 * Only same-origin files (and Google Fonts) are cached. Supabase, sign-in links (?code=…) and payments always go to the network.
 * __BUILD__ is replaced at build time, so every deploy installs a fresh worker and drops the old caches. */
const VERSION = "__BUILD__";
const SHELL = `ulduz-shell-${VERSION}`;
const ASSETS = "ulduz-assets";
const STATIC = "ulduz-static";
const PAGES = "ulduz-pages";
const scope = new URL(self.registration.scope);
const shellUrl = new URL("index.html", scope).href;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    const res = await fetch(shellUrl, { cache: "no-cache" });
    if (!res.ok) return;
    const html = await res.clone().text();
    await cache.put(shellUrl, res);
    // The entry script and stylesheet of this build, so the app opens offline right away.
    const assets = [...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"]+)"/g)].map((m) => new URL(m[1], scope).href);
    const ac = await caches.open(ASSETS);
    await Promise.all(assets.map((u) => ac.add(u).catch(() => {})));
  })());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("ulduz-shell-") && k !== SHELL).map((k) => caches.delete(k)));
    await trim(ASSETS, 120);
    await self.clients.claim();
  })());
});

async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

const isFont = (url) => url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin !== location.origin) {
    if (isFont(url)) event.respondWith(staleWhileRevalidate(req, STATIC));
    return; // Supabase, analytics, payments: straight to the network
  }
  if (req.mode === "navigate") { event.respondWith(page(req, url)); return; }
  if (url.pathname.includes("/assets/")) { event.respondWith(cacheFirst(req, ASSETS)); return; }
  if (/\.(json|png|svg|webmanifest|woff2?)$/.test(url.pathname)) { event.respondWith(staleWhileRevalidate(req, STATIC)); return; }
});

/** Pages: always the network first (fresh content, auth redirects); offline, the last copy or the app shell. */
async function page(req, url) {
  try {
    const res = await fetch(req);
    // Never keep a page that carries a one-time sign-in code or a payment result.
    if (res.ok && !url.search) (await caches.open(PAGES)).put(req, res.clone()).then(() => trim(PAGES, 40));
    return res;
  } catch (err) {
    const cached = (await caches.match(req, { ignoreSearch: true })) || (await caches.match(shellUrl));
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(req, name) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) (await caches.open(name)).put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  const net = fetch(req).then((res) => { if (res.ok || res.type === "opaque") cache.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || net;
}

/* ---------- Push notifications ---------- */

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data ? event.data.text() : "" }; }
  event.waitUntil(self.registration.showNotification(data.title || "Ulduz", {
    body: data.body || "",
    tag: data.tag || "ulduz",
    icon: new URL("icons/icon-192.png", scope).href,
    badge: new URL("icons/badge-96.png", scope).href,
    data: { url: new URL(data.url || "./", scope).href },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || scope.href;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) {
      if (new URL(w.url).origin === location.origin && "focus" in w) {
        await w.focus();
        if ("navigate" in w) await w.navigate(target).catch(() => {});
        return;
      }
    }
    await self.clients.openWindow(target);
  })());
});
