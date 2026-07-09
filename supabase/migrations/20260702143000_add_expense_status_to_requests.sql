-- Stato approvazione spese anticipate sulla richiesta

alter table public.requests
add column if not exists expense_status text not null default 'none'
check (expense_status in ('none', 'pending', 'approved', 'contested'));

create index if not exists requests_expense_status_idx
on public.requests(expense_status);

-- Allinea le richieste che hanno già spese caricate
update public.requests r
set expense_status = 'pending'
where exists (
  select 1
  from public.request_expenses e
  where e.request_id = r.id
    and e.status = 'pending'
);
