alter table public.penalties
add column if not exists stripe_checkout_session_id text,
add column if not exists stripe_payment_intent_id text,
add column if not exists paid_at timestamptz,
add column if not exists updated_at timestamptz not null default now();

update public.penalties
set status = 'pending'
where status not in ('pending', 'paid', 'cancelled');

alter table public.penalties
drop constraint if exists penalties_status_check;

alter table public.penalties
add constraint penalties_status_check
check (status in ('pending', 'paid', 'cancelled'));

alter table public.penalties
drop constraint if exists penalties_amount_check;

alter table public.penalties
add constraint penalties_amount_check
check (amount > 0);

create unique index if not exists penalties_stripe_checkout_session_unique
on public.penalties (stripe_checkout_session_id)
where stripe_checkout_session_id is not null;

create unique index if not exists penalties_stripe_payment_intent_unique
on public.penalties (stripe_payment_intent_id)
where stripe_payment_intent_id is not null;

create unique index if not exists penalties_one_pending_per_request_user
on public.penalties (request_id, user_id)
where status = 'pending';

drop policy if exists users_can_update_own_penalties
on public.penalties;

drop policy if exists users_can_insert_own_penalties
on public.penalties;

create policy users_can_insert_valid_own_penalties
on public.penalties
for insert
to authenticated
with check (
  auth.uid() = user_id
  and status = 'pending'
  and amount > 0
  and stripe_checkout_session_id is null
  and stripe_payment_intent_id is null
  and paid_at is null
  and exists (
    select 1
    from public.requests
    where requests.id = penalties.request_id
      and requests.cancelled_by = auth.uid()
      and requests.cancellation_fee_status = 'pending'
      and requests.cancellation_fee_amount = penalties.amount
  )
);

drop policy if exists users_can_read_own_penalties
on public.penalties;

create policy users_can_read_own_penalties
on public.penalties
for select
to authenticated
using (auth.uid() = user_id);

create index if not exists penalties_user_status_created_at_idx
on public.penalties (user_id, status, created_at desc);