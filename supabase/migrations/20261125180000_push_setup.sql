-- Daily push setup, following the reminders pattern: secrets live in private.settings (never in the repo).
-- 'push_cron_secret' is generated here; 'vapid_private_key' is inserted by hand (its public half is in src/lib/push.ts).
insert into private.settings (key, value)
  values ('push_cron_secret', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
  on conflict (key) do nothing;

-- The VAPID private key, only for a caller that knows the cron secret (and only for the service role).
create or replace function public.push_config(s text) returns text
language sql stable security definer set search_path = '' as $$
  select v.value from private.settings v
  where v.key = 'vapid_private_key'
    and exists (select 1 from private.settings c where c.key = 'push_cron_secret' and c.value = s)
$$;
revoke execute on function public.push_config(text) from public, anon, authenticated;
grant execute on function public.push_config(text) to service_role;

-- Every hour at :05; each subscription gets its message once a day at its local hour.
select cron.schedule('daily-push', '5 * * * *', $job$
  select net.http_post(
    url := 'https://sjxvmmcsrqdzuapfktnh.supabase.co/functions/v1/daily-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from private.settings where key = 'push_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  )
$job$);
