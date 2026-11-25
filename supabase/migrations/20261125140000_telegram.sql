-- Telegram bot: one row per private chat, one-time codes that link a chat to an Ulduz account,
-- and an hourly job that sends each chat its morning horoscope at its own local hour.

create table public.tg_chats (
  chat_id bigint primary key,
  user_id uuid unique references auth.users(id) on delete set null,   -- the linked Ulduz account, if any
  lang text not null default 'az' check (lang in ('az','en','ru')),
  step text not null default 'lang',                                  -- where the chat conversation is
  data jsonb not null default '{}'::jsonb,                            -- answers collected so far
  birth jsonb,                                                        -- birth details typed in the bot (used when the account has none)
  daily boolean not null default true,                                -- morning message on/off
  send_hour smallint not null default 8 check (send_hour between 0 and 23),
  tz text not null default 'Asia/Baku' check (char_length(tz) <= 64),
  last_daily date,                                                    -- local date of the last morning message
  blocked boolean not null default false,                             -- the person blocked the bot; stop sending
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tg_chats enable row level security;   -- service role only (the edge functions); no policies
create index tg_chats_daily_idx on public.tg_chats (send_hour) where daily and not blocked;
create trigger tg_chats_touch before update on public.tg_chats for each row execute function public.touch_updated_at();

-- One-time codes for the "Connect Telegram" deep link (t.me/<bot>?start=<code>). Only a hash is stored.
create table public.tg_link_codes (
  code_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '30 minutes'
);
alter table public.tg_link_codes enable row level security;
create index tg_link_codes_user_idx on public.tg_link_codes (user_id);

-- Called from the account page: a fresh code for the signed-in person (older codes are dropped).
create or replace function public.telegram_link_code() returns text
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  code text := encode(extensions.gen_random_bytes(18), 'hex');
begin
  if uid is null then raise exception 'not signed in'; end if;
  delete from public.tg_link_codes where user_id = uid or expires_at < now();
  insert into public.tg_link_codes (code_hash, user_id) values (encode(extensions.digest(code, 'sha256'), 'hex'), uid);
  return code;
end; $$;

-- Whether the signed-in person has a Telegram chat linked.
create or replace function public.telegram_linked() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.tg_chats where user_id = (select auth.uid()));
$$;

-- Disconnects the signed-in person's Telegram chat (the chat keeps any birth details typed in the bot).
create or replace function public.telegram_unlink() returns void
language sql security definer set search_path = '' as $$
  update public.tg_chats set user_id = null where user_id = (select auth.uid());
$$;

revoke execute on function public.telegram_link_code(), public.telegram_linked(), public.telegram_unlink() from public, anon;
grant execute on function public.telegram_link_code(), public.telegram_linked(), public.telegram_unlink() to authenticated;

-- ---------- Hourly morning sender ----------
-- The job authenticates to the telegram-daily function with a random secret kept in Vault;
-- the function checks it through tg_cron_ok(), which only the service role can call.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'telegram_cron_secret', 'Authenticates the hourly job to the telegram-daily edge function')
where not exists (select 1 from vault.secrets where name = 'telegram_cron_secret');

create or replace function public.tg_cron_ok(secret text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from vault.decrypted_secrets where name = 'telegram_cron_secret' and decrypted_secret = secret);
$$;
revoke execute on function public.tg_cron_ok(text) from public, anon, authenticated;
grant execute on function public.tg_cron_ok(text) to service_role;

-- Calls the function; also used once by hand right after the bot token is saved (it registers the webhook).
create or replace function public.tg_run_daily() returns bigint
language sql security definer set search_path = '' as $$
  select net.http_post(
    url := 'https://sjxvmmcsrqdzuapfktnh.supabase.co/functions/v1/telegram-daily',
    headers := jsonb_build_object('content-type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'telegram_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$$;
revoke execute on function public.tg_run_daily() from public, anon, authenticated;

select cron.schedule('telegram-daily', '0 * * * *', 'select public.tg_run_daily()');
