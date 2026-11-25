-- Already applied to the ulduz project (25 Nov 2026): cleanup_orphan_charts can no longer be called through the public API.
create or replace function public.cleanup_orphan_charts() returns void language sql security definer set search_path = '' as $$
  delete from public.charts c where c.created_at < now() - interval '30 days'
    and not exists (select 1 from public.orders o where (o.chart_id = c.id or o.partner_chart_id = c.id) and o.status in ('paid','refunded'));
$$;
revoke execute on function public.cleanup_orphan_charts() from public, anon, authenticated;
