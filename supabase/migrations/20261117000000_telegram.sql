-- Telegram bot: per-chat conversation state, and orders that came from a chat.

create table public.tg_sessions (
  chat_id bigint primary key,
  lang text not null default 'az' check (lang in ('az','en','ru')),
  step text not null default 'lang',
  data jsonb not null default '{}'::jsonb,   -- answers collected so far + the last computed birth input
  updated_at timestamptz not null default now()
);
alter table public.tg_sessions enable row level security;

-- Private access tokens for orders placed from Telegram, so the bot can send the reading link
-- once Epoint confirms payment. Service-role only (RLS on, no policies).
create table public.tg_order_tokens (
  order_id uuid primary key references public.orders(id) on delete cascade,
  chat_id bigint not null,
  token text not null,
  notified_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.tg_order_tokens enable row level security;

alter table public.orders add column tg_chat_id bigint;
create index orders_tg_chat_created_idx on public.orders(tg_chat_id, created_at);
