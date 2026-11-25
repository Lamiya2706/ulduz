-- Web push for the daily horoscope: one row per browser/device a signed-in person turned notifications on in.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  endpoint text not null unique check (endpoint ~ '^https://' and char_length(endpoint) <= 1000),
  p256dh text not null check (char_length(p256dh) between 80 and 100),
  auth text not null check (char_length(auth) between 16 and 40),
  lang text check (lang in ('az','en','ru')),
  tz text check (char_length(tz) <= 64),
  hour smallint not null default 8 check (hour between 0 and 23), -- local hour to send at
  last_sent_on date,                                                -- local date of the last message
  failures smallint not null default 0
);
create index push_subscriptions_user on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;
-- People can see their own rows; writes go through the two functions below (an endpoint can move between accounts on a shared device).
create policy "push: read own" on public.push_subscriptions for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text, p_lang text, p_tz text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, lang, tz)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth, p_lang, p_tz)
  on conflict (endpoint) do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, lang = excluded.lang, tz = excluded.tz, failures = 0;
end; $$;

create or replace function public.delete_push_subscription(p_endpoint text)
returns void language sql security definer set search_path = '' as $$
  delete from public.push_subscriptions where endpoint = p_endpoint and user_id = auth.uid();
$$;

revoke execute on function public.save_push_subscription(text, text, text, text, text) from public, anon;
revoke execute on function public.delete_push_subscription(text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text, text, text) to authenticated;
grant execute on function public.delete_push_subscription(text) to authenticated;

-- The hourly schedule is set up once by hand, because it needs the project URL and a secret (see README → Push notifications):
--   select cron.schedule('daily-push', '5 * * * *', $$ select net.http_post(
--     url := 'https://<ref>.supabase.co/functions/v1/daily-push',
--     headers := jsonb_build_object('Content-Type', 'application/json',
--       'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'push_cron_secret')),
--     body := '{}'::jsonb) $$);
