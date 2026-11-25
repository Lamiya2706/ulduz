# Ulduz ✦

A premium astrology & numerology website in **Azerbaijani, English and Russian**.
Visitors get a real, astronomically calculated natal chart for free, and can unlock a
**personal AI reading for 2 ₼** (written by Claude), paid via **Epoint**.

**Couples compatibility** (`/az/couple`): two birth charts compared with synastry — harmony scores
(emotional bond, attraction, communication, commitment, growth), the strongest planet contacts between
the charts, element and Life Path match, and house overlays. A **couple reading for 2 ₼** is written by
Claude from both charts, with 3 follow-up questions.

## What's inside

| Part | Tech |
|---|---|
| Web app | React 19 + TypeScript + Vite, Tailwind, Framer Motion, react-i18next |
| Chart engine | `astronomy-engine` — tropical zodiac, whole-sign houses, historic time zones (`supabase/functions/_shared/astro.ts`) |
| Backend | Supabase (Postgres + Edge Functions in Deno) |
| AI reading | Anthropic Messages API, streamed to the browser |
| Payments | Epoint hosted checkout + signed result callback |

```
src/                     web app (pages, components, i18n UI strings, interpretation content)
  content/{az,en,ru}.ts  interpretation library (signs, houses, aspects, numerology…)
  content/compat/        compatibility texts (synastry contacts, harmony areas, elements, Life Path)
  i18n/{az,en,ru}.ts     UI strings
supabase/
  migrations/            database schema (all tables private, RLS on)
  functions/_shared/     chart engine, synastry, numerology, prompt builder, Epoint & Anthropic clients
  functions/*            create-payment, epoint-callback, check-status, get-order, generate-reading, ask-question
scripts/build-cities.mjs builds public/cities.json (1,800+ cities with time zones)
```

The free chart is computed **in the browser** (no server needed). The server only recomputes the
chart when someone pays, so the AI always reads verified data.

## Run locally

```bash
npm install
npm run dev            # http://localhost:5173 — the free chart works without any backend
npm test               # chart engine & numerology tests (incl. a published reference chart)
cd supabase/functions && deno test --allow-env tests/   # Epoint signature, validation, prompt
```

## Deploy — step by step

### 1. Supabase
1. Create a project at supabase.com (free tier is fine to start).
2. Install the CLI and link: `npx supabase login && npx supabase link --project-ref YOUR-REF`
3. Create the tables: `npx supabase db push` (or paste both `supabase/migrations/*.sql` files, in order, into the SQL editor).
4. Copy `supabase/.env.example` → `supabase/.env`, fill it in, then `npx supabase secrets set --env-file supabase/.env`
5. Deploy the functions: `npx supabase functions deploy`

Start with `PAYMENT_MODE=test` — orders are marked paid instantly so you can test the AI reading end to end.

### 2. Anthropic
Create an API key at console.anthropic.com and **set a monthly spend limit**. A reading costs roughly
$0.04–0.06 with Claude Sonnet; a follow-up question about $0.02.

### 3. Epoint
1. Sign the merchant agreement (you need a VÖEN and a bank account) and get your public + private keys.
2. In the Epoint merchant cabinet set the **Result URL** to
   `https://YOUR-REF.supabase.co/functions/v1/epoint-callback`
3. Put the keys into the secrets, set `PAYMENT_MODE=epoint`, and redeploy the functions.
4. Make a real 2 ₼ test payment before announcing the site.

### 4a. Website on GitHub Pages (free, already set up)
`.github/workflows/pages.yml` builds and deploys on every push to `main`.
1. Repo **Settings → Pages → Source: GitHub Actions**. (Pages on a *private* repo needs a paid GitHub plan; on GitHub Free the repo must be public. No secrets live in this code.)
2. The site appears at `https://<username>.github.io/ulduz/`.
3. Once the backend exists, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under **Settings → Secrets and variables → Actions → Variables**, and set the Supabase secret `SITE_URL=https://<username>.github.io/ulduz`.

### 4b. Website on Vercel or Netlify (alternative)
Import the GitHub repo, set the two `VITE_…` variables from `.env.example`, build command `npm run build`,
output `dist`. SPA routing is already configured (`vercel.json`, `public/_redirects`).
Then set `SITE_URL` / `ALLOWED_ORIGINS` in Supabase secrets to your final domain.

