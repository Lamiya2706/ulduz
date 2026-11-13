-- Ulduz schema. All tables are private: RLS is enabled with no policies,
-- so only Edge Functions (service role) can read or write.

create extension if not exists pgcrypto;

create table public.charts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  birth_date date not null,
  birth_time text,
  lat double precision,
  lon double precision,
  tz text not null,
  place text,
  code text not null,          -- URL code of the free chart page
  chart jsonb not null,        -- server-computed chart
  numerology jsonb not null
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  chart_id uuid not null references public.charts(id) on delete cascade,
  token_hash text not null,    -- sha-256 of the private access token (the token itself is never stored)
  amount numeric(10,2) not null,
  currency text not null default 'AZN',
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  lang text not null check (lang in ('az','en','ru')),
  email text,
  provider text not null default 'epoint',
  provider_transaction text,
  provider_payload jsonb,
  ip text,
  paid_at timestamptz
);
create index orders_chart_idx on public.orders(chart_id);
create index orders_ip_created_idx on public.orders(ip, created_at);

create table public.readings (
  order_id uuid primary key references public.orders(id) on delete cascade,
  lang text not null,
  content text not null default '',
  status text not null check (status in ('generating','done','error')),
  attempts int not null default 0,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  question text not null,
  answer text not null,
  created_at timestamptz not null default now()
);
create index questions_order_idx on public.questions(order_id);

alter table public.charts enable row level security;
alter table public.orders enable row level security;
alter table public.readings enable row level security;
alter table public.questions enable row level security;

-- Free charts that never became an order are not needed: delete them after 30 days (run daily with pg_cron, optional).
create or replace function public.cleanup_orphan_charts() returns void language sql security definer as $$
  delete from public.charts c where c.created_at < now() - interval '30 days'
    and not exists (select 1 from public.orders o where o.chart_id = c.id and o.status in ('paid','refunded'));
$$;
