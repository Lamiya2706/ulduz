-- Couples compatibility: an order can cover two charts.
alter table public.orders
  add column kind text not null default 'natal' check (kind in ('natal','couple')),
  add column partner_chart_id uuid references public.charts(id) on delete cascade;
alter table public.orders add constraint couple_needs_partner check (kind = 'natal' or partner_chart_id is not null);
create index orders_partner_chart_idx on public.orders(partner_chart_id);

-- Keep partner charts when cleaning up orphan charts.
create or replace function public.cleanup_orphan_charts() returns void language sql security definer as $$
  delete from public.charts c where c.created_at < now() - interval '30 days'
    and not exists (select 1 from public.orders o where (o.chart_id = c.id or o.partner_chart_id = c.id) and o.status in ('paid','refunded'));
$$;
