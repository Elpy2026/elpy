create table if not exists public.community_waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  city text not null,
  postal_code text,
  intended_use text,
  privacy_accepted boolean not null default false,
  source text not null default 'landing',
  created_at timestamptz not null default now()
);

create unique index if not exists community_waitlist_email_unique
on public.community_waitlist (lower(email));

alter table public.community_waitlist enable row level security;

create policy "Anyone can join community waitlist"
on public.community_waitlist
for insert
to anon, authenticated
with check (privacy_accepted = true);
