create index if not exists penalties_user_status_idx
on public.penalties (user_id, status);

create index if not exists penalties_request_id_idx
on public.penalties (request_id);

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