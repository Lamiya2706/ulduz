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

### 5. Telegram bot
The bot (`supabase/functions/telegram-bot`) sends each person their **daily horoscope with moon notes every morning**,
**transit alerts** on the days a slow planet's transit begins or becomes exact, and a **natal chart summary**. People either
connect their Ulduz account (account page → **Connect Telegram**, a one-time `t.me/<bot>?start=<code>` link) or type their
birth details in the chat. The texts come straight from the website's content library (`src/content/…`), so the bot and the
site always say the same thing. Commands: `/today`, `/chart`, `/transits`, `/settings` (hour, time zone, on/off), `/new`, `/lang`, `/stop`.

The morning messages are sent by `telegram-daily`, which a pg_cron job calls every hour; each chat gets its message at its
own local hour (default 08:00, Asia/Baku). The job authenticates with a random secret that the migration creates in Vault.

1. In Telegram, open **@BotFather** → `/newbot`, choose a name and a username ending in `bot`. Copy the token.
2. Save it as the Edge Function secret `TELEGRAM_BOT_TOKEN` (Supabase dashboard → Edge Functions → Secrets). It's the only secret:
   the webhook's secret token is derived from it.
3. `npx supabase db push` (adds `tg_chats`, `tg_link_codes`, the hourly job) and `npx supabase functions deploy telegram-bot telegram-daily`.
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
