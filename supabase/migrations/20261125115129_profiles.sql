-- One profile per signed-in user. Already applied to the ulduz project (25 Nov 2026); kept here so the repo matches the database.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text check (char_length(full_name) <= 120),
  birth_date date,
  birth_time text check (birth_time is null or birth_time ~ '^\d{2}:\d{2}$'),
  birth_place text check (char_length(birth_place) <= 200),
  lat double precision,
  lon double precision,
  tz text,
  lang text check (lang in ('az','en','ru'))
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: insert own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, lang)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), 120),
    case when new.raw_user_meta_data->>'lang' in ('az','en','ru') then new.raw_user_meta_data->>'lang' end
  )
  on conflict (id) do nothing;
  return new;
end; $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
