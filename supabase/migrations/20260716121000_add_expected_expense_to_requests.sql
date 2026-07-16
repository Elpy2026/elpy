alter table public.requests
add column if not exists expense_expected boolean not null default false,
add column if not exists estimated_expense numeric(10, 2);

alter table public.requests
drop constraint if exists requests_estimated_expense_check;

alter table public.requests
add constraint requests_estimated_expense_check
check (
  estimated_expense is null
  or estimated_expense >= 0
);

update public.requests
set
  expense_expected = false,
  estimated_expense = null
where expense_expected is null;