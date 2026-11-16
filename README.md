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

### 5. Telegram bot (optional)
The bot (`supabase/functions/telegram-bot`) asks for name, birth date, time and city, sends a short chart
(Sun, Moon, Ascendant, Life Path), opens the full chart on the website as a Telegram Mini App, and sells the
personal reading through the same orders and Epoint checkout. After payment it sends the reading link to the chat.

1. In Telegram, open **@BotFather** → `/newbot` → choose a name and a username. Copy the token.
2. Add the secrets (pick any long random string for the webhook secret) and deploy:
   ```bash
   npx supabase secrets set TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=...
   npx supabase db push                       # adds tg_sessions, tg_order_tokens, orders.tg_chat_id
   npx supabase functions deploy telegram-bot epoint-callback create-payment
   ```
3. Point Telegram at the function and register the commands:
   ```bash
   curl "https://api.telegram.org/bot$TOKEN/setWebhook" \
     -d url=https://YOUR-REF.supabase.co/functions/v1/telegram-bot \
     -d secret_token=$TELEGRAM_WEBHOOK_SECRET -d 'allowed_updates=["message","callback_query"]'
   curl "https://api.telegram.org/bot$TOKEN/setMyCommands" -H 'content-type: application/json' \
     -d '{"commands":[{"command":"start","description":"Start / Başla / Начать"},{"command":"new","description":"New chart / Yeni xəritə / Новая карта"},{"command":"lang","description":"Language / Dil / Язык"}]}'
   ```
4. Optional: a menu button that opens the website as a Mini App —
   `curl "https://api.telegram.org/bot$TOKEN/setChatMenuButton" -H 'content-type: application/json' -d '{"menu_button":{"type":"web_app","text":"Ulduz","web_app":{"url":"https://ulduz.space"}}}'`

Mini App buttons need the site on **HTTPS** (enable "Enforce HTTPS" in GitHub Pages first).

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
