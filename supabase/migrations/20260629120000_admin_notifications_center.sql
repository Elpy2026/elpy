create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.admin_notifications
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.admin_notifications
  add column if not exists is_read boolean not null default false;

alter table public.admin_notifications
  add column if not exists created_at timestamptz not null default now();

alter table public.admin_notifications
  drop constraint if exists admin_notifications_type_check;

alter table public.admin_notifications
  add constraint admin_notifications_type_check
  check (
    type in (
      'new_user',
      'new_request',
      'new_application',
      'new_review',
      'new_report',
      'stripe_payment_completed',
      'new_kyc_request',
      'request_completed'
    )
  );

alter table public.admin_notifications
  drop constraint if exists admin_notifications_payload_check;

alter table public.admin_notifications
  add constraint admin_notifications_payload_check
  check (
    length(title) <= 160
    and length(message) <= 1000
    and jsonb_typeof(metadata) = 'object'
  );

create index if not exists admin_notifications_is_read_created_at_idx
  on public.admin_notifications (is_read, created_at desc);

create index if not exists admin_notifications_created_at_idx
  on public.admin_notifications (created_at desc);

alter table public.admin_notifications enable row level security;

alter table public.admin_notifications replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.admin_notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

drop policy if exists "Admins can read admin notifications" on public.admin_notifications;
create policy "Admins can read admin notifications"
  on public.admin_notifications
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

drop policy if exists "Admins can update admin notifications" on public.admin_notifications;
create policy "Admins can update admin notifications"
  on public.admin_notifications
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

drop policy if exists "Authenticated users can create admin notifications" on public.admin_notifications;
create policy "Authenticated users can create admin notifications"
  on public.admin_notifications
  for insert
  to authenticated
  with check (
    type in (
      'new_user',
      'new_request',
      'new_application',
      'new_review',
      'new_report',
      'new_kyc_request',
      'request_completed'
    )
    and length(title) <= 160
    and length(message) <= 1000
    and jsonb_typeof(metadata) = 'object'
    and is_read = false
  );
