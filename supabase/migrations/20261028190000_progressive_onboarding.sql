begin;
create table public.progressive_onboarding_settings(id boolean primary key default true check(id),enabled boolean not null default false);
insert into public.progressive_onboarding_settings(id,enabled) values(true,false);
alter table public.progressive_onboarding_settings enable row level security;
revoke all on public.progressive_onboarding_settings from public,anon,authenticated;
grant all on public.progressive_onboarding_settings to service_role;
create table public.payment_customers(user_id uuid primary key references auth.users(id) on delete cascade,customer_id text unique not null);
create table public.request_payment_setup(
 request_id uuid not null references public.requests(id) on delete cascade,
 helper_id uuid not null references public.profiles(id),seeker_id uuid not null references public.profiles(id),
 customer_id text not null,session_id text unique not null,setup_intent_id text,ready boolean not null default false,
 primary key(request_id,helper_id)
);
alter table public.payment_customers enable row level security;
alter table public.request_payment_setup enable row level security;
revoke all on public.payment_customers,public.request_payment_setup from public,anon,authenticated;
grant all on public.payment_customers,public.request_payment_setup to service_role;
create function public.enforce_progressive_request_access() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='UPDATE' then
  if new.id is distinct from old.id or new.seeker_id is distinct from old.seeker_id then raise exception 'Non puoi cambiare il titolare della richiesta.'; end if;
  if new.helper_id is distinct from old.helper_id and auth.role()='authenticated' and auth.uid() is distinct from old.seeker_id then raise exception 'Solo il richiedente può scegliere l’helper.'; end if;
 end if;
 if TG_OP='INSERT' then
  if not exists(select 1 from public.profiles where id=new.seeker_id and verified) then raise exception 'Verifica identità richiesta per pubblicare.'; end if;
 end if;
 if new.status='accettata' and (select enabled from public.progressive_onboarding_settings where id) and (TG_OP='INSERT' or old.status is distinct from new.status or old.helper_id is distinct from new.helper_id) then
  if not exists(select 1 from public.profiles where id=new.helper_id and verified) then raise exception 'L’helper deve verificare l’identità.'; end if;
  if not exists(select 1 from public.request_payment_setup where request_id=new.id and helper_id=new.helper_id and seeker_id=new.seeker_id and ready) then raise exception 'Collega il metodo di pagamento prima di confermare l’incarico.'; end if;
  -- The cancellation clock starts only when both sides are ready.
  if not exists(select 1 from public.profiles where id=new.helper_id and stripe_onboarding_completed and stripe_payouts_enabled) then new.accepted_at:=null; else new.accepted_at:=now(); end if;
 end if;
 if new.status='completata' and exists(select 1 from public.request_payment_setup where request_id=new.id and helper_id=new.helper_id) then
  if not exists(select 1 from public.profiles where id=new.helper_id and verified and stripe_onboarding_completed and stripe_payouts_enabled) then raise exception 'Prima di iniziare l’helper deve completare il conto Stripe per ricevere i compensi.'; end if;
 end if;
 return new;
end $$;
create trigger progressive_request_access before insert or update on public.requests for each row execute function public.enforce_progressive_request_access();
create function public.enforce_verified_application() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=new.helper_id and verified) then raise exception 'Verifica identità richiesta per candidarti.'; end if;
 return new;
end $$;
create trigger verified_application before insert on public.request_applications for each row execute function public.enforce_verified_application();
-- Verification and Stripe flags can only be changed by the server or existing administrators.
create function public.protect_profile_verification() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='INSERT' then
  if auth.role()='authenticated' and (coalesce(new.verified,false) or coalesce(new.is_admin,false) or new.stripe_account_id is not null or coalesce(new.stripe_onboarding_completed,false) or coalesce(new.stripe_payouts_enabled,false) or coalesce(new.stripe_charges_enabled,false)) then raise exception 'Questi stati sono gestiti dalle verifiche del servizio.'; end if;
  return new;
 end if;
 if auth.role()='authenticated' and not exists(select 1 from public.profiles where id=auth.uid() and is_admin) and
 (new.verified is distinct from old.verified or new.is_admin is distinct from old.is_admin or new.stripe_account_id is distinct from old.stripe_account_id or new.stripe_onboarding_completed is distinct from old.stripe_onboarding_completed or new.stripe_payouts_enabled is distinct from old.stripe_payouts_enabled or new.stripe_charges_enabled is distinct from old.stripe_charges_enabled) then
 raise exception 'Questi stati sono gestiti dalle verifiche del servizio.';
 end if;
 return new;
end $$;
create trigger protect_profile_verification before insert or update on public.profiles for each row execute function public.protect_profile_verification();
revoke all on function public.enforce_progressive_request_access(),public.enforce_verified_application(),public.protect_profile_verification() from public,anon,authenticated;
commit;
