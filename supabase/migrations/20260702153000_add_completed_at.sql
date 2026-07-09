alter table public.requests
add column if not exists completed_at timestamptz;
