alter table public.profiles
add column if not exists stripe_account_id text,
add column if not exists stripe_account_created_at timestamptz,
add column if not exists stripe_onboarding_completed boolean not null default false,
add column if not exists stripe_payouts_enabled boolean not null default false,
add column if not exists stripe_charges_enabled boolean not null default false;
