-- Request expenses: spese anticipate dall'helper per una richiesta

create table if not exists public.request_expenses (
  id uuid primary key default gen_random_uuid(),

  request_id uuid not null references public.requests(id) on delete cascade,
  helper_id uuid not null references public.profiles(id) on delete cascade,

  receipt_image_path text,
  receipt_amount numeric(10,2) not null check (receipt_amount >= 0),

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'contested', 'rejected')),

  notes text,
  contest_reason text,

  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  contested_at timestamptz,
  rejected_at timestamptz
);

create index if not exists request_expenses_request_id_idx
  on public.request_expenses(request_id);

create index if not exists request_expenses_helper_id_idx
  on public.request_expenses(helper_id);

create index if not exists request_expenses_status_idx
  on public.request_expenses(status);

alter table public.request_expenses enable row level security;

-- Helper: può vedere le proprie spese
create policy "Helpers can view own expenses"
on public.request_expenses
for select
using (auth.uid() = helper_id);

-- Richiedente: può vedere le spese delle proprie richieste
create policy "Seekers can view expenses for own requests"
on public.request_expenses
for select
using (
  exists (
    select 1
    from public.requests r
    where r.id = request_expenses.request_id
      and r.seeker_id = auth.uid()
  )
);

-- Helper: può inserire spese solo sulle richieste accettate da lui
create policy "Helpers can create expenses for accepted requests"
on public.request_expenses
for insert
with check (
  auth.uid() = helper_id
  and exists (
    select 1
    from public.requests r
    where r.id = request_expenses.request_id
      and r.helper_id = auth.uid()
      and r.status in ('accettata', 'completata')
  )
);

-- Richiedente: può approvare/contestare le spese delle proprie richieste
create policy "Seekers can update expenses for own requests"
on public.request_expenses
for update
using (
  exists (
    select 1
    from public.requests r
    where r.id = request_expenses.request_id
      and r.seeker_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.requests r
    where r.id = request_expenses.request_id
      and r.seeker_id = auth.uid()
  )
);
