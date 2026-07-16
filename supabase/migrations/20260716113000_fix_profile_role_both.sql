-- ELPYO: ogni utente può chiedere e offrire aiuto.
-- Corregge il trigger che trasformava erroneamente il ruolo "both" in "seeker"
-- e riallinea i profili esistenti.

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
  accepted_terms_value boolean;
  accepted_privacy_value boolean;
  marketing_consent_value boolean;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'both');

  if user_role not in ('seeker', 'helper', 'both') then
    user_role := 'both';
  end if;

  accepted_terms_value :=
    coalesce((new.raw_user_meta_data->>'accepted_terms')::boolean, false);

  accepted_privacy_value :=
    coalesce((new.raw_user_meta_data->>'accepted_privacy')::boolean, false);

  marketing_consent_value :=
    coalesce((new.raw_user_meta_data->>'marketing_consent')::boolean, false);

  insert into public.profiles (
    id,
    full_name,
    role,
    phone,
    city,
    postal_code,
    prelaunch_interest,
    joined_prelaunch_at,
    launch_access,
    verified,
    is_admin,
    accepted_terms,
    accepted_privacy,
    marketing_consent,
    accepted_terms_at,
    accepted_privacy_at,
    marketing_consent_at
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    user_role,
    nullif(new.raw_user_meta_data->>'phone', ''),
    nullif(new.raw_user_meta_data->>'city', ''),
    nullif(new.raw_user_meta_data->>'postal_code', ''),
    nullif(new.raw_user_meta_data->>'prelaunch_interest', ''),
    case
      when coalesce(
        (new.raw_user_meta_data->>'prelaunch_signup')::boolean,
        false
      )
      then now()
      else null
    end,
    false,
    false,
    false,
    accepted_terms_value,
    accepted_privacy_value,
    marketing_consent_value,
    case when accepted_terms_value then now() else null end,
    case when accepted_privacy_value then now() else null end,
    case when marketing_consent_value then now() else null end
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    role = excluded.role,
    phone = excluded.phone,
    city = excluded.city,
    postal_code = excluded.postal_code,
    prelaunch_interest = excluded.prelaunch_interest,
    joined_prelaunch_at = coalesce(
      public.profiles.joined_prelaunch_at,
      excluded.joined_prelaunch_at
    ),
    accepted_terms = excluded.accepted_terms,
    accepted_privacy = excluded.accepted_privacy,
    marketing_consent = excluded.marketing_consent,
    accepted_terms_at = coalesce(
      public.profiles.accepted_terms_at,
      excluded.accepted_terms_at
    ),
    accepted_privacy_at = coalesce(
      public.profiles.accepted_privacy_at,
      excluded.accepted_privacy_at
    ),
    marketing_consent_at = coalesce(
      public.profiles.marketing_consent_at,
      excluded.marketing_consent_at
    );

  insert into public.admin_notifications (
    type,
    title,
    message,
    metadata,
    is_read
  )
  values (
    'new_user',
    'Nuovo utente pre-lancio',
    coalesce(
      new.raw_user_meta_data->>'full_name',
      'Un nuovo utente'
    ) || ' si è unito alla community ELPYO.',
    jsonb_build_object(
      'user_id', new.id,
      'email', new.email,
      'full_name', new.raw_user_meta_data->>'full_name',
      'role', user_role,
      'city', new.raw_user_meta_data->>'city',
      'postal_code', new.raw_user_meta_data->>'postal_code',
      'prelaunch_interest',
      new.raw_user_meta_data->>'prelaunch_interest'
    ),
    false
  )
  on conflict do nothing;

  return new;
end;
$$;

alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (role in ('seeker', 'helper', 'both'));

update public.profiles
set role = 'both'
where role is null
   or role in ('seeker', 'helper')
   or role not in ('seeker', 'helper', 'both');
