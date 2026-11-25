-- Email reminders (New and Full Moon, birthday, slow-planet transits), opt-in per profile.

-- 1. Opt-in and a private unsubscribe token per profile.
alter table public.profiles
  add column email_reminders boolean not null default false,
  add column unsubscribe_token uuid not null default gen_random_uuid();
create unique index profiles_unsubscribe_token_idx on public.profiles (unsubscribe_token);

-- 2. Every reminder that was sent, so each one goes out only once. Only the server reads or writes it.
create table public.reminder_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table public.reminder_log enable row level security;

-- 3. Who gets reminders: confirmed emails with reminders on and a birth date. Server only.
create or replace function public.reminder_recipients()
returns table (id uuid, email text, full_name text, birth_date date, birth_time text, lat double precision, lon double precision, tz text, lang text, unsubscribe_token uuid)
language sql stable security definer set search_path = '' as $$
  select p.id, u.email::text, p.full_name, p.birth_date, p.birth_time, p.lat, p.lon, p.tz, p.lang, p.unsubscribe_token
  from public.profiles p join auth.users u on u.id = p.id
  where p.email_reminders and p.birth_date is not null and u.email is not null and u.email_confirmed_at is not null
$$;
revoke execute on function public.reminder_recipients() from public, anon, authenticated;
grant execute on function public.reminder_recipients() to service_role;

-- 4. A random secret for the daily job, created and kept inside the database (never in the repo).
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.settings (key text primary key, value text not null);
insert into private.settings (key, value)
  values ('reminders_cron_secret', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
  on conflict (key) do nothing;

create or replace function public.check_reminders_secret(s text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.settings where key = 'reminders_cron_secret' and value = s)
$$;
revoke execute on function public.check_reminders_secret(text) from public, anon, authenticated;
grant execute on function public.check_reminders_secret(text) to service_role;

-- 5. Run the sender every day at 05:00 UTC (09:00 in Baku).
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('send-reminders', '0 5 * * *', $job$
  select net.http_post(
    url := 'https://sjxvmmcsrqdzuapfktnh.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from private.settings where key = 'reminders_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  )
$job$);
