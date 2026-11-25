-- Telegram bot: the Sunday evening week-ahead message (on by default; /settings turns it off).
alter table public.tg_chats add column if not exists weekly boolean not null default true;
alter table public.tg_chats add column if not exists last_weekly date;  -- local date of the last weekly message