### 5. Installable app and push notifications
The site is a PWA: `public/manifest.webmanifest`, icons in `public/icons/`, and a service worker `public/sw.js`
(offline app shell, cached static files, never caches Supabase calls or sign-in links). Signed-in people can add it to the
home screen and turn on a daily horoscope notification from the home page.

Push needs a one-time setup in Supabase:
1. VAPID keys: generate a pair (`npx web-push generate-vapid-keys`), put the **public** key in `src/lib/push.ts`
   (or `VITE_VAPID_PUBLIC_KEY`), and set the secrets `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:…`.
2. A random `PUSH_CRON_SECRET` secret, and the same value in Vault: `select vault.create_secret('<value>', 'push_cron_secret');`
3. `npx supabase db push` (table `push_subscriptions`) and `npx supabase functions deploy daily-push`.
4. Enable the `pg_cron` and `pg_net` extensions and schedule the hourly run (SQL at the end of the push migration).
   Each subscription gets one message a day at 8:00 in its own time zone.

### 6. Telegram bot
The bot (`supabase/functions/telegram-bot`) sends each person their **daily horoscope with moon notes every morning**,
**transit alerts** on the days a slow planet's transit begins or becomes exact, and a **natal chart summary**. People either
connect their Ulduz account (account page → **Connect Telegram**, a one-time `t.me/<bot>?start=<code>` link) or type their
birth details in the chat. The texts come straight from the website's content library (`src/content/…`), so the bot and the
site always say the same thing. Commands: `/today`, `/chart`, `/transits`, `/match` (compatibility with someone, from the
site's synastry), `/settings` (hour, time zone, morning and weekly messages on/off), `/new`, `/lang`, `/stop`.
On New and Full Moon days the morning message adds a section about them (the Full Moon one uses the site's Full Moon texts),
and on Sunday at 19:00 local time the bot sends the week ahead (best days, Moon phases, Mercury stations, transits starting).
Typing `@UlduzSpaceBot` in any chat offers today's horoscope to share there (turn on **Inline mode** in @BotFather → `/setinline`).

The morning messages are sent by `telegram-daily`, which a pg_cron job calls every hour; each chat gets its message at its
own local hour (default 08:00, Asia/Baku). The job authenticates with a random secret that the migration creates in Vault.

1. In Telegram, open **@BotFather** → `/newbot`, choose a name and a username ending in `bot`. Copy the token.
2. Save it as the Edge Function secret `TELEGRAM_BOT_TOKEN` (Supabase dashboard → Edge Functions → Secrets). It's the only secret:
   the webhook's secret token is derived from it.
3. Run `supabase/migrations/20261125160000_telegram.sql` (SQL editor or `npx supabase db push`). The functions deploy from GitHub Actions
   (`.github/workflows/functions.yml`) on every push to `main` that touches them; it needs the repository secret `SUPABASE_ACCESS_TOKEN`
   (supabase.com → Account → Access Tokens). By hand: `npx supabase functions deploy telegram-bot telegram-daily --use-api`.
4. Run `select public.tg_run_daily();` once in the SQL editor: it registers the webhook and the command menu (the hourly job also checks this).
5. If the username isn't `UlduzSpaceBot`, set the Actions variable `VITE_TELEGRAM_BOT` to it, so the account page links to the right bot.

## Before launch — checklist
- [ ] Fill the `[placeholders]` in `src/pages/staticContent.ts` (legal name, VÖEN, email…) and have Terms / Privacy / Refunds reviewed.
- [ ] `PAYMENT_MODE=epoint` (never leave `test` on in production — it gives readings away free).
- [ ] Anthropic spend limit set.
- [ ] A native speaker proof-reads `src/content/az.ts`, `src/content/ru.ts`, `src/content/compat/*` and the UI strings.
- [ ] Optional: schedule `select public.cleanup_orphan_charts();` daily with pg_cron.

## Notes
- Russian static texts use the masculine "ты" forms; the AI reading is instructed to stay gender-neutral.
- To add a 4th language: add `src/i18n/xx.ts`, `src/content/xx.ts`, register it in `src/i18n/index.ts` and `src/content/index.ts`.
- Astrology and numerology are symbolic languages, not science — the site says so on every result page.
